import { put } from '@vercel/blob';

/**
 * Saves an uploaded file to Vercel Blob storage
 * @param file - The File object from FormData
 * @returns The public URL to the uploaded file
 */
export async function saveTempFile(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `products/${timestamp}-${originalName}`;

  // Upload to Vercel Blob
  const blob = await put(filename, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  // Return public URL
  return blob.url;
}
