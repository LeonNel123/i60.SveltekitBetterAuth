<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { APP_NAME, APP_DESCRIPTION } from '$lib/config';
	import Shield from '@lucide/svelte/icons/shield';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Rocket from '@lucide/svelte/icons/rocket';
</script>

<svelte:head>
	<title>{APP_NAME} — {APP_DESCRIPTION}</title>
</svelte:head>

<section class="relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--color-primary)/8%,transparent)]"
	></div>
	<div class="container mx-auto px-4 py-28 text-center sm:py-36">
		<p
			class="mx-auto mb-4 w-fit rounded-full border bg-muted/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground"
		>
			Open-source SvelteKit template
		</p>
		<h1
			class="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
		>
			Start building with <span class="text-primary">{APP_NAME}</span>
		</h1>
		<p class="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
			{APP_DESCRIPTION}
		</p>
		<div class="mt-10 flex justify-center gap-3">
			<Button href="/register" size="lg">Get started free</Button>
			<Button href="/login" variant="outline" size="lg">Sign in</Button>
		</div>
	</div>
</section>

<section class="border-t py-24">
	<div class="container mx-auto px-4">
		<div class="grid gap-6 md:grid-cols-3">
			<div
				class="group rounded-xl border bg-card p-6 transition-shadow duration-200 hover:shadow-md"
			>
				<div class="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
					<Shield class="h-5 w-5 text-primary" />
				</div>
				<h3 class="text-lg font-semibold">Authentication</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Email/password, OAuth (Google, GitHub, Microsoft), two-factor authentication, and email
					verification out of the box.
				</p>
			</div>
			<div
				class="group rounded-xl border bg-card p-6 transition-shadow duration-200 hover:shadow-md"
			>
				<div class="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
					<Building2 class="h-5 w-5 text-primary" />
				</div>
				<h3 class="text-lg font-semibold">Multi-Tenant Orgs</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Create organisations, invite members, assign roles, and scope all data to the active
					organisation.
				</p>
			</div>
			<div
				class="group rounded-xl border bg-card p-6 transition-shadow duration-200 hover:shadow-md"
			>
				<div class="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
					<Rocket class="h-5 w-5 text-primary" />
				</div>
				<h3 class="text-lg font-semibold">Production Ready</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					SvelteKit 2 with Svelte 5, PostgreSQL via Drizzle ORM, Tailwind CSS v4, and dark mode.
					Deploy anywhere with Node adapter.
				</p>
			</div>
		</div>
	</div>
</section>
