<script lang="ts">
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/config';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import User from '@lucide/svelte/icons/user';
	import Building2 from '@lucide/svelte/icons/building-2';
	import UserCog from '@lucide/svelte/icons/user-cog';
	import Shield from '@lucide/svelte/icons/shield';
	import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarSeparator,
		useSidebar
	} from '$lib/components/ui/sidebar';

	const sidebar = useSidebar();

	const mainNav = [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];

	const settingsNav = [
		{ href: '/settings/profile', label: 'Profile', icon: User },
		{ href: '/settings/organization', label: 'Organisation', icon: Building2 },
		{ href: '/settings/members', label: 'Members', icon: UserCog },
		{ href: '/settings/security', label: 'Security', icon: Shield }
	];
</script>

<Sidebar collapsible="icon">
	<SidebarHeader class="px-4 py-3">
		<span class="truncate text-lg font-bold tracking-tight">{APP_NAME}</span>
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
	<SidebarFooter>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton onclick={() => sidebar.toggle()}>
					<ChevronsLeft
						class="h-4 w-4 transition-transform duration-200 {sidebar.state === 'collapsed'
							? 'rotate-180'
							: ''}"
					/>
					<span>Collapse</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarFooter>
</Sidebar>
