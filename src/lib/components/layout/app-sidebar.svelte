<script lang="ts">
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/config';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import User from '@lucide/svelte/icons/user';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Users from '@lucide/svelte/icons/users';
	import Shield from '@lucide/svelte/icons/shield';
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
		{ href: '/settings/members', label: 'Members', icon: Users },
		{ href: '/settings/security', label: 'Security', icon: Shield }
	];
</script>

<Sidebar>
	<SidebarHeader class="px-4 py-3">
		<span class="text-lg font-bold tracking-tight">{APP_NAME}</span>
	</SidebarHeader>
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupLabel>Navigation</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each navItems as item (item.href)}
						<SidebarMenuItem>
							<SidebarMenuButton
								isActive={page.url.pathname === item.href ||
									page.url.pathname.startsWith(item.href + '/')}
							>
								{#snippet child({ props })}
									<a href={item.href} {...props}>
										<item.icon class="h-4 w-4" />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
</Sidebar>
