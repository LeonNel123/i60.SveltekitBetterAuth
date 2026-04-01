<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';

	async function handleSignOut() {
		await authClient.signOut();
		await goto('/login', { invalidateAll: true });
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<Card class="max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Account Suspended</CardTitle>
			<CardDescription>
				Your account has been suspended. Contact support if you believe this is an error.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<Button onclick={handleSignOut} variant="outline" class="w-full">Sign out</Button>
		</CardContent>
	</Card>
</div>
