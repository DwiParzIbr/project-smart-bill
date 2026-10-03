/**
 * Helper utility to detect and convert Apple / Android HEIC and HEIF image formats
 * to standard JPEG format for browser canvas and OCR compatibility.
 */

export function isHeicFile(file: File | Blob | { name?: string; type?: string }): boolean {
  if (!file) return false;

  const type = (file.type || "").toLowerCase();
  const name = ("name" in file && typeof file.name === "string" ? file.name : "").toLowerCase();

  return (
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

/**
 * Converts a HEIC/HEIF File to a standard JPEG File in the browser using heic2any.
 * If the file is not HEIC/HEIF or the environment is SSR, returns the original file untouched.
 */
export async function convertHeicToJpegIfNeeded(
  file: File,
  onProgress?: (progressMessage: string) => void
): Promise<File> {
  if (!file || !isHeicFile(file)) {
    return file;
  }

  // If running in SSR / non-browser environment, return original
  if (typeof window === "undefined") {
    return file;
  }

  onProgress?.("Mengonversi foto HEIC/HEIF (Apple/Samsung) ke JPG...");

  try {
    // Dynamic import to prevent SSR issues and load only when HEIC is encountered
    const heic2anyModule = await import("heic2any");
    const heic2any = heic2anyModule.default || heic2anyModule;

    const conversionResult = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });

    const outputBlob: Blob = Array.isArray(conversionResult)
      ? conversionResult[0]
      : conversionResult;

    const originalName = file.name || "receipt.heic";
    const jpegName = originalName.replace(/\.(heic|heif)$/i, ".jpg");

    return new File([outputBlob], jpegName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Konversi HEIC ke JPEG tidak berhasil, melanjutkan dengan file asli:", error);
    return file;
  }
}
