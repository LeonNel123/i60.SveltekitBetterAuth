<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	interface Props {
		user: { name: string; email: string };
	}

	let { user }: Props = $props();

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/login');
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<Avatar class="h-8 w-8 cursor-pointer">
			<AvatarFallback class="text-xs">{getInitials(user.name)}</AvatarFallback>
		</Avatar>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="w-56">
		<DropdownMenuLabel>
			<div class="flex flex-col space-y-1">
				<p class="text-sm font-medium leading-none">{user.name}</p>
				<p class="text-muted-foreground text-xs leading-none">{user.email}</p>
			</div>
		</DropdownMenuLabel>
		<DropdownMenuSeparator />
		<DropdownMenuItem onclick={() => goto('/settings/profile')}>Profile</DropdownMenuItem>
		<DropdownMenuItem onclick={() => goto('/settings/organization')}>Organization</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuItem onclick={handleSignOut} class="text-destructive focus:text-destructive">
			Sign out
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
