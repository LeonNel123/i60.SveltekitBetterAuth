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
	import { formatDate, formatFileSize } from '$lib/utils/format';
	import FileText from '@lucide/svelte/icons/file-text';
	import Search from '@lucide/svelte/icons/search';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Download from '@lucide/svelte/icons/download';
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
		searchTimeout = setTimeout(() => {
			searching = true;
			goto(
				buildRelativeUrl(page.url.pathname, page.url.search, {
					q: searchValue.trim() || null
				}),
				{ replaceState: true, keepFocus: true }
			).finally(() => {
				searching = false;
			});
		}, 300);
	}

	function setTagFilter(tagId: string) {
		goto(
			buildRelativeUrl(page.url.pathname, page.url.search, {
				tag: tagId || null
			}),
			{ replaceState: true }
		);
	}

	function mimeSubtype(mimeType: string): string {
		const sub = mimeType.split('/')[1] ?? mimeType;
		return sub.toUpperCase();
	}
</script>

<svelte:head>
	<title>Documents — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<PageHeader title="Documents" description="Browse all uploaded documents." />

		<div class="flex items-center gap-4">
			<div class="relative max-w-sm flex-1">
				{#if searching}
					<LoaderCircle class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
				{:else}
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				{/if}
				<Input
					placeholder="Search documents..."
					class="pl-9"
					bind:value={searchValue}
					oninput={handleSearch}
				/>
			</div>
			{#if data.documents.length > 0}
				<p class="text-sm text-muted-foreground">
					{data.documents.length} document{data.documents.length !== 1 ? 's' : ''}
				</p>
			{/if}
		</div>

		{#if data.tags.length > 0}
			<div class="flex flex-wrap gap-1.5">
				<Button
					variant={!data.tagFilter ? 'default' : 'outline'}
					size="sm"
					onclick={() => setTagFilter('')}>All</Button
				>
				{#each data.tags as t (t.id)}
					<Button
						variant={data.tagFilter === t.id ? 'default' : 'outline'}
						size="sm"
						onclick={() => setTagFilter(t.id)}>{t.name}</Button
					>
				{/each}
			</div>
		{/if}

		{#if data.documents.length === 0}
			<EmptyState
				icon={FileText}
				title={data.search || data.tagFilter ? 'No documents found' : 'No documents yet'}
				description={data.search || data.tagFilter
					? 'Try adjusting your search or filter.'
					: 'Documents uploaded to clients will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Client</TableHead>
							<TableHead>Tags</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Size</TableHead>
							<TableHead>Uploaded</TableHead>
							<TableHead class="text-right">Download</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.documents as doc (doc.id)}
							<TableRow class="hover:bg-muted/50">
								<TableCell class="py-3.5 font-medium">{doc.name}</TableCell>
								<TableCell class="py-3.5">
									{#if doc.clientId && doc.clientName}
										<a
											href={resolve(`/clients/${doc.clientId}`)}
											class="text-primary underline-offset-4 hover:underline"
										>
											{doc.clientName}
										</a>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</TableCell>
								<TableCell class="py-3.5">
									{#if doc.tags?.length}
										<div class="flex flex-wrap gap-1">
											{#each doc.tags as t (t.id)}
												<Badge variant="outline" class="text-xs">{t.name}</Badge>
											{/each}
										</div>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</TableCell>
								<TableCell class="py-3.5 text-muted-foreground">{mimeSubtype(doc.mimeType)}</TableCell>
								<TableCell class="py-3.5 text-muted-foreground">{formatFileSize(doc.size)}</TableCell>
								<TableCell class="py-3.5 text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
								<TableCell class="py-3.5 text-right">
									<Button variant="ghost" size="sm" href={resolve(`/api/documents/${doc.id}`)}>
										<Download class="h-4 w-4" />
										<span class="sr-only">Download {doc.name}</span>
									</Button>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</div>
</OrgGuard>
