"use client";

import { Camera, Check, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import ImageCropper from "@/components/ImageCropper";
import { getAvatarColor, updatePlayer } from "@/lib/players";
import {
  compressImage,
  deletePlayerAvatar,
  uploadPlayerAvatar,
} from "@/lib/storage";
import type { Player } from "@/types";

interface EditPlayerModalProps {
  player: Player | null;
  onClose: () => void;
  onSave?: () => void;
}

export function EditPlayerModal({
  player,
  onClose,
  onSave,
}: EditPlayerModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Initialize state when player changes
  useEffect(() => {
    if (player) {
      setName(player.name);
      setColor(getAvatarColor(player.avatar_color));
      setAvatarUrl(player.avatar_url || undefined);
      setError("");
    }
  }, [player]);

  if (!player) return null;

  // Handle image selection (opens cropper)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // Handle cropped image
  const handleCroppedImage = async (croppedFile: File) => {
    setShowCropper(false);
    setCropperImage(null);
    setUploadingAvatar(true);

    try {
      const compressedFile = await compressImage(croppedFile, 300);
      const url = await uploadPlayerAvatar(player.id, compressedFile);
      if (url) {
        setAvatarUrl(url);
      } else {
        setError(
          'Error al subir la imagen. Verifica que el bucket "avatars" esté configurado en Supabase.',
        );
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError("Error al subir la imagen");
    }
    setUploadingAvatar(false);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setCropperImage(null);
  };

  const handleRemoveAvatar = async () => {
    if (avatarUrl) {
      await deletePlayerAvatar(avatarUrl);
    }
    setAvatarUrl(undefined);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    setError("");

    const updated = await updatePlayer(player.id, {
      name: name.trim(),
      avatar_color: color,
      avatar_url: avatarUrl || null,
    });

    if (updated) {
      onSave?.();
      onClose();
    } else {
      setError("Error al actualizar. ¿Ya existe ese nombre?");
    }

    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background-card rounded-2xl p-6 w-full max-w-md border border-border animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              Editar Jugador
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview del avatar con opción de foto */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl transition-colors"
                  style={{ backgroundColor: color }}
                >
                  {name.charAt(0).toUpperCase() || "?"}
                </div>
              )}

              {/* Overlay para subir foto */}
              <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>

              {/* Botón eliminar foto */}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-danger rounded-full flex items-center justify-center text-white hover:bg-danger/80 transition-colors"
                  title="Eliminar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-foreground-muted text-center mb-4">
            Haz clic en el avatar para subir una foto
          </p>

          <div className="mb-4">
            <label
              htmlFor="edit-player-name"
              className="block text-sm text-foreground-muted mb-2"
            >
              Nombre del jugador
            </label>
            <input
              id="edit-player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Ej: Carlos"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <span className="block text-sm text-foreground-muted mb-2">
              Color del avatar
            </span>
            <ColorPicker selected={color} onChange={setColor} />
          </div>

          {error && <p className="text-danger text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCroppedImage}
          onCancel={handleCancelCrop}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </>
  );
}
