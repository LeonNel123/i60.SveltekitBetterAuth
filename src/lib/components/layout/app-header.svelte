<script lang="ts">
	import ThemeToggle from './theme-toggle.svelte';
	import UserMenu from './user-menu.svelte';

	interface Props {
		user: { name: string; email: string };
	}

	let { user }: Props = $props();
</script>

<header class="flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
	<div class="flex-1"></div>
	<ThemeToggle />
	<UserMenu {user} />
</header>
