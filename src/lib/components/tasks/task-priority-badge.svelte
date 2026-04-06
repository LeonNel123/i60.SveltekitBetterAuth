<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { TaskPriority } from '$lib/types';

	let { priority }: { priority: TaskPriority } = $props();

	const config = $derived(
		{
			low: {
				label: 'Low',
				class: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
			},
			medium: {
				label: 'Medium',
				class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
			},
			high: {
				label: 'High',
				class: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
			},
			urgent: {
				label: 'Urgent',
				class: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 font-medium'
			}
		}[priority]
	);
</script>

<Badge variant="outline" class={config.class}>{config.label}</Badge>
