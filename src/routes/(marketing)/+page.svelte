<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { APP_NAME, APP_DESCRIPTION } from '$lib/config';
</script>

<section class="container mx-auto px-4 py-24 text-center">
	<h1 class="text-5xl font-bold tracking-tight sm:text-6xl">
		Welcome to <span class="text-primary">{APP_NAME}</span>
	</h1>
	<p class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
		{APP_DESCRIPTION}
	</p>
	<div class="mt-10 flex justify-center gap-4">
		<Button href="/register" size="lg">Get started free</Button>
		<Button href="/login" variant="outline" size="lg">Sign in</Button>
	</div>
</section>

<section class="border-t bg-muted/50 py-24">
	<div class="container mx-auto grid gap-8 px-4 md:grid-cols-3">
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Team Management</h3>
			<p class="text-muted-foreground">
				Invite members, assign roles, and manage your organization with ease.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Secure by Default</h3>
			<p class="text-muted-foreground">
				Enterprise-grade authentication with session management and role-based access.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Built to Scale</h3>
			<p class="text-muted-foreground">
				Multi-tenant architecture designed for growing teams and organizations.
			</p>
		</div>
	</div>
</section>
