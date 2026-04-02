<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { CLIENT_TYPES } from '$lib/types';

	let {
		client,
		formResult,
		submitLabel = 'Save'
	}: {
		client?: {
			id?: string;
			type: string;
			name: string;
			email: string | null;
			phone: string | null;
			idNumber: string | null;
			registrationNumber: string | null;
			address: string | null;
		};
		formResult?: { error?: string; success?: boolean } | null;
		submitLabel?: string;
	} = $props();

	let clientType = $state('individual');
	let loading = $state(false);

	// Sync clientType with client prop (initial load + prop change)
	$effect(() => {
		clientType = client?.type ?? 'individual';
	});
</script>

<form
	method="POST"
	use:enhance={() => {
		loading = true;
		return async ({ result, update }) => {
			loading = false;
			await update();
			if (result.type === 'success' && client) {
				toast.success('Client saved successfully');
			}
		};
	}}
	class="space-y-4"
>
	{#if formResult?.error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{formResult.error}
		</div>
	{/if}

	<div class="grid gap-2">
		<Label for="type">Client Type</Label>
		<Select.Root type="single" name="type" value={clientType} onValueChange={(v) => (clientType = v)}>
			<Select.Trigger class="w-full">
				{clientType === 'individual' ? 'Individual' : 'Company'}
			</Select.Trigger>
			<Select.Content>
				{#each CLIENT_TYPES as t}
					<Select.Item value={t}>{t === 'individual' ? 'Individual' : 'Company'}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="grid gap-2">
		<Label for="name">Name</Label>
		<Input id="name" name="name" value={client?.name ?? ''} required placeholder={clientType === 'individual' ? 'Full name' : 'Company name'} />
	</div>

	{#if clientType === 'individual'}
		<div class="grid gap-2">
			<Label for="idNumber">SA ID Number</Label>
			<Input id="idNumber" name="idNumber" value={client?.idNumber ?? ''} placeholder="e.g. 9001015009087" />
		</div>
	{:else}
		<div class="grid gap-2">
			<Label for="registrationNumber">Registration Number</Label>
			<Input id="registrationNumber" name="registrationNumber" value={client?.registrationNumber ?? ''} placeholder="e.g. 2024/123456/07" />
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="grid gap-2">
			<Label for="email">Email</Label>
			<Input id="email" name="email" type="email" value={client?.email ?? ''} placeholder="client@example.com" />
		</div>
		<div class="grid gap-2">
			<Label for="phone">Phone</Label>
			<Input id="phone" name="phone" type="tel" value={client?.phone ?? ''} placeholder="083 123 4567" />
		</div>
	</div>

	<div class="grid gap-2">
		<Label for="address">Address</Label>
		<Textarea id="address" name="address" value={client?.address ?? ''} placeholder="Physical or postal address" rows={3} />
	</div>

	<div class="flex gap-2">
		<Button type="submit" disabled={loading}>
			{loading ? 'Saving...' : submitLabel}
		</Button>
		<Button variant="outline" href="/clients">Cancel</Button>
	</div>
</form>
