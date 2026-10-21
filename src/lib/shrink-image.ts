/** Vercel caps API request bodies at 4.5MB, so phone photos are resized before upload. */
const MAX_SIDE = 2000;
const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;

/**
 * Downscale large JPEG/PNG/WebP images in the browser. PDFs, GIFs and small images
 * are returned untouched; if the browser can't decode the image, the original is sent.
 */
export async function shrinkImageForUpload(file: File): Promise<File> {
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type) || file.size <= SKIP_BELOW_BYTES) {
        return file;
    }
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        // PNG → WebP keeps transparency (logos); photos stay JPEG.
        const type = file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'image/jpeg' : 'image/webp';
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
        if (!blob || blob.size >= file.size) return file;

        const ext = type === 'image/jpeg' ? 'jpg' : 'webp';
        const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
        return new File([blob], name, { type });
    } catch {
        return file;
    }
}
