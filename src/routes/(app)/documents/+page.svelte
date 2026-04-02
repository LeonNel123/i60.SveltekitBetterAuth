<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/config';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
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
	import FileText from '@lucide/svelte/icons/file-text';
	import Search from '@lucide/svelte/icons/search';
	import Download from '@lucide/svelte/icons/download';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let searchValue = $state(data.search ?? '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const params = new URLSearchParams(page.url.searchParams);
			if (searchValue.trim()) {
				params.set('q', searchValue.trim());
			} else {
				params.delete('q');
			}
			goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
		}, 300);
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-ZA', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
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
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

		{#if data.documents.length === 0}
			<EmptyState
				icon={FileText}
				title={data.search ? 'No documents found' : 'No documents yet'}
				description={data.search
					? 'Try adjusting your search.'
					: 'Documents uploaded from client pages will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Client</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Size</TableHead>
							<TableHead>Uploaded</TableHead>
							<TableHead class="text-right">Download</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.documents as doc (doc.id)}
							<TableRow class="hover:bg-muted/50">
								<TableCell class="font-medium">{doc.name}</TableCell>
								<TableCell>
									{#if doc.clientId && doc.clientName}
										<a
											href="/clients/{doc.clientId}"
											class="text-primary underline-offset-4 hover:underline"
										>
											{doc.clientName}
										</a>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</TableCell>
								<TableCell class="text-muted-foreground">{mimeSubtype(doc.mimeType)}</TableCell>
								<TableCell class="text-muted-foreground">{formatSize(doc.size)}</TableCell>
								<TableCell class="text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
								<TableCell class="text-right">
									<Button variant="ghost" size="sm" href="/api/documents/{doc.id}">
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
