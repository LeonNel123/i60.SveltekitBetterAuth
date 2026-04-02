<script lang="ts">
	import { browser } from '$app/environment';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { Button } from '$lib/components/ui/button';

	let dark = $state(browser && document.documentElement.classList.contains('dark'));

	function toggle() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}
</script>

<Button variant="ghost" size="icon" onclick={toggle} aria-label="Toggle theme">
	{#if dark}
		<Sun class="h-4 w-4" />
	{:else}
		<Moon class="h-4 w-4" />
	{/if}
</Button>
