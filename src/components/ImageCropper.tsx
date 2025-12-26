'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
}

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropShape = 'round',
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (): Promise<File | null> => {
    if (!croppedAreaPixels) return null;

    const img = new Image();
    img.src = image;

    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Tamaño del canvas = tamaño del área recortada
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Aplicar rotación si es necesario
        if (rotation !== 0) {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) {
            resolve(null);
            return;
          }

          // Calcular nuevo tamaño después de rotación
          const radians = (rotation * Math.PI) / 180;
          const sin = Math.abs(Math.sin(radians));
          const cos = Math.abs(Math.cos(radians));
          const newWidth = img.width * cos + img.height * sin;
          const newHeight = img.width * sin + img.height * cos;

          tempCanvas.width = newWidth;
          tempCanvas.height = newHeight;

          // Rotar la imagen
          tempCtx.translate(newWidth / 2, newHeight / 2);
          tempCtx.rotate(radians);
          tempCtx.drawImage(img, -img.width / 2, -img.height / 2);

          // Dibujar el área recortada
          ctx.drawImage(
            tempCanvas,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
          );
        } else {
          // Sin rotación, recortar directamente
          ctx.drawImage(
            img,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
          );
        }

        // Convertir a blob y luego a File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
              resolve(file);
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.9
        );
      };

      img.onerror = () => resolve(null);
    });
  };

  const handleConfirm = async () => {
    const croppedFile = await createCroppedImage();
    if (croppedFile) {
      onCropComplete(croppedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-[60]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background-card border-b border-border">
        <button
          onClick={onCancel}
          className="p-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">Recortar imagen</h2>
        <button
          onClick={handleConfirm}
          className="p-2 text-primary hover:text-primary/80 transition-colors"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Área de recorte */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectRatio}
          cropShape={cropShape}
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaComplete}
          classes={{
            containerClassName: 'bg-black',
            cropAreaClassName: cropShape === 'round' ? 'rounded-full' : '',
          }}
        />
      </div>

      {/* Controles */}
      <div className="bg-background-card border-t border-border p-4 space-y-4">
        {/* Zoom */}
        <div className="flex items-center gap-4">
          <ZoomOut className="w-5 h-5 text-foreground-muted" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <ZoomIn className="w-5 h-5 text-foreground-muted" />
        </div>

        {/* Rotación */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setRotation((r) => (r - 90) % 360)}
            className="p-3 rounded-xl bg-background border border-border text-foreground-muted hover:text-foreground transition-colors"
          >
            <RotateCw className="w-5 h-5 transform -scale-x-100" />
          </button>
          <span className="text-sm text-foreground-muted min-w-[60px] text-center">
            {rotation}°
          </span>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-3 rounded-xl bg-background border border-border text-foreground-muted hover:text-foreground transition-colors"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl btn-primary font-medium"
          >
            Aplicar recorte
          </button>
        </div>
      </div>
    </div>
  );
}

