<script lang="ts">
	import { APP_NAME, APP_DESCRIPTION } from '$lib/config';
	import ThemeToggle from '$lib/components/layout/theme-toggle.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen">
	<!-- Brand panel — visible on large screens -->
	<div
		class="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex"
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,oklch(1_0_0/8%),transparent)]"
		></div>
		<a href="/" class="relative z-10 text-lg font-bold tracking-tight">{APP_NAME}</a>
		<div class="relative z-10">
			<blockquote class="text-lg/relaxed font-medium">
				{APP_DESCRIPTION}
			</blockquote>
		</div>
	</div>

	<!-- Form column -->
	<div class="flex flex-1 flex-col">
		<div class="flex items-center justify-between p-4 lg:justify-end">
			<a href="/" class="text-base font-bold tracking-tight lg:hidden">{APP_NAME}</a>
			<ThemeToggle />
		</div>
		<div class="flex flex-1 items-center justify-center px-4 pb-12">
			<div class="w-full max-w-md">
				{@render children()}
			</div>
		</div>
	</div>
</div>
