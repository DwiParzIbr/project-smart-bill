import { describe, it, expect } from "vitest";
import { isHeicFile, convertHeicToJpegIfNeeded } from "@/lib/ocr/heic-converter";

describe("heic-converter", () => {
  describe("isHeicFile", () => {
    it("returns true for image/heic and image/heif MIME types", () => {
      const heicBlob = new Blob([], { type: "image/heic" });
      const heifBlob = new Blob([], { type: "image/heif" });

      expect(isHeicFile(heicBlob)).toBe(true);
      expect(isHeicFile(heifBlob)).toBe(true);
    });

    it("returns true for .heic and .heif file extensions (case-insensitive)", () => {
      const file1 = new File([], "struk-makan.heic", { type: "" });
      const file2 = new File([], "IMG_1234.HEIC", { type: "" });
      const file3 = new File([], "receipt.HEIF", { type: "" });

      expect(isHeicFile(file1)).toBe(true);
      expect(isHeicFile(file2)).toBe(true);
      expect(isHeicFile(file3)).toBe(true);
    });

    it("returns false for standard image types (jpeg, png, webp)", () => {
      const jpegFile = new File([], "struk.jpg", { type: "image/jpeg" });
      const pngFile = new File([], "struk.png", { type: "image/png" });
      const webpFile = new File([], "struk.webp", { type: "image/webp" });

      expect(isHeicFile(jpegFile)).toBe(false);
      expect(isHeicFile(pngFile)).toBe(false);
      expect(isHeicFile(webpFile)).toBe(false);
    });

    it("returns false for invalid or empty inputs", () => {
      expect(isHeicFile(null as any)).toBe(false);
      expect(isHeicFile(undefined as any)).toBe(false);
      expect(isHeicFile({} as any)).toBe(false);
    });
  });

  describe("convertHeicToJpegIfNeeded", () => {
    it("returns non-HEIC files immediately without modification", async () => {
      const normalFile = new File(["test data"], "struk.jpg", { type: "image/jpeg" });
      const result = await convertHeicToJpegIfNeeded(normalFile);
      expect(result).toBe(normalFile);
    });
  });
});
