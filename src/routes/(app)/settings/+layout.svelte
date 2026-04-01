<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const tabs = [
		{ href: '/settings/profile', label: 'Profile' },
		{ href: '/settings/organization', label: 'Organization' },
		{ href: '/settings/members', label: 'Members' },
		{ href: '/settings/security', label: 'Security' }
	];
</script>

<div class="space-y-6">
	<h1 class="text-3xl font-bold tracking-tight">Settings</h1>

	<nav class="flex gap-1 border-b">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class="px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2
					{page.url.pathname === tab.href
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	<div>
		{@render children()}
	</div>
</div>
