<script lang="ts">
	import ThemeToggle from '$lib/components/layout/theme-toggle.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="absolute right-4 top-4">
		<ThemeToggle />
	</div>
	<div class="w-full max-w-md px-4">
		{@render children()}
	</div>
</div>
