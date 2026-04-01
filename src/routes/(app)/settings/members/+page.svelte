<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
	let inviteRole = $state<'member' | 'admin'>('member');
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
				<p class="py-4 text-center text-sm text-muted-foreground">No members yet.</p>
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
						{#each data.members as member (member.id)}
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
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{inviteError}
					</div>
				{/if}
				{#if inviteSuccess}
					<div class="rounded-md bg-primary/10 p-3 text-sm text-primary">
						{inviteSuccess}
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="invite-email">Email address</Label>
					<Input
						id="invite-email"
						type="email"
						bind:value={inviteEmail}
						required
						placeholder="colleague@example.com"
					/>
				</div>
				<div class="grid gap-2">
					<Label for="invite-role">Role</Label>
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
