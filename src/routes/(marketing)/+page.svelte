<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { APP_NAME, APP_DESCRIPTION } from '$lib/config';
</script>

<svelte:head>
	<title>{APP_NAME} — {APP_DESCRIPTION}</title>
</svelte:head>

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
			<h3 class="text-xl font-semibold">Authentication</h3>
			<p class="text-muted-foreground">
				Email/password, OAuth (Google, GitHub, Microsoft), two-factor authentication, and email
				verification out of the box.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Multi-Tenant Orgs</h3>
			<p class="text-muted-foreground">
				Create organisations, invite members, assign roles, and scope all data to the active
				organisation.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Production Ready</h3>
			<p class="text-muted-foreground">
				SvelteKit 2 with Svelte 5, PostgreSQL via Drizzle ORM, Tailwind CSS v4, and dark mode.
				Deploy anywhere with Node adapter.
			</p>
		</div>
	</div>
</section>
