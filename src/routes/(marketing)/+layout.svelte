<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { APP_NAME } from '$lib/config';
	import ThemeToggle from '$lib/components/layout/theme-toggle.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
		<div class="container mx-auto flex h-14 items-center justify-between px-4">
			<a href="/" class="text-base font-bold tracking-tight">{APP_NAME}</a>
			<nav class="flex items-center gap-1.5">
				<ThemeToggle />
				{#if data.user}
					<Button href="/dashboard" size="sm">Dashboard</Button>
				{:else}
					<Button href="/login" variant="ghost" size="sm">Sign in</Button>
					<Button href="/register" size="sm">Get started</Button>
				{/if}
			</nav>
		</div>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="border-t py-8">
		<div class="container mx-auto flex flex-col items-center gap-2 px-4">
			<p class="text-sm text-muted-foreground">
				&copy; {new Date().getFullYear()}
				{APP_NAME}
			</p>
			<p class="text-xs text-muted-foreground/50">
				Built with <a
					href="https://i60.co"
					target="_blank"
					rel="noopener"
					class="underline decoration-muted-foreground/30 underline-offset-2 hover:decoration-muted-foreground/60"
					>i60.co</a
				> SvelteKit template
			</p>
		</div>
	</footer>
</div>
