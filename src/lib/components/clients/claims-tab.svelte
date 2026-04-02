<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
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
	import * as Select from '$lib/components/ui/select';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import { CLAIM_STATUSES } from '$lib/types';
	import {
		formatDate,
		formatCurrency,
		claimStatusVariant,
		claimStatusLabel
	} from '$lib/utils/format';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';

	type Policy = {
		id: string;
		policyNumber: string;
		insurer: string;
		[key: string]: unknown;
	};

	type Claim = {
		id: string;
		claimNumber: string;
		policyId: string | null;
		status: string;
		description: string | null;
		dateOfLoss: string | null;
		amountClaimed: string | null;
		amountSettled: string | null;
		[key: string]: unknown;
	};

	let {
		claims,
		policies,
		clientId,
		form
	}: {
		claims: Claim[];
		policies: Policy[];
		clientId: string;
		form: Record<string, unknown> | null;
	} = $props();

	// Dialog state
	let dialogOpen = $state(false);
	let loading = $state(false);
	let editingClaim = $state<Claim | null>(null);

	// Delete state
	let deleteDialogOpen = $state(false);
	let deletingClaim = $state<Claim | null>(null);
	let deleteLoading = $state(false);

	// Form field states
	let claimPolicyId = $state('');
	let claimStatus = $state('open');

	function openAdd() {
		editingClaim = null;
		claimPolicyId = '';
		claimStatus = 'open';
		dialogOpen = true;
	}

	function openEdit(c: Claim) {
		editingClaim = c;
		claimPolicyId = c.policyId ?? '';
		claimStatus = c.status;
		dialogOpen = true;
	}

	function openDelete(c: Claim) {
		deletingClaim = c;
		deleteDialogOpen = true;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-end">
		<Button size="sm" onclick={openAdd}>
			<Plus class="mr-2 h-4 w-4" />
			Add Claim
		</Button>
	</div>

	{#if claims.length === 0}
		<EmptyState
			icon={AlertTriangle}
			title="No claims"
			description="No claims have been filed for this client."
		/>
	{:else}
		<div class="overflow-x-auto rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Claim Number</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Date of Loss</TableHead>
						<TableHead>Description</TableHead>
						<TableHead class="text-right">Claimed</TableHead>
						<TableHead class="text-right">Settled</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each claims as c (c.id)}
						<TableRow class="hover:bg-muted/50">
							<TableCell class="font-medium">{c.claimNumber}</TableCell>
							<TableCell>
								<Badge variant={claimStatusVariant(c.status)}>
									{claimStatusLabel(c.status)}
								</Badge>
							</TableCell>
							<TableCell class="text-muted-foreground">
								{formatDate(c.dateOfLoss)}
							</TableCell>
							<TableCell class="max-w-[200px] truncate text-muted-foreground">
								{c.description || '\u2014'}
							</TableCell>
							<TableCell class="text-right">
								{formatCurrency(c.amountClaimed)}
							</TableCell>
							<TableCell class="text-right">
								{formatCurrency(c.amountSettled)}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex justify-end gap-1">
									<Button variant="ghost" size="sm" onclick={() => openEdit(c)}>
										<Pencil class="h-3.5 w-3.5" />
									</Button>
									<Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" onclick={() => openDelete(c)}>
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

<!-- Add/Edit Claim Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{editingClaim ? 'Edit Claim' : 'Add Claim'}</Dialog.Title>
			<Dialog.Description>
				{editingClaim ? 'Update this claim.' : 'File a new claim for this client.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.claimError}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{form.claimError}
			</div>
		{/if}

		<form
			method="POST"
			action={editingClaim ? '?/editClaim' : '?/addClaim'}
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					await update();
					if (result.type === 'success') {
						const wasEditing = editingClaim !== null;
						dialogOpen = false;
						editingClaim = null;
						claimPolicyId = '';
						claimStatus = 'open';
						toast.success(wasEditing ? 'Claim updated' : 'Claim added');
					}
				};
			}}
			class="space-y-4"
		>
			{#if editingClaim}
				<input type="hidden" name="claimId" value={editingClaim.id} />
			{/if}

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="claimNumber">Claim Number</Label>
					<Input id="claimNumber" name="claimNumber" required placeholder="e.g. CLM-001" value={editingClaim?.claimNumber ?? ''} />
				</div>
				<div class="grid gap-2">
					<Label>Linked Policy</Label>
					<Select.Root type="single" name="policyId" value={claimPolicyId} onValueChange={(v) => (claimPolicyId = v)}>
						<Select.Trigger class="w-full">
							{#if claimPolicyId}
								{policies.find((p) => p.id === claimPolicyId)?.policyNumber ?? 'Select policy'}
							{:else}
								None
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each policies as p (p.id)}
								<Select.Item value={p.id}>
									{p.policyNumber} — {p.insurer}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label>Status</Label>
					<Select.Root type="single" name="status" value={claimStatus} onValueChange={(v) => (claimStatus = v)}>
						<Select.Trigger class="w-full">
							{claimStatusLabel(claimStatus)}
						</Select.Trigger>
						<Select.Content>
							{#each CLAIM_STATUSES as s}
								<Select.Item value={s}>{claimStatusLabel(s)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label for="dateOfLoss">Date of Loss</Label>
					<Input id="dateOfLoss" name="dateOfLoss" type="date" value={editingClaim?.dateOfLoss ?? ''} />
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="claimDescription">Description</Label>
				<Textarea id="claimDescription" name="description" placeholder="Describe the loss..." rows={3} value={editingClaim?.description ?? ''} />
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="amountClaimed">Amount Claimed (ZAR)</Label>
					<Input id="amountClaimed" name="amountClaimed" type="number" step="0.01" placeholder="0.00" value={editingClaim?.amountClaimed ?? ''} />
				</div>
				<div class="grid gap-2">
					<Label for="amountSettled">Amount Settled (ZAR)</Label>
					<Input id="amountSettled" name="amountSettled" type="number" step="0.01" placeholder="0.00" value={editingClaim?.amountSettled ?? ''} />
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (dialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Saving...' : editingClaim ? 'Update Claim' : 'Add Claim'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Claim Confirmation -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Claim</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete claim "{deletingClaim?.claimNumber}"? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteClaim"
				use:enhance={() => {
					deleteLoading = true;
					return async ({ result, update }) => {
						deleteLoading = false;
						await update();
						if (result.type === 'success') {
							deleteDialogOpen = false;
							deletingClaim = null;
							toast.success('Claim deleted');
						}
					};
				}}
			>
				<input type="hidden" name="claimId" value={deletingClaim?.id ?? ''} />
				<AlertDialog.Action type="submit" variant="destructive" disabled={deleteLoading}>
					{deleteLoading ? 'Deleting...' : 'Delete'}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
