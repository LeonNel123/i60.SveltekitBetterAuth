<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { TaskStatus } from '$lib/types';

	let { status }: { status: TaskStatus } = $props();

	const config = $derived(
		({
			todo: { label: 'To Do', class: 'bg-muted text-muted-foreground border-border' },
			in_progress: { label: 'In Progress', class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
			done: { label: 'Done', class: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' }
		})[status]
	);
</script>

<Badge variant="outline" class={config.class}>{config.label}</Badge>
