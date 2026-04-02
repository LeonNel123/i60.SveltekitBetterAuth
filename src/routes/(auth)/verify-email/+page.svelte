<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { APP_NAME } from '$lib/config';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	let email = $derived(page.url.searchParams.get('email') ?? '');
	let otp = $state('');
	let error = $state('');
	let submitting = $state(false);
	let resending = $state(false);
	let resent = $state(false);

	async function verify() {
		if (!otp || otp.length < 6) {
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
		} else {
			goto('/dashboard');
		}
	}

	async function resendCode() {
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
		}
	}
</script>

<svelte:head>
	<title>Verify email — {APP_NAME}</title>
</svelte:head>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Verify your email</CardTitle>
		<CardDescription>
			We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
		</CardDescription>
	</CardHeader>
	<CardContent>
		<div class="grid gap-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}
			{#if resent}
				<div class="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
					A new code has been sent to your email.
				</div>
			{/if}
			<Input
				type="text"
				inputmode="numeric"
				maxlength={6}
				placeholder="000000"
				class="text-center text-2xl tracking-[0.5em]"
				bind:value={otp}
				onkeydown={(e) => {
					if (e.key === 'Enter') verify();
				}}
			/>
			<Button onclick={verify} class="w-full" disabled={submitting}>
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
		<Button href="/login" variant="outline" class="w-full">Back to sign in</Button>
	</CardFooter>
</Card>
