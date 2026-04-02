<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { TaskPriority } from '$lib/types';

	let { priority }: { priority: TaskPriority } = $props();

	const config = $derived(
		({
			low: { label: 'Low', class: 'bg-muted text-muted-foreground border-muted' },
			medium: { label: 'Medium', class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
			high: { label: 'High', class: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
			urgent: { label: 'Urgent', class: 'bg-destructive/10 text-destructive border-destructive/20' }
		})[priority]
	);
</script>

<Badge variant="outline" class={config.class}>{config.label}</Badge>
