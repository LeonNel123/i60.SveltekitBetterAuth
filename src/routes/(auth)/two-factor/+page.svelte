<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/config';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import { getSafeRedirectPath } from '$lib/utils/safe-redirect';
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

	const OTP_LENGTH = 6;

	let error = $state('');
	let submitting = $state(false);
	let useBackupCode = $state(false);
	let backupCode = $state('');
	let next = $derived(getSafeRedirectPath(page.url.searchParams.get('next')));

	// TOTP digit state
	let digits = $state<string[]>(Array(OTP_LENGTH).fill(''));
	let totpCode = $derived(digits.join(''));
	let inputs: HTMLInputElement[] = $state([]);

	function focusDigit(index: number) {
		inputs[index]?.focus();
	}

	function handleInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');

		if (value.length > 1) {
			const chars = value.slice(0, OTP_LENGTH - index).split('');
			for (let i = 0; i < chars.length; i++) {
				if (index + i < OTP_LENGTH) {
					digits[index + i] = chars[i];
				}
			}
			focusDigit(Math.min(index + chars.length, OTP_LENGTH - 1));
		} else {
			digits[index] = value;
			if (value && index < OTP_LENGTH - 1) {
				focusDigit(index + 1);
			}
		}
	}

	function handleKeydown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace') {
			if (!digits[index] && index > 0) {
				e.preventDefault();
				digits[index - 1] = '';
				focusDigit(index - 1);
			} else {
				digits[index] = '';
			}
		} else if (e.key === 'ArrowLeft' && index > 0) {
			e.preventDefault();
			focusDigit(index - 1);
		} else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
			e.preventDefault();
			focusDigit(index + 1);
		} else if (e.key === 'Enter') {
			handleVerify();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
		if (!pasted) return;

		const chars = pasted.split('');
		for (let i = 0; i < OTP_LENGTH; i++) {
			digits[i] = chars[i] ?? '';
		}
		focusDigit(Math.min(chars.length, OTP_LENGTH) - 1);
	}

	async function handleVerify(e?: SubmitEvent) {
		e?.preventDefault();
		const code = useBackupCode ? backupCode.trim() : totpCode;
		if (!code) return;

		submitting = true;
		error = '';

		const result = useBackupCode
			? await authClient.twoFactor.verifyBackupCode({ code })
			: await authClient.twoFactor.verifyTotp({ code, trustDevice: true });

		submitting = false;
		if (result.error) {
			error = result.error.message ?? 'Invalid code. Please try again.';
			if (!useBackupCode) {
				digits = Array(OTP_LENGTH).fill('');
				focusDigit(0);
			}
		} else {
			await goto(next, { invalidateAll: true });
		}
	}

	function toggleMode() {
		useBackupCode = !useBackupCode;
		backupCode = '';
		digits = Array(OTP_LENGTH).fill('');
		error = '';
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
		<div class="grid gap-4">
			{#if error}
				<div
					class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{error}</span>
				</div>
			{/if}

			{#if useBackupCode}
				<form onsubmit={handleVerify} class="grid gap-4">
					<div class="grid gap-2">
						<Label for="backup-code">Backup code</Label>
						<Input
							id="backup-code"
							type="text"
							placeholder="xxxxxxxx"
							bind:value={backupCode}
							required
							autocomplete="one-time-code"
							inputmode="text"
							maxlength={20}
						/>
					</div>
					<Button type="submit" class="w-full" disabled={submitting || !backupCode.trim()}>
						{submitting ? 'Verifying...' : 'Verify'}
					</Button>
				</form>
			{:else}
				<!-- TOTP digit inputs -->
				<div class="flex justify-center gap-2" onpaste={handlePaste}>
					{#each { length: OTP_LENGTH } as _, i}
						<input
							bind:this={inputs[i]}
							type="text"
							inputmode="numeric"
							maxlength={2}
							autocomplete="one-time-code"
							aria-label="Digit {i + 1} of {OTP_LENGTH}"
							class="h-12 w-10 rounded-lg border bg-background text-center text-lg font-semibold transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 sm:h-14 sm:w-12 sm:text-xl"
							value={digits[i]}
							oninput={(e) => handleInput(i, e)}
							onkeydown={(e) => handleKeydown(i, e)}
							onfocus={(e) => (e.target as HTMLInputElement).select()}
						/>
					{/each}
				</div>
				<Button
					onclick={() => handleVerify()}
					class="w-full"
					disabled={submitting || totpCode.length < OTP_LENGTH}
				>
					{submitting ? 'Verifying...' : 'Verify'}
				</Button>
			{/if}
		</div>
	</CardContent>
	<CardFooter class="flex-col gap-2">
		<button
			type="button"
			class="text-sm text-muted-foreground hover:underline"
			onclick={toggleMode}
		>
			{useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
		</button>
		<a
			href={next === '/dashboard' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
			class="text-sm text-muted-foreground hover:underline"
		>
			Cancel and return to sign in
		</a>
	</CardFooter>
</Card>
