import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads');

export async function saveUploadedFile(
	orgId: string,
	file: File
): Promise<{ storagePath: string; fileName: string; mimeType: string; size: number }> {
	const orgDir = join(UPLOAD_DIR, orgId);
	if (!existsSync(orgDir)) {
		await mkdir(orgDir, { recursive: true });
	}

	const uniqueName = `${crypto.randomUUID()}-${file.name}`;
	const storagePath = join(orgDir, uniqueName);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(storagePath, buffer);

	return {
		storagePath,
		fileName: file.name,
		mimeType: file.type || 'application/octet-stream',
		size: file.size
	};
}

export async function deleteFile(storagePath: string): Promise<void> {
	try {
		await unlink(storagePath);
	} catch {
		// File may already be deleted
	}
}
