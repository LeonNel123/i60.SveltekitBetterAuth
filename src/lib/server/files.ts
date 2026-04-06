import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = resolve(process.cwd(), 'data', 'uploads');

function sanitizeFileName(fileName: string): string {
	const baseName = basename(fileName).replace(/[^\w.-]/g, '_');
	return baseName || 'upload';
}

function isWithinUploadDir(filePath: string): boolean {
	const relativePath = relative(UPLOAD_DIR, resolve(filePath));
	return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

export async function saveUploadedFile(
	orgId: string,
	file: File
): Promise<{ storagePath: string; fileName: string; mimeType: string; size: number }> {
	const orgDir = join(UPLOAD_DIR, orgId);
	if (!existsSync(orgDir)) {
		await mkdir(orgDir, { recursive: true });
	}

	const safeFileName = sanitizeFileName(file.name);
	const uniqueName = `${crypto.randomUUID()}-${safeFileName}`;
	const storagePath = join(orgDir, uniqueName);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(storagePath, buffer);

	return {
		storagePath,
		fileName: safeFileName,
		mimeType: file.type || 'application/octet-stream',
		size: file.size
	};
}

export async function deleteFile(storagePath: string): Promise<void> {
	if (!isWithinUploadDir(storagePath)) {
		console.error('[FILES] Refusing to delete file outside upload directory:', storagePath);
		return;
	}

	try {
		await unlink(resolve(storagePath));
	} catch {
		// File may already be deleted
	}
}
