<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import QRCode from 'qrcode';
	import { APP_NAME } from '$lib/config';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const twoFactorEnabled = $derived(data.user?.twoFactorEnabled ?? false);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let changingPassword = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	async function handleChangePassword() {
		passwordError = '';
		passwordSuccess = '';

		if (!currentPassword.trim()) {
			passwordError = 'Current password is required';
			return;
		}
		if (newPassword.length < 8) {
			passwordError = 'New password must be at least 8 characters';
			return;
		}
		if (newPassword !== confirmPassword) {
			passwordError = 'Passwords do not match';
			return;
		}

		changingPassword = true;
		const result = await authClient.changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true
		});
		changingPassword = false;

		if (result.error) {
			passwordError = result.error.message ?? 'Failed to change password';
			return;
		}

		passwordSuccess = 'Password updated successfully.';
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
	}

	let password = $state('');
	let totpUri = $state('');
	let qrDataUrl = $state('');
	let backupCodes = $state<string[]>([]);
	let verifyCode = $state('');
	let enabling = $state(false);
	let disabling = $state(false);
	let error = $state('');
	let step = $state<'idle' | 'setup' | 'verify' | 'backup'>('idle');

	async function startEnable() {
		if (!password.trim()) {
			error = 'Password is required';
			return;
		}
		enabling = true;
		error = '';

		const result = await authClient.twoFactor.enable({ password });
		enabling = false;

		if (result.error) {
			error = result.error.message ?? 'Failed to enable 2FA';
			return;
		}

		const uriResult = await authClient.twoFactor.getTotpUri({ password });
		if (uriResult.data?.totpURI) {
			totpUri = uriResult.data.totpURI;
			qrDataUrl = await QRCode.toDataURL(totpUri, { width: 200, margin: 2 });
		}
		backupCodes = result.data?.backupCodes ?? [];
		step = 'setup';
	}

	async function verifyAndComplete() {
		if (!verifyCode.trim()) return;
		enabling = true;
		error = '';

		const result = await authClient.twoFactor.verifyTotp({ code: verifyCode.trim() });
		enabling = false;

		if (result.error) {
			error = result.error.message ?? 'Invalid code';
			return;
		}

		step = 'backup';
		await invalidateAll();
	}

	async function disable2FA() {
		if (!password.trim()) {
			error = 'Password is required to disable 2FA';
			return;
		}
		disabling = true;
		error = '';

		const result = await authClient.twoFactor.disable({ password });
		disabling = false;

		if (result.error) {
			error = result.error.message ?? 'Failed to disable 2FA';
			return;
		}

		password = '';
		step = 'idle';
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Security — {APP_NAME}</title>
</svelte:head>

<div class="space-y-8">
	<Card class="max-w-lg rounded-xl">
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Two-Factor Authentication</CardTitle>
					<CardDescription>Add an extra layer of security to your account.</CardDescription>
				</div>
				<Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
					{twoFactorEnabled ? 'Enabled' : 'Disabled'}
				</Badge>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if error}
				<div
					class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{error}</span>
				</div>
			{/if}

			{#if step === 'idle'}
				{#if twoFactorEnabled}
					<p class="text-sm text-muted-foreground">
						Two-factor authentication is active. Enter your password to disable it.
					</p>
					<div class="grid gap-2">
						<Label for="disable-password">Password</Label>
						<Input
							id="disable-password"
							type="password"
							bind:value={password}
							placeholder="Enter your password"
						/>
					</div>
					<Button onclick={disable2FA} variant="destructive" disabled={disabling}>
						{disabling ? 'Disabling...' : 'Disable 2FA'}
					</Button>
				{:else}
					<p class="text-sm text-muted-foreground">
						Secure your account with a time-based one-time password (TOTP).
					</p>
					<div class="grid gap-2">
						<Label for="enable-password">Password</Label>
						<Input
							id="enable-password"
							type="password"
							bind:value={password}
							placeholder="Enter your password to begin"
						/>
					</div>
					<Button onclick={startEnable} disabled={enabling}>
						{enabling ? 'Setting up...' : 'Enable 2FA'}
					</Button>
				{/if}
			{:else if step === 'setup'}
				<p class="text-sm text-muted-foreground">
					Scan this URI with your authenticator app, then enter the verification code.
				</p>
				{#if qrDataUrl}
					<div class="flex justify-center rounded-md bg-white p-4">
						<img src={qrDataUrl} alt="TOTP QR Code" class="h-[200px] w-[200px]" />
					</div>
				{:else if totpUri}
					<div class="rounded-md bg-muted p-3 text-xs break-all font-mono">{totpUri}</div>
				{/if}
				<div class="grid gap-2">
					<Label for="verify-code">Verification code</Label>
					<Input
						id="verify-code"
						type="text"
						inputmode="numeric"
						maxlength={6}
						placeholder="000000"
						bind:value={verifyCode}
						autocomplete="one-time-code"
					/>
				</div>
				<Button onclick={verifyAndComplete} disabled={enabling}>
					{enabling ? 'Verifying...' : 'Verify and enable'}
				</Button>
			{:else if step === 'backup'}
				<p class="text-sm text-muted-foreground">
					Two-factor authentication is now enabled. Save these backup codes in a safe place. Each
					code can only be used once.
				</p>
				<div class="grid grid-cols-2 gap-2 rounded-md bg-muted p-4 font-mono text-sm">
					{#each backupCodes as backupCode (backupCode)}
						<span>{backupCode}</span>
					{/each}
				</div>
				<Button
					onclick={() => {
						step = 'idle';
						password = '';
						verifyCode = '';
					}}
				>
					Done
				</Button>
			{/if}
		</CardContent>
	</Card>

	<Card class="max-w-lg rounded-xl">
		<CardHeader>
			<CardTitle>Change Password</CardTitle>
			<CardDescription>Update your account password.</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if passwordError}
				<div
					class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{passwordError}</span>
				</div>
			{/if}
			{#if passwordSuccess}
				<div class="rounded-md bg-primary/10 p-3 text-sm text-primary">{passwordSuccess}</div>
			{/if}
			<div class="grid gap-2">
				<Label for="current-password">Current password</Label>
				<Input
					id="current-password"
					type="password"
					autocomplete="current-password"
					bind:value={currentPassword}
					placeholder="Enter current password"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="new-password">New password</Label>
				<Input
					id="new-password"
					type="password"
					autocomplete="new-password"
					bind:value={newPassword}
					placeholder="Min 8 characters"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="confirm-password">Confirm new password</Label>
				<Input
					id="confirm-password"
					type="password"
					autocomplete="new-password"
					bind:value={confirmPassword}
					placeholder="Re-enter new password"
				/>
			</div>
			<Button onclick={handleChangePassword} disabled={changingPassword}>
				{changingPassword ? 'Updating...' : 'Update password'}
			</Button>
		</CardContent>
	</Card>
</div>
