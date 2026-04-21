import { decode } from 'base64-arraybuffer';

import { supabase } from '../../../lib/supabase';

export type UploadAvatarParams = {
  userId: string;
  imageBase64?: string | null;
  imageUri?: string | null;
  mimeType?: string | null;
};

export type RemoveAvatarParams = {
  userId: string;
};

const AVATAR_BUCKET = 'avatars';
const AVATAR_FILE_NAME = 'avatar';
const DEFAULT_AVATAR_EXTENSION = 'jpg';

function normalizeAvatarMimeType(mimeType: string | null | undefined): string {
  const normalized = (mimeType ?? '').toLowerCase().trim();
  if (!normalized) {
    return 'image/jpeg';
  }
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized;
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    case 'image/jpeg':
    default:
      return DEFAULT_AVATAR_EXTENSION;
  }
}

function avatarObjectPath(userId: string, mimeType: string): string {
  const extension = extensionFromMimeType(mimeType);
  return `${userId}/${AVATAR_FILE_NAME}.${extension}`;
}

function stripDataUrlPrefix(base64Value: string): string {
  const commaIndex = base64Value.indexOf(',');
  if (commaIndex === -1) {
    return base64Value;
  }
  return base64Value.slice(commaIndex + 1);
}

function base64ToArrayBuffer(base64Value: string): ArrayBuffer {
  const normalized = stripDataUrlPrefix(base64Value).trim();
  if (!normalized) {
    throw new Error('Could not read the selected image.');
  }

  const buffer = decode(normalized);
  if (buffer.byteLength === 0) {
    throw new Error('Could not read the selected image.');
  }

  return buffer;
}

async function imageUriToArrayBuffer(imageUri: string): Promise<ArrayBuffer> {
  const imageResponse = await fetch(imageUri);
  if (!imageResponse.ok) {
    throw new Error('Could not read the selected image.');
  }

  const buffer = await imageResponse.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Could not read the selected image.');
  }

  return buffer;
}

function isObjectNotFoundError(message: string | undefined): boolean {
  const normalized = (message ?? '').toLowerCase();
  return normalized.includes('not found') || normalized.includes('does not exist');
}

export function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) {
    return null;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
  return publicUrl || null;
}

async function readAvatarPathFromProfile(userId: string): Promise<{ avatarPath: string | null; errorMessage: string | null }> {
  const { data, error } = await supabase.from('profiles').select('avatar_path').eq('id', userId).maybeSingle();

  if (error) {
    return {
      avatarPath: null,
      errorMessage: error.message ?? 'Could not load profile image.',
    };
  }

  const rawPath = data?.avatar_path;
  if (typeof rawPath !== 'string') {
    return { avatarPath: null, errorMessage: null };
  }

  const normalizedPath = rawPath.trim();
  return { avatarPath: normalizedPath.length > 0 ? normalizedPath : null, errorMessage: null };
}

async function upsertAvatarPathOnProfile(userId: string, avatarPath: string | null): Promise<string | null> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, avatar_path: avatarPath }, { onConflict: 'id' });

  if (!error) {
    return null;
  }

  return error.message ?? 'Could not save profile image.';
}

export async function getAvatarPath(userId: string): Promise<{ avatarPath: string | null; errorMessage: string | null }> {
  return readAvatarPathFromProfile(userId);
}

export async function uploadAvatar({
  userId,
  imageBase64,
  imageUri,
  mimeType,
}: UploadAvatarParams): Promise<{ avatarPath: string | null; errorMessage: string | null }> {
  const normalizedMimeType = normalizeAvatarMimeType(mimeType);
  const nextAvatarPath = avatarObjectPath(userId, normalizedMimeType);
  const { avatarPath: previousAvatarPath, errorMessage: previousAvatarPathError } = await readAvatarPathFromProfile(
    userId
  );
  if (previousAvatarPathError) {
    return { avatarPath: null, errorMessage: previousAvatarPathError };
  }

  let fileArrayBuffer: ArrayBuffer;
  try {
    if (imageBase64) {
      fileArrayBuffer = base64ToArrayBuffer(imageBase64);
    } else if (imageUri) {
      fileArrayBuffer = await imageUriToArrayBuffer(imageUri);
    } else {
      throw new Error('Could not read the selected image.');
    }
  } catch {
    return { avatarPath: previousAvatarPath, errorMessage: 'Could not read the selected image.' };
  }

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(nextAvatarPath, fileArrayBuffer, {
    cacheControl: '3600',
    contentType: normalizedMimeType,
    upsert: true,
  });

  if (uploadError) {
    return { avatarPath: previousAvatarPath, errorMessage: uploadError.message ?? 'Could not upload avatar image.' };
  }

  if (previousAvatarPath && previousAvatarPath !== nextAvatarPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
  }

  const upsertError = await upsertAvatarPathOnProfile(userId, nextAvatarPath);
  if (upsertError) {
    return { avatarPath: previousAvatarPath, errorMessage: upsertError };
  }

  return { avatarPath: nextAvatarPath, errorMessage: null };
}

export async function removeAvatar({ userId }: RemoveAvatarParams): Promise<{ avatarPath: null; errorMessage: string | null }> {
  const { avatarPath: currentAvatarPath, errorMessage: currentAvatarPathError } = await readAvatarPathFromProfile(
    userId
  );
  if (currentAvatarPathError) {
    return { avatarPath: null, errorMessage: currentAvatarPathError };
  }

  if (currentAvatarPath) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([currentAvatarPath]);
    if (removeError && !isObjectNotFoundError(removeError.message)) {
      return { avatarPath: null, errorMessage: removeError.message ?? 'Could not remove avatar image.' };
    }
  }

  const upsertError = await upsertAvatarPathOnProfile(userId, null);
  if (upsertError) {
    return { avatarPath: null, errorMessage: upsertError };
  }

  return { avatarPath: null, errorMessage: null };
}
