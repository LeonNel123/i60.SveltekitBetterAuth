<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { APP_NAME } from '$lib/config';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	let code = $state('');
	let error = $state('');
	let submitting = $state(false);
	let useBackupCode = $state(false);

	async function handleVerify(e: SubmitEvent) {
		e.preventDefault();
		if (!code.trim()) return;
		submitting = true;
		error = '';

		const result = useBackupCode
			? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
			: await authClient.twoFactor.verifyTotp({ code: code.trim(), trustDevice: true });

		submitting = false;
		if (result.error) {
			error = result.error.message ?? 'Invalid code. Please try again.';
		} else {
			await goto('/dashboard', { invalidateAll: true });
		}
	}
</script>

<svelte:head>
	<title>Two-factor authentication — {APP_NAME}</title>
</svelte:head>

<Card class="rounded-xl">
	<CardHeader>
		<CardTitle class="text-2xl">Two-factor authentication</CardTitle>
		<CardDescription>
			{useBackupCode
				? 'Enter one of your backup codes'
				: 'Enter the 6-digit code from your authenticator app'}
		</CardDescription>
	</CardHeader>
	<CardContent>
		<form onsubmit={handleVerify} class="grid gap-4">
			{#if error}
				<div
					class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{error}</span>
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="code">{useBackupCode ? 'Backup code' : 'Verification code'}</Label>
				<Input
					id="code"
					type="text"
					placeholder={useBackupCode ? 'xxxxxxxx' : '000000'}
					bind:value={code}
					required
					autocomplete="one-time-code"
					inputmode={useBackupCode ? 'text' : 'numeric'}
					maxlength={useBackupCode ? 20 : 6}
				/>
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Verifying...' : 'Verify'}
			</Button>
		</form>
	</CardContent>
	<CardFooter class="flex-col gap-2">
		<button
			type="button"
			class="text-sm text-muted-foreground hover:underline"
			onclick={() => {
				useBackupCode = !useBackupCode;
				code = '';
				error = '';
			}}
		>
			{useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
		</button>
		<a href="/login" class="text-sm text-muted-foreground hover:underline">
			Cancel and return to sign in
		</a>
	</CardFooter>
</Card>
