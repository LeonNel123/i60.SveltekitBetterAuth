<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import { timeAgo } from '$lib/utils/format';
	import ActivityIcon from '@lucide/svelte/icons/activity';

	type Activity = {
		id: string;
		description: string;
		entityType: string;
		createdAt: Date | string;
		[key: string]: unknown;
	};

	let {
		activities
	}: {
		activities: Activity[];
	} = $props();
</script>

{#if activities.length === 0}
	<EmptyState
		icon={ActivityIcon}
		title="No activity yet"
		description="Actions on this client's policies, claims, and tasks will appear here."
	/>
{:else}
	<div class="space-y-2">
		{#each activities as a (a.id)}
			<div class="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
				<div class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40"></div>
				<div class="flex-1">
					<p class="text-sm">{a.description}</p>
					<p class="mt-1 text-xs text-muted-foreground">
						{timeAgo(a.createdAt)}
					</p>
				</div>
				<Badge variant="outline" class="shrink-0 text-xs capitalize">
					{a.entityType}
				</Badge>
			</div>
		{/each}
	</div>
{/if}
