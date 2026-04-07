<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import { timeAgo } from '$lib/utils/format';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';

	type Note = {
		id: string;
		content: string;
		createdAt: Date | string;
		[key: string]: unknown;
	};

	let {
		notes,
		form
	}: {
		notes: Note[];
		form: Record<string, unknown> | null;
	} = $props();

	let loading = $state(false);
	let editingNoteId = $state<string | null>(null);
	let editContent = $state('');
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
				<Textarea name="content" placeholder="Write a note..." rows={3} required />
				<div class="flex justify-end">
					<Button type="submit" size="sm" disabled={loading}>
						{loading ? 'Adding...' : 'Add Note'}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	{#if notes.length === 0}
		<EmptyState
			icon={StickyNote}
			title="No notes yet"
			description="Add notes to track conversations, decisions, and follow-ups with this client."
		/>
	{:else}
		<div class="space-y-2">
			{#each notes as n (n.id)}
				<Card>
					<CardContent class="py-4">
						{#if editingNoteId === n.id}
							<!-- Inline edit form -->
							<form
								method="POST"
								action="?/editNote"
								use:enhance={() => {
									return async ({ result, update }) => {
										await update();
										if (result.type === 'success') {
											editingNoteId = null;
											toast.success('Note updated');
										}
									};
								}}
								class="space-y-2"
							>
								<input type="hidden" name="noteId" value={n.id} />
								<Textarea
									name="content"
									value={editContent}
									oninput={(e) => {
										editContent = (e.target as HTMLTextAreaElement).value;
									}}
									rows={3}
									required
								/>
								<div class="flex justify-end gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => {
											editingNoteId = null;
										}}
									>
										Cancel
									</Button>
									<Button type="submit" size="sm">Save</Button>
								</div>
							</form>
						{:else}
							<!-- Note display -->
							<div class="flex items-start justify-between gap-2">
								<p class="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{n.content}</p>
								<div class="flex shrink-0 items-center gap-1">
									<form
										method="POST"
										action="?/promoteNote"
										use:enhance={() => {
											return async ({ result, update }) => {
												await update();
												if (result.type === 'success') {
													toast.success('Note promoted to task');
												}
											};
										}}
									>
										<input type="hidden" name="noteId" value={n.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											class="h-7 w-7 text-muted-foreground hover:text-foreground"
											title="Promote note to task"
										>
											<ClipboardList class="h-3.5 w-3.5" />
										</Button>
									</form>
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 text-muted-foreground hover:text-foreground"
										onclick={() => {
											editingNoteId = n.id;
											editContent = n.content;
										}}
										title="Edit note"
									>
										<Pencil class="h-3.5 w-3.5" />
									</Button>
									<form
										method="POST"
										action="?/deleteNote"
										use:enhance={() => {
											return async ({ result, update }) => {
												await update();
												if (result.type === 'success') {
													toast.success('Note deleted');
												}
											};
										}}
									>
										<input type="hidden" name="noteId" value={n.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											class="h-7 w-7 text-muted-foreground hover:text-destructive"
											title="Delete note"
										>
											<Trash2 class="h-3.5 w-3.5" />
										</Button>
									</form>
								</div>
							</div>
							<p class="mt-2 text-xs text-muted-foreground">
								{timeAgo(n.createdAt)}
							</p>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
