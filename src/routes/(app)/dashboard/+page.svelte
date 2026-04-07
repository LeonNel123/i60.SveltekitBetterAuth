<script lang="ts">
	import { APP_NAME } from '$lib/config';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import User from '@lucide/svelte/icons/user';
	import Building2 from '@lucide/svelte/icons/building-2';
	import UserCog from '@lucide/svelte/icons/user-cog';
	import Shield from '@lucide/svelte/icons/shield';
	import type { PageProps } from './$types';
	import { currentGreeting } from '$lib/utils/format';

	let { data }: PageProps = $props();
	const greeting = currentGreeting();

	const quickLinks = [
		{ href: '/settings/profile', label: 'Profile', description: 'Update your personal details', icon: User },
		{ href: '/settings/organization', label: 'Organisation', description: 'Manage your organisation settings', icon: Building2 },
		{ href: '/settings/members', label: 'Members', description: 'Invite and manage team members', icon: UserCog },
		{ href: '/settings/security', label: 'Security', description: 'Password and two-factor authentication', icon: Shield }
	];
</script>

<svelte:head>
	<title>Dashboard — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{greeting}, {data.userName}. Welcome to {APP_NAME}.
			</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each quickLinks as link (link.href)}
				<Card class="rounded-xl transition-colors hover:bg-accent/50">
					<a href={link.href} class="block p-6">
						<CardHeader class="flex flex-row items-center gap-3 p-0 pb-2">
							<div class="rounded-md bg-primary/10 p-2">
								<link.icon class="h-4 w-4 text-primary" />
							</div>
							<CardTitle class="text-sm font-semibold">{link.label}</CardTitle>
						</CardHeader>
						<CardContent class="p-0">
							<p class="text-xs text-muted-foreground">{link.description}</p>
						</CardContent>
					</a>
				</Card>
			{/each}
		</div>

		<Card class="rounded-xl">
			<CardHeader>
				<CardTitle class="text-lg font-semibold">Getting Started</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3 text-sm text-muted-foreground">
				<p>This is a SvelteKit + Better Auth template with organisation management, role-based access, and two-factor authentication built in.</p>
				<p>Start building your application by adding routes under <code class="rounded bg-muted px-1.5 py-0.5 text-xs">src/routes/(app)/</code> and extending the database schema in <code class="rounded bg-muted px-1.5 py-0.5 text-xs">src/lib/server/db/schema.ts</code>.</p>
				<div class="pt-2">
					<Button variant="outline" href={'/settings/organization'}>
						Set up your organisation
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</OrgGuard>
