<script lang="ts">
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/config';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import User from '@lucide/svelte/icons/user';
	import Building2 from '@lucide/svelte/icons/building-2';
	import UserCog from '@lucide/svelte/icons/user-cog';
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
		SidebarMenuItem,
		SidebarSeparator
	} from '$lib/components/ui/sidebar';

	const mainNav = [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];

	const settingsNav = [
		{ href: '/settings/profile', label: 'Profile', icon: User },
		{ href: '/settings/organization', label: 'Organisation', icon: Building2 },
		{ href: '/settings/members', label: 'Members', icon: UserCog },
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
					{#each mainNav as item (item.href)}
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

		<SidebarSeparator />

		<SidebarGroup>
			<SidebarGroupLabel>Settings</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each settingsNav as item (item.href)}
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
