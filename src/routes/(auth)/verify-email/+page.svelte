<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { APP_NAME } from '$lib/config';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import { getSafeRedirectPath } from '$lib/utils/safe-redirect';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	const OTP_LENGTH = 6;

	let email = $derived(page.url.searchParams.get('email') ?? '');
	let next = $derived(getSafeRedirectPath(page.url.searchParams.get('next')));
	let digits = $state<string[]>(Array(OTP_LENGTH).fill(''));
	let otp = $derived(digits.join(''));
	let error = $state('');
	let submitting = $state(false);
	let resending = $state(false);
	let resent = $state(false);
	let inputs: HTMLInputElement[] = $state([]);

	function focusDigit(index: number) {
		inputs[index]?.focus();
	}

	function handleInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');

		if (value.length > 1) {
			// Multiple chars typed/pasted into a single box — distribute
			const chars = value.slice(0, OTP_LENGTH - index).split('');
			for (let i = 0; i < chars.length; i++) {
				if (index + i < OTP_LENGTH) {
					digits[index + i] = chars[i];
				}
			}
			const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
			focusDigit(nextIndex);
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
			verify();
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

	async function verify() {
		if (!email) {
			error = 'Missing email address. Return to sign in and try again.';
			return;
		}
		if (otp.length < OTP_LENGTH) {
			error = 'Please enter the 6-digit code';
			return;
		}
		error = '';
		submitting = true;
		const { error: err } = await authClient.emailOtp.verifyEmail({
			email,
			otp
		});
		submitting = false;
		if (err) {
			error = err.message ?? 'Invalid or expired code';
			// Clear and refocus on error
			digits = Array(OTP_LENGTH).fill('');
			focusDigit(0);
		} else {
			await goto(next, { invalidateAll: true });
		}
	}

	async function resendCode() {
		if (!email) {
			error = 'Missing email address. Return to sign in and try again.';
			return;
		}
		resending = true;
		resent = false;
		error = '';
		const { error: err } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: 'email-verification'
		});
		resending = false;
		if (err) {
			error = err.message ?? 'Could not resend code';
		} else {
			resent = true;
			digits = Array(OTP_LENGTH).fill('');
			focusDigit(0);
		}
	}
</script>

<svelte:head>
	<title>Verify email — {APP_NAME}</title>
</svelte:head>

<Card class="rounded-xl">
	<CardHeader>
		<CardTitle class="text-2xl">Verify your email</CardTitle>
		<CardDescription>
			We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
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
			{#if resent}
				<div class="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
					A new code has been sent to your email.
				</div>
			{/if}

			<!-- OTP digit inputs -->
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

			<Button onclick={verify} class="w-full" disabled={submitting || otp.length < OTP_LENGTH}>
				{submitting ? 'Verifying...' : 'Verify email'}
			</Button>
		</div>
	</CardContent>
	<CardFooter class="flex-col gap-2">
		<p class="text-sm text-muted-foreground">
			Didn't receive a code?
			<button
				onclick={resendCode}
				class="text-primary hover:underline disabled:opacity-50"
				disabled={resending}
			>
				{resending ? 'Sending...' : 'Resend code'}
			</button>
		</p>
		<Button
			href={next === '/dashboard' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
			variant="outline"
			class="w-full"
		>
			Back to sign in
		</Button>
	</CardFooter>
</Card>
