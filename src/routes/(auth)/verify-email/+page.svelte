<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Check your email</CardTitle>
		<CardDescription>
			We've sent a verification link to your email address. Click the link to verify your account.
		</CardDescription>
	</CardHeader>
	<CardContent>
		<p class="text-sm text-muted-foreground">
			Didn't receive an email? Check your spam folder or try again.
		</p>
	</CardContent>
	<CardFooter class="justify-center">
		<Button href="/login" variant="outline">Back to sign in</Button>
	</CardFooter>
</Card>
