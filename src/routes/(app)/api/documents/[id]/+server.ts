import { db } from '$lib/server/db';
import { document } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return error(403, 'Not authorised');

	const [doc] = await db
		.select()
		.from(document)
		.where(and(eq(document.id, params.id), eq(document.organizationId, orgId)));
	if (!doc) return error(404, 'Document not found');

	try {
		const fileBuffer = await readFile(doc.storagePath);
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': doc.mimeType,
				'Content-Disposition': `attachment; filename="${doc.fileName}"`,
				'Content-Length': String(doc.size)
			}
		});
	} catch {
		return error(500, 'File not found on disk');
	}
};
