<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { TaskStatus } from '$lib/types';

	let { status }: { status: TaskStatus } = $props();

	const config = $derived(
		({
			todo: { label: 'To Do', variant: 'outline' as const },
			in_progress: { label: 'In Progress', variant: 'default' as const },
			done: { label: 'Done', variant: 'secondary' as const }
		})[status]
	);
</script>

<Badge variant={config.variant}>{config.label}</Badge>
