<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	let { data } = $props();

	let inviteEmail = $state('');
	let inviteRole = $state<'member' | 'admin' | 'owner'>('member');
	let inviting = $state(false);
	let inviteError = $state('');
	let inviteSuccess = $state('');

	async function handleInvite(e: SubmitEvent) {
		e.preventDefault();
		if (!inviteEmail.trim()) return;
		inviting = true;
		inviteError = '';
		inviteSuccess = '';
		const result = await authClient.organization.inviteMember({
			email: inviteEmail.trim(),
			role: inviteRole
		});
		inviting = false;
		if (result.error) {
			inviteError = result.error.message ?? 'Failed to send invitation';
		} else {
			inviteSuccess = `Invitation sent to ${inviteEmail.trim()}`;
			inviteEmail = '';
			await invalidateAll();
		}
	}

	function roleColor(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (role === 'owner') return 'destructive';
		if (role === 'admin') return 'default';
		return 'secondary';
	}
</script>

<div class="space-y-8">
	<Card>
		<CardHeader>
			<CardTitle>Members</CardTitle>
			<CardDescription>People in your organization.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.members.length === 0}
				<p class="text-sm text-muted-foreground py-4 text-center">No members yet.</p>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.members as member}
							<TableRow>
								<TableCell class="font-medium">{member.user?.name ?? '—'}</TableCell>
								<TableCell class="text-muted-foreground">{member.user?.email ?? '—'}</TableCell>
								<TableCell>
									<Badge variant={roleColor(member.role)}>{member.role}</Badge>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>

	<Card class="max-w-lg">
		<CardHeader>
			<CardTitle>Invite member</CardTitle>
			<CardDescription>Send an invitation to join your organization.</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleInvite} class="space-y-4">
				{#if inviteError}
					<p class="text-sm text-destructive">{inviteError}</p>
				{/if}
				{#if inviteSuccess}
					<p class="text-sm text-green-600">{inviteSuccess}</p>
				{/if}

				<div class="space-y-2">
					<label for="invite-email" class="text-sm font-medium">Email address</label>
					<input
						id="invite-email"
						type="email"
						bind:value={inviteEmail}
						required
						placeholder="colleague@example.com"
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>

				<div class="space-y-2">
					<label for="invite-role" class="text-sm font-medium">Role</label>
					<select
						id="invite-role"
						bind:value={inviteRole}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
					</select>
				</div>

				<Button type="submit" disabled={inviting}>
					{inviting ? 'Sending…' : 'Send invitation'}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
