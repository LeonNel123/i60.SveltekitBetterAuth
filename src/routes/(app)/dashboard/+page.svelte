<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
</script>

<div class="space-y-6">
	<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>

	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">—</p>
				<p class="text-xs text-muted-foreground mt-1">No data yet</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Pending Invitations</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">—</p>
				<p class="text-xs text-muted-foreground mt-1">No data yet</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Organization</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">—</p>
				<p class="text-xs text-muted-foreground mt-1">Not configured</p>
			</CardContent>
		</Card>
	</div>
</div>
