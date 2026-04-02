<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Component } from 'svelte';

	let {
		icon: Icon,
		title,
		description,
		action
	}: {
		icon?: Component<{ class?: string }>;
		title: string;
		description?: string;
		action?: Snippet;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-lg border border-dashed p-16 text-center">
	{#if Icon}
		<div class="mb-4 rounded-full bg-muted p-3">
			<Icon class="h-8 w-8 text-muted-foreground/60" />
		</div>
	{/if}
	<h3 class="text-lg font-semibold">{title}</h3>
	{#if description}
		<p class="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
	{/if}
	{#if action}
		<div class="mt-5">
			{@render action()}
		</div>
	{/if}
</div>
