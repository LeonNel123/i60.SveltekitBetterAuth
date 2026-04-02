<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Badge } from '$lib/components/ui/badge';
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
	import * as Select from '$lib/components/ui/select';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import { POLICY_TYPES, POLICY_STATUSES } from '$lib/types';
	import {
		formatDate,
		formatCurrency,
		policyTypeLabel,
		policyStatusVariant,
		policyStatusLabel
	} from '$lib/utils/format';
	import { Switch } from '$lib/components/ui/switch';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Star from '@lucide/svelte/icons/star';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

	type Policy = {
		id: string;
		policyNumber: string;
		insurer: string;
		type: string;
		status: string;
		startDate: string | null;
		endDate: string | null;
		premium: string | null;
		isActivePrimary: boolean;
		[key: string]: unknown;
	};

	let {
		policies,
		clientId,
		form
	}: {
		policies: Policy[];
		clientId: string;
		form: Record<string, unknown> | null;
	} = $props();

	// Dialog state
	let dialogOpen = $state(false);
	let loading = $state(false);
	let editingPolicy = $state<Policy | null>(null);

	// Delete state
	let deleteDialogOpen = $state(false);
	let deletingPolicy = $state<Policy | null>(null);
	let deleteLoading = $state(false);

	// Form field states
	let policyType = $state('other');
	let policyStatus = $state('active');
	let isPrimary = $state(false);

	function openAdd() {
		editingPolicy = null;
		policyType = 'other';
		policyStatus = 'active';
		isPrimary = false;
		dialogOpen = true;
	}

	function openEdit(p: Policy) {
		editingPolicy = p;
		policyType = p.type;
		policyStatus = p.status;
		isPrimary = p.isActivePrimary;
		dialogOpen = true;
	}

	function openDelete(p: Policy) {
		deletingPolicy = p;
		deleteDialogOpen = true;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-end">
		<Button size="sm" onclick={openAdd}>
			<Plus class="mr-2 h-4 w-4" />
			Add Policy
		</Button>
	</div>

	{#if policies.length === 0}
		<EmptyState
			icon={ShieldCheck}
			title="No policies"
			description="Add a policy to start tracking coverage."
		/>
	{:else}
		<div class="overflow-x-auto rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Policy Number</TableHead>
						<TableHead>Insurer</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Start</TableHead>
						<TableHead>End</TableHead>
						<TableHead class="text-right">Premium</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each policies as p (p.id)}
						<TableRow class="hover:bg-muted/50">
							<TableCell class="font-medium">
								{p.policyNumber}
								{#if p.isActivePrimary}
									<Badge variant="default" class="ml-1.5 gap-1 text-xs"><Star class="h-3 w-3" />Primary</Badge>
								{/if}
							</TableCell>
							<TableCell>{p.insurer}</TableCell>
							<TableCell>
								<Badge variant="outline">{policyTypeLabel(p.type)}</Badge>
							</TableCell>
							<TableCell>
								<Badge variant={policyStatusVariant(p.status)}>
									{policyStatusLabel(p.status)}
								</Badge>
							</TableCell>
							<TableCell class="text-muted-foreground">
								{formatDate(p.startDate)}
							</TableCell>
							<TableCell class="text-muted-foreground">
								{formatDate(p.endDate)}
							</TableCell>
							<TableCell class="text-right">
								{formatCurrency(p.premium)}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex justify-end gap-1">
									<Button variant="ghost" size="sm" onclick={() => openEdit(p)}>
										<Pencil class="h-3.5 w-3.5" />
									</Button>
									<Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" onclick={() => openDelete(p)}>
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

<!-- Add/Edit Policy Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{editingPolicy ? 'Edit Policy' : 'Add Policy'}</Dialog.Title>
			<Dialog.Description>
				{editingPolicy ? 'Update this insurance policy.' : 'Add a new insurance policy for this client.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.policyError}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{form.policyError}
			</div>
		{/if}

		<form
			method="POST"
			action={editingPolicy ? '?/editPolicy' : '?/addPolicy'}
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					await update();
					if (result.type === 'success') {
						const wasEditing = editingPolicy !== null;
						dialogOpen = false;
						editingPolicy = null;
						policyType = 'other';
						policyStatus = 'active';
						toast.success(wasEditing ? 'Policy updated' : 'Policy added');
					}
				};
			}}
			class="space-y-4"
		>
			{#if editingPolicy}
				<input type="hidden" name="policyId" value={editingPolicy.id} />
			{/if}

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="policyNumber">Policy Number</Label>
					<Input id="policyNumber" name="policyNumber" required placeholder="e.g. POL-001" value={editingPolicy?.policyNumber ?? ''} />
				</div>
				<div class="grid gap-2">
					<Label for="insurer">Insurer</Label>
					<Input id="insurer" name="insurer" required placeholder="e.g. Santam" value={editingPolicy?.insurer ?? ''} />
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label>Type</Label>
					<Select.Root type="single" name="type" value={policyType} onValueChange={(v) => (policyType = v)}>
						<Select.Trigger class="w-full">
							{policyTypeLabel(policyType)}
						</Select.Trigger>
						<Select.Content>
							{#each POLICY_TYPES as t}
								<Select.Item value={t}>{policyTypeLabel(t)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label>Status</Label>
					<Select.Root type="single" name="status" value={policyStatus} onValueChange={(v) => (policyStatus = v)}>
						<Select.Trigger class="w-full">
							{policyStatusLabel(policyStatus)}
						</Select.Trigger>
						<Select.Content>
							{#each POLICY_STATUSES as s}
								<Select.Item value={s}>{policyStatusLabel(s)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="startDate">Start Date</Label>
					<Input id="startDate" name="startDate" type="date" value={editingPolicy?.startDate ?? ''} />
				</div>
				<div class="grid gap-2">
					<Label for="endDate">End Date</Label>
					<Input id="endDate" name="endDate" type="date" value={editingPolicy?.endDate ?? ''} />
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="premium">Monthly Premium (ZAR)</Label>
				<Input id="premium" name="premium" type="number" step="0.01" placeholder="0.00" value={editingPolicy?.premium ?? ''} />
			</div>

			<div class="flex items-center gap-2">
				<Switch bind:checked={isPrimary} />
				<input type="hidden" name="isActivePrimary" value={isPrimary ? 'on' : ''} />
				<Label>Primary Policy</Label>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (dialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Add Policy'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Policy Confirmation -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Policy</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete policy "{deletingPolicy?.policyNumber}"? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deletePolicy"
				use:enhance={() => {
					deleteLoading = true;
					return async ({ result, update }) => {
						deleteLoading = false;
						await update();
						if (result.type === 'success') {
							deleteDialogOpen = false;
							deletingPolicy = null;
							toast.success('Policy deleted');
						}
					};
				}}
			>
				<input type="hidden" name="policyId" value={deletingPolicy?.id ?? ''} />
				<AlertDialog.Action type="submit" variant="destructive" disabled={deleteLoading}>
					{deleteLoading ? 'Deleting...' : 'Delete'}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
