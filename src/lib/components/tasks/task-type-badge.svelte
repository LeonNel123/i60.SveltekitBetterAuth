<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { taskTypeLabel } from '$lib/tasks';
	import type { TaskType } from '$lib/types';

	let { taskType }: { taskType: TaskType | string } = $props();

	const config = $derived(
		{
			general: {
				label: 'General',
				class: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
			},
			renewal: {
				label: 'Renewal',
				class: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
			},
			claim: {
				label: 'Claim',
				class: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
			},
			document: {
				label: 'Document',
				class: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
			},
			compliance: {
				label: 'Compliance',
				class: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20'
			},
			internal: {
				label: 'Internal',
				class: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20'
			}
		}[taskType] ?? {
			label: taskTypeLabel(taskType),
			class: 'bg-muted text-muted-foreground border-border'
		}
	);
</script>

<Badge variant="outline" class={config.class}>{config.label}</Badge>
