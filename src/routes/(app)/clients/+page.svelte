<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/config';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import Users from '@lucide/svelte/icons/users';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import type { PageProps } from './$types';
	import { buildRelativeUrl } from '$lib/utils/query';

	let { data }: PageProps = $props();

	let searchValue = $state('');
	let searching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Keep searchValue in sync with server data (initial load + navigation)
	$effect(() => {
		searchValue = data.search ?? '';
	});

	function handleSearch() {
		clearTimeout(searchTimeout);
		searching = true;
		searchTimeout = setTimeout(() => {
			goto(
				buildRelativeUrl(page.url.pathname, page.url.search, {
					q: searchValue.trim() || null,
					page: null
				}),
				{ replaceState: true, keepFocus: true }
			).finally(() => {
				searching = false;
			});
		}, 300);
	}

	const totalPages = $derived(Math.ceil(data.total / data.perPage));
</script>

<svelte:head>
	<title>Clients — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<PageHeader title="Clients" description="Manage your insured clients.">
			{#snippet actions()}
				<Button href={resolve('/clients/new')}>
					<Plus class="mr-2 h-4 w-4" />
					New Client
				</Button>
			{/snippet}
		</PageHeader>

		<div class="flex items-center gap-4">
			<div class="relative max-w-sm flex-1">
				{#if searching}
					<LoaderCircle
						class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
					/>
				{:else}
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				{/if}
				<Input
					placeholder="Search clients..."
					class="pl-9"
					bind:value={searchValue}
					oninput={handleSearch}
				/>
			</div>
			{#if data.total > 0}
				<p class="text-sm text-muted-foreground">
					{data.total} client{data.total !== 1 ? 's' : ''}
				</p>
			{/if}
		</div>

		{#if data.clients.length === 0}
			<EmptyState
				icon={Users}
				title={data.search ? 'No clients found' : 'No clients yet'}
				description={data.search
					? 'Try adjusting your search.'
					: 'Get started by adding your first client.'}
			>
				{#snippet action()}
					{#if !data.search}
						<Button href={resolve('/clients/new')}>
							<Plus class="mr-2 h-4 w-4" />
							Add Client
						</Button>
					{/if}
				{/snippet}
			</EmptyState>
		{:else}
			<div class="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead class="text-right">ID / Reg No.</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.clients as c (c.id)}
							<TableRow class="cursor-pointer hover:bg-muted/50 transition-colors">
								<TableCell class="py-3.5 font-medium">
									<a href={resolve(`/clients/${c.id}`)} class="hover:underline">{c.name}</a>
								</TableCell>
								<TableCell class="py-3.5">
									<Badge variant="outline">
										{c.type === 'individual' ? 'Individual' : 'Company'}
									</Badge>
								</TableCell>
								<TableCell class="py-3.5 text-muted-foreground">{c.email || '—'}</TableCell>
								<TableCell class="py-3.5 text-muted-foreground">{c.phone || '—'}</TableCell>
								<TableCell class="py-3.5 text-right text-muted-foreground">
									{c.idNumber || c.registrationNumber || '—'}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>

			{#if totalPages > 1}
				<div class="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={data.page <= 1}
						href={buildRelativeUrl(page.url.pathname, page.url.search, {
							page: String(data.page - 1),
							q: data.search || null
						})}>Previous</Button
					>
					<span class="text-sm text-muted-foreground">Page {data.page} of {totalPages}</span>
					<Button
						variant="outline"
						size="sm"
						disabled={data.page >= totalPages}
						href={buildRelativeUrl(page.url.pathname, page.url.search, {
							page: String(data.page + 1),
							q: data.search || null
						})}>Next</Button
					>
				</div>
			{/if}
		{/if}
	</div>
</OrgGuard>
