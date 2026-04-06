import { db } from '$lib/server/db';
import { document, client, tag, documentTag } from '$lib/server/db/schema';
import { eq, desc, ilike, and, inArray, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return { documents: [], search: '', tags: [], tagFilter: '' };

	const search = url.searchParams.get('q')?.trim() ?? '';
	const tagFilter = url.searchParams.get('tag')?.trim() ?? '';

	const conditions = [eq(document.organizationId, orgId)];
	if (search) {
		conditions.push(ilike(document.name, `%${search}%`));
	}
	if (tagFilter) {
		conditions.push(
			sql`${document.id} IN (SELECT document_id FROM document_tag WHERE tag_id = ${tagFilter})`
		);
	}
	const where = conditions.length === 1 ? conditions[0] : and(...conditions);

	const [documents, orgTags] = await Promise.all([
		db
			.select({ document: document, clientName: client.name })
			.from(document)
			.leftJoin(client, eq(document.clientId, client.id))
			.where(where)
			.orderBy(desc(document.createdAt))
			.limit(100),
		db
			.select()
			.from(tag)
			.where(sql`${tag.organizationId} = ${orgId} OR ${tag.isSystem} = true`)
	]);

	const mappedDocuments = documents.map((r) => ({ ...r.document, clientName: r.clientName }));

	// Load tags for each document
	const docIds = mappedDocuments.map((d) => d.id);
	const docTagMap: Record<string, { id: string; name: string; isSystem: boolean }[]> = {};

	if (docIds.length > 0) {
		const docTags = await db
			.select({
				documentId: documentTag.documentId,
				tagId: tag.id,
				tagName: tag.name,
				isSystem: tag.isSystem
			})
			.from(documentTag)
			.innerJoin(tag, eq(documentTag.tagId, tag.id))
			.where(inArray(documentTag.documentId, docIds));

		for (const dt of docTags) {
			if (!docTagMap[dt.documentId]) docTagMap[dt.documentId] = [];
			docTagMap[dt.documentId].push({ id: dt.tagId, name: dt.tagName, isSystem: dt.isSystem });
		}
	}

	return {
		documents: mappedDocuments.map((d) => ({ ...d, tags: docTagMap[d.id] ?? [] })),
		search,
		tags: orgTags,
		tagFilter
	};
};
