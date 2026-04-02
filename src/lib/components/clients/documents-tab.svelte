<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import { formatDate, formatFileSize } from '$lib/utils/format';
	import Upload from '@lucide/svelte/icons/upload';
	import Download from '@lucide/svelte/icons/download';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import FileText from '@lucide/svelte/icons/file-text';

	type Doc = {
		id: string;
		name: string;
		fileName: string;
		mimeType: string;
		size: number;
		storagePath: string;
		createdAt: Date | string;
		[key: string]: unknown;
	};

	type Tag = {
		id: string;
		name: string;
		[key: string]: unknown;
	};

	let {
		documents,
		tags,
		clientId,
		form
	}: {
		documents: Doc[];
		tags: Tag[];
		clientId: string;
		form: Record<string, unknown> | null;
	} = $props();

	let dialogOpen = $state(false);
	let loading = $state(false);

	// Delete state
	let deleteDialogOpen = $state(false);
	let deletingDoc = $state<Doc | null>(null);
	let deleteLoading = $state(false);

	function openUpload() {
		dialogOpen = true;
	}

	function openDelete(d: Doc) {
		deletingDoc = d;
		deleteDialogOpen = true;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-end">
		<Button size="sm" onclick={openUpload}>
			<Upload class="mr-2 h-4 w-4" />
			Upload Document
		</Button>
	</div>

	{#if documents.length === 0}
		<EmptyState
			icon={FileText}
			title="No documents"
			description="Upload documents for this client."
		/>
	{:else}
		<div class="overflow-x-auto rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Size</TableHead>
						<TableHead>Uploaded</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each documents as d (d.id)}
						<TableRow class="hover:bg-muted/50">
							<TableCell class="font-medium">{d.name}</TableCell>
							<TableCell class="text-muted-foreground">
								{d.mimeType.split('/').pop()}
							</TableCell>
							<TableCell class="text-muted-foreground">
								{formatFileSize(d.size)}
							</TableCell>
							<TableCell class="text-muted-foreground">
								{formatDate(d.createdAt)}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex justify-end gap-1">
									<Button
										variant="ghost"
										size="sm"
										href="/api/documents/{d.id}"
									>
										<Download class="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" onclick={() => openDelete(d)}>
										<Trash2 class="h-3.5 w-3.5" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</div>

<!-- Upload Document Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Upload Document</Dialog.Title>
			<Dialog.Description>Upload a file for this client.</Dialog.Description>
		</Dialog.Header>

		{#if form?.docError}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{form.docError}
			</div>
		{/if}

		<form
			method="POST"
			action="?/uploadDocument"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					await update();
					if (result.type === 'success') {
						dialogOpen = false;
						toast.success('Document uploaded');
					}
				};
			}}
			class="space-y-4"
		>
			<div class="grid gap-2">
				<Label for="file">File</Label>
				<Input id="file" name="file" type="file" required />
			</div>

			<div class="grid gap-2">
				<Label for="docName">Document Name</Label>
				<Input id="docName" name="name" placeholder="Optional — defaults to file name" />
			</div>

			{#if tags.length > 0}
				<div class="grid gap-2">
					<Label>Tags</Label>
					<div class="flex flex-wrap gap-3">
						{#each tags as t (t.id)}
							<label class="flex items-center gap-2 text-sm">
								<input type="checkbox" name="tagIds" value={t.id} class="accent-primary" />
								{t.name}
							</label>
						{/each}
					</div>
				</div>
			{/if}

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (dialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Uploading...' : 'Upload'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Document Confirmation -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Document</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete "{deletingDoc?.name}"? The file will be permanently removed.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteDocument"
				use:enhance={() => {
					deleteLoading = true;
					return async ({ result, update }) => {
						deleteLoading = false;
						await update();
						if (result.type === 'success') {
							deleteDialogOpen = false;
							deletingDoc = null;
							toast.success('Document deleted');
						}
					};
				}}
			>
				<input type="hidden" name="documentId" value={deletingDoc?.id ?? ''} />
				<AlertDialog.Action type="submit" variant="destructive" disabled={deleteLoading}>
					{deleteLoading ? 'Deleting...' : 'Delete'}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
