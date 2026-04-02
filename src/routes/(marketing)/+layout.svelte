<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { APP_NAME } from '$lib/config';
	import ThemeToggle from '$lib/components/layout/theme-toggle.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header class="border-b">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<a href="/" class="text-xl font-bold">{APP_NAME}</a>
			<nav class="flex items-center gap-2">
				<ThemeToggle />
				{#if data.user}
					<Button href="/dashboard" variant="default">Dashboard</Button>
				{:else}
					<Button href="/login" variant="ghost">Sign in</Button>
					<Button href="/register">Get started</Button>
				{/if}
			</nav>
		</div>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="border-t py-6">
		<div class="container mx-auto flex flex-col items-center gap-2 px-4">
			<p class="text-sm text-muted-foreground">
				&copy; {new Date().getFullYear()}
				{APP_NAME}. All rights reserved.
			</p>
			<p class="text-xs text-muted-foreground/60">
				Built with <a href="https://i60.co" target="_blank" rel="noopener" class="hover:underline"
					>i60.co</a
				> SvelteKit template
			</p>
		</div>
	</footer>
</div>
