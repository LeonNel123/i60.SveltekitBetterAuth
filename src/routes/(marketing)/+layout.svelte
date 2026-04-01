<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header class="border-b">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<a href="/" class="text-xl font-bold">Bokeros</a>
			<nav class="flex items-center gap-4">
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

	<footer class="border-t py-8">
		<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
			&copy; {new Date().getFullYear()} Bokeros. All rights reserved.
		</div>
	</footer>
</div>
