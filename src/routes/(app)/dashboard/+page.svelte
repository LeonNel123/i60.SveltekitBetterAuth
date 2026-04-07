<script lang="ts">
	import { APP_NAME } from '$lib/config';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import User from '@lucide/svelte/icons/user';
	import Building2 from '@lucide/svelte/icons/building-2';
	import UserCog from '@lucide/svelte/icons/user-cog';
	import Shield from '@lucide/svelte/icons/shield';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { PageProps } from './$types';
	import { currentGreeting } from '$lib/utils/format';

	let { data }: PageProps = $props();
	const greeting = currentGreeting();

	const quickLinks = [
		{
			href: '/settings/profile',
			label: 'Profile',
			description: 'Update your personal details',
			icon: User
		},
		{
			href: '/settings/organization',
			label: 'Organisation',
			description: 'Manage your organisation',
			icon: Building2
		},
		{
			href: '/settings/members',
			label: 'Members',
			description: 'Invite and manage your team',
			icon: UserCog
		},
		{
			href: '/settings/security',
			label: 'Security',
			description: 'Password and 2FA settings',
			icon: Shield
		}
	];
</script>

<svelte:head>
	<title>Dashboard — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-8">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{greeting}, {data.userName}.
			</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each quickLinks as link (link.href)}
				<a
					href={link.href}
					class="group rounded-xl border bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
				>
					<div class="mb-3 inline-flex rounded-lg bg-primary/10 p-2">
						<link.icon class="h-4 w-4 text-primary" />
					</div>
					<p class="text-sm font-semibold">{link.label}</p>
					<p class="mt-1 text-xs text-muted-foreground">{link.description}</p>
					<div
						class="mt-3 flex items-center text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
					>
						Open <ArrowRight class="ml-1 h-3 w-3" />
					</div>
				</a>
			{/each}
		</div>

		<Card class="rounded-xl">
			<CardHeader>
				<CardTitle class="text-lg font-semibold">Getting Started</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3 text-sm text-muted-foreground">
				<p>
					This is a SvelteKit + Better Auth template with organisation management, role-based
					access, and two-factor authentication built in.
				</p>
				<p>
					Add routes under <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium"
						>src/routes/(app)/</code
					>
					and extend the schema in
					<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium"
						>src/lib/server/db/schema.ts</code
					>.
				</p>
				<div class="pt-2">
					<Button variant="outline" size="sm" href="/settings/organization">
						Set up your organisation
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</OrgGuard>
