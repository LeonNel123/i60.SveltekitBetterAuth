<script lang="ts">
	import { page } from '$app/state';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Building2 from '@lucide/svelte/icons/building-2';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const hasOrg = $derived(!!page.data.session?.activeOrganizationId);
</script>

{#if hasOrg}
	{@render children()}
{:else}
	<div class="flex items-center justify-center py-20">
		<Card class="max-w-md text-center">
			<CardHeader>
				<div class="mx-auto mb-2">
					<Building2 class="h-12 w-12 text-muted-foreground/50" />
				</div>
				<CardTitle>Organisation Required</CardTitle>
				<CardDescription>
					You need to create or select an organisation before you can access CRM features.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button href="/settings/organization">Go to Organisation Settings</Button>
			</CardContent>
		</Card>
	</div>
{/if}
