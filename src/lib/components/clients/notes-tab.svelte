<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { timeAgo } from '$lib/utils/format';

	type Note = {
		id: string;
		content: string;
		createdAt: Date | string;
		[key: string]: unknown;
	};

	let {
		notes,
		clientId,
		form
	}: {
		notes: Note[];
		clientId: string;
		form: Record<string, unknown> | null;
	} = $props();

	let loading = $state(false);
</script>

<div class="space-y-4">
	<!-- Add Note Form -->
	<Card>
		<CardContent class="pt-6">
			{#if form?.noteError}
				<div class="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.noteError}
				</div>
			{/if}
			<form
				method="POST"
				action="?/addNote"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						await update();
						if (result.type === 'success') {
							toast.success('Note added');
						}
					};
				}}
				class="space-y-3"
			>
				<Textarea
					name="content"
					placeholder="Write a note..."
					rows={3}
					required
				/>
				<div class="flex justify-end">
					<Button type="submit" size="sm" disabled={loading}>
						{loading ? 'Adding...' : 'Add Note'}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	{#if notes.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">No notes yet. Add one above to get started.</p>
	{:else}
		<div class="space-y-2">
			{#each notes as n (n.id)}
				<Card>
					<CardContent class="py-4">
						<p class="whitespace-pre-wrap text-sm leading-relaxed">{n.content}</p>
						<p class="mt-2 text-xs text-muted-foreground">
							{timeAgo(n.createdAt)}
						</p>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
