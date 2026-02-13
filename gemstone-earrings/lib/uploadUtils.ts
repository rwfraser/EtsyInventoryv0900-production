import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'temp');

/**
 * Saves an uploaded file to temporary storage
 * @param file - The File object from FormData
 * @returns The relative path to the saved file (e.g., /uploads/temp/123456-image.jpg)
 */
export async function saveTempFile(file: File): Promise<string> {
  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}-${originalName}`;
  const filepath = join(UPLOAD_DIR, filename);

  // Convert file to buffer and save
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  // Return relative path for database storage
  return `/uploads/temp/${filename}`;
}
