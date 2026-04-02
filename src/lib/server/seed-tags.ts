import { db } from './db';
import { tag } from './db/schema';
import { eq } from 'drizzle-orm';
import { SYSTEM_TAGS } from '$lib/types';

let seeded = false;

export async function seedSystemTags() {
	if (seeded) return;
	seeded = true;

	const existing = await db.select({ name: tag.name }).from(tag).where(eq(tag.isSystem, true));
	const existingNames = new Set(existing.map((t) => t.name));

	const missing = SYSTEM_TAGS.filter((name) => !existingNames.has(name));
	if (missing.length === 0) return;

	await db.insert(tag).values(
		missing.map((name) => ({ name, isSystem: true, organizationId: null }))
	);
}
