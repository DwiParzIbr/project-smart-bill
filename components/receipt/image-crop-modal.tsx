"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RotateCw,
  RotateCcw,
  Crop,
  Check,
  X,
  Maximize2,
  Sparkles,
  Sliders,
} from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onConfirm: (processedFile: File) => void;
}

export function ImageCropModal({
  isOpen,
  onClose,
  file,
  onConfirm,
}: ImageCropModalProps) {
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  // Margins in percentage 0 - 45%
  const [marginTop, setMarginTop] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [marginRight, setMarginRight] = useState(0);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image whenever file changes
  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setRotation(0);
    setMarginTop(0);
    setMarginBottom(0);
    setMarginLeft(0);
    setMarginRight(0);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Re-render canvas whenever rotation or crop margins change
  useEffect(() => {
    if (imgRef.current) {
      renderCanvas();
    }
  }, [rotation, marginTop, marginBottom, marginLeft, marginRight]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isRotated90or270 = rotation === 90 || rotation === 270;
    const origW = isRotated90or270 ? img.height : img.width;
    const origH = isRotated90or270 ? img.width : img.height;

    // Set preview canvas resolution (scaled down for mobile performance)
    const maxPreviewDim = 600;
    let previewW = origW;
    let previewH = origH;
    if (previewW > maxPreviewDim || previewH > maxPreviewDim) {
      if (previewW > previewH) {
        previewH = Math.round((previewH * maxPreviewDim) / previewW);
        previewW = maxPreviewDim;
      } else {
        previewW = Math.round((previewW * maxPreviewDim) / previewH);
        previewH = maxPreviewDim;
      }
    }

    canvas.width = previewW;
    canvas.height = previewH;

    ctx.save();
    ctx.clearRect(0, 0, previewW, previewH);

    // Apply rotation around center
    ctx.translate(previewW / 2, previewH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawW = isRotated90or270 ? previewH : previewW;
    const drawH = isRotated90or270 ? previewW : previewH;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw crop dim overlay
    const cropX = (marginLeft / 100) * previewW;
    const cropY = (marginTop / 100) * previewH;
    const cropW = previewW - cropX - (marginRight / 100) * previewW;
    const cropH = previewH - cropY - (marginBottom / 100) * previewH;

    // Darken outer border
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
    // Top
    ctx.fillRect(0, 0, previewW, cropY);
    // Bottom
    ctx.fillRect(0, cropY + cropH, previewW, previewH - (cropY + cropH));
    // Left
    ctx.fillRect(0, cropY, cropX, cropH);
    // Right
    ctx.fillRect(cropX + cropW, cropY, previewW - (cropX + cropW), cropH);

    // Crop border rectangle
    ctx.strokeStyle = "#0284c7"; // sky-600
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(cropX, cropY, cropW, cropH);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev + 270) % 360);
  };

  const handlePresetFull = () => {
    setMarginTop(0);
    setMarginBottom(0);
    setMarginLeft(0);
    setMarginRight(0);
  };

  const handlePresetReceiptTrim = () => {
    // Focus on vertical receipt strip by trimming 15% from left and right
    setMarginLeft(15);
    setMarginRight(15);
    setMarginTop(5);
    setMarginBottom(5);
  };

  const handleConfirmCrop = async () => {
    const img = imgRef.current;
    if (!img || !file) {
      if (file) onConfirm(file);
      return;
    }

    // High quality final output canvas (max 1600px)
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const rotW = isRotated90or270 ? img.height : img.width;
    const rotH = isRotated90or270 ? img.width : img.height;

    // Calculate crop boundaries on full resolution
    const startX = Math.round((marginLeft / 100) * rotW);
    const startY = Math.round((marginTop / 100) * rotH);
    const cropW = Math.max(50, rotW - startX - Math.round((marginRight / 100) * rotW));
    const cropH = Math.max(50, rotH - startY - Math.round((marginBottom / 100) * rotH));

    // Full rotated canvas
    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = rotW;
    rotCanvas.height = rotH;
    const rotCtx = rotCanvas.getContext("2d");
    if (!rotCtx) {
      onConfirm(file);
      return;
    }

    rotCtx.translate(rotW / 2, rotH / 2);
    rotCtx.rotate((rotation * Math.PI) / 180);
    const drawW = isRotated90or270 ? rotH : rotW;
    const drawH = isRotated90or270 ? rotW : rotH;
    rotCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    // Final cropped canvas
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = cropW;
    finalCanvas.height = cropH;
    const finalCtx = finalCanvas.getContext("2d");
    if (!finalCtx) {
      onConfirm(file);
      return;
    }

    finalCtx.drawImage(
      rotCanvas,
      startX,
      startY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );

    finalCanvas.toBlob(
      (blob) => {
        if (!blob) {
          onConfirm(file);
          return;
        }
        const croppedFile = new File([blob], file.name || "receipt.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        onConfirm(croppedFile);
      },
      "image/jpeg",
      0.92
    );
  };

  if (!isOpen || !file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Sesuaikan & Putar Foto Struk
              </h3>
              <p className="text-[11px] text-slate-500">
                Pastikan posisi struk tegak lurus untuk akurasi maksimal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition min-touch-target"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Preview Area */}
        <div className="relative bg-slate-900/95 rounded-2xl overflow-hidden flex items-center justify-center p-2 min-h-60 max-h-72">
          <canvas
            ref={canvasRef}
            className="max-h-64 max-w-full object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Quick Rotation & Crop Presets */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 min-touch-target"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Putar Kiri (90°)</span>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 min-touch-target"
            >
              <RotateCw className="w-4 h-4" />
              <span>Putar Kanan (90°)</span>
            </button>
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={handlePresetFull}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                marginLeft === 0 && marginRight === 0
                  ? "bg-white text-sky-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Penuh (Asli)
            </button>
            <button
              type="button"
              onClick={handlePresetReceiptTrim}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                marginLeft > 0
                  ? "bg-white text-sky-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Fokus Struk
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onConfirm(file)}
            className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 min-touch-target"
          >
            Lewati Crop
          </button>

          <button
            type="button"
            onClick={handleConfirmCrop}
            className="py-3 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition active:scale-95 min-touch-target"
          >
            <Check className="w-4 h-4" />
            <span>Pindai Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
