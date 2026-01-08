import { db } from './supabase';

// Subir avatar de jugador
export async function uploadPlayerAvatar(
  playerId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${playerId}-${Date.now()}.${fileExt}`;
  const filePath = `players/${fileName}`;

  // Subir archivo
  const { error: uploadError } = await db.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    return null;
  }

  // Obtener URL pública
  const { data } = db.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Eliminar avatar de jugador
export async function deletePlayerAvatar(avatarUrl: string): Promise<boolean> {
  if (!avatarUrl) return false;

  try {
    // Extraer path del URL
    const url = new URL(avatarUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('avatars');
    if (bucketIndex === -1) return false;

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await db.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Subir foto del perdedor
export async function uploadLoserPhoto(
  gameId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${gameId}-${Date.now()}.${fileExt}`;
  const filePath = `games/${fileName}`;

  // Subir archivo
  const { error: uploadError } = await db.storage
    .from('loser-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading loser photo:', uploadError);
    return null;
  }

  // Obtener URL pública
  const { data } = db.storage
    .from('loser-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Eliminar foto del perdedor
export async function deleteLoserPhoto(photoUrl: string): Promise<boolean> {
  if (!photoUrl) return false;

  try {
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('loser-photos');
    if (bucketIndex === -1) return false;

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await db.storage
      .from('loser-photos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting loser photo:', error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Comprimir imagen antes de subir
export async function compressImage(file: File, maxWidth = 400): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

