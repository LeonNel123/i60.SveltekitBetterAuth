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
			<h3 class="text-xl font-semibold">Client Management</h3>
			<p class="text-muted-foreground">
				Track insured individuals and companies, with full policy and claims history at your fingertips.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Task-Driven Operations</h3>
			<p class="text-muted-foreground">
				Every action is tracked. Tasks are assigned, escalated, and completed with full traceability.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Document Compliance</h3>
			<p class="text-muted-foreground">
				Upload, tag, and retrieve documents instantly. Built for South African regulatory requirements.
			</p>
		</div>
	</div>
</section>
