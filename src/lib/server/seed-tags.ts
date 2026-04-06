import { db } from './db';
import { tag } from './db/schema';
import { eq } from 'drizzle-orm';
import { SYSTEM_TAGS } from '$lib/types';

let seeded = false;
let seedingPromise: Promise<void> | null = null;

export async function seedSystemTags() {
	if (seeded) return;
	if (seedingPromise) {
		await seedingPromise;
		return;
	}

	seedingPromise = (async () => {
		const existing = await db.select({ name: tag.name }).from(tag).where(eq(tag.isSystem, true));
		const existingNames = new Set(existing.map((t) => t.name));

		const missing = SYSTEM_TAGS.filter((name) => !existingNames.has(name));
		if (missing.length > 0) {
			await db
				.insert(tag)
				.values(missing.map((name) => ({ name, isSystem: true, organizationId: null })));
		}

		seeded = true;
	})();

	try {
		await seedingPromise;
	} catch (error) {
		seedingPromise = null;
		throw error;
	}

	seedingPromise = null;
}
