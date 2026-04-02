<script lang="ts">
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import AppHeader from '$lib/components/layout/app-header.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<SidebarProvider>
	<AppSidebar />
	<SidebarInset>
		<AppHeader user={data.user} />
		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</SidebarInset>
</SidebarProvider>
