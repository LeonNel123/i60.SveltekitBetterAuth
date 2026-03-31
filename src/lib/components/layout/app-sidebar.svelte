<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, User, Building2, Users } from 'lucide-svelte';
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem
	} from '$lib/components/ui/sidebar';

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/settings/profile', label: 'Profile', icon: User },
		{ href: '/settings/organization', label: 'Organization', icon: Building2 },
		{ href: '/settings/members', label: 'Members', icon: Users }
	];
</script>

<Sidebar>
	<SidebarHeader class="px-4 py-3">
		<span class="text-lg font-bold tracking-tight">Bokeros</span>
	</SidebarHeader>
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupLabel>Navigation</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each navItems as item}
						<SidebarMenuItem>
							<SidebarMenuButton
								href={item.href}
								isActive={page.url.pathname === item.href ||
									page.url.pathname.startsWith(item.href + '/')}
							>
								<item.icon class="h-4 w-4" />
								<span>{item.label}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
</Sidebar>
