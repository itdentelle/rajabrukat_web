import { API_BASE_URL } from './api';
import { supabase } from './supabase';

/**
 * Universal image uploader for Raja Brukat
 * Prioritizes direct VPS local disk storage via /api/upload.
 * Falls back to Supabase Storage only if configured.
 */
export async function uploadImage(
  file: File,
  bucket: string = 'products',
  customFileName?: string
): Promise<string> {
  // 1. Prioritaskan Upload ke Backend VPS (Lokal Disk /uploads/)
  try {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (backendErr) {
    console.warn('[Upload] Backend local upload error, trying Supabase fallback...', backendErr);
  }

  // 2. Fallback Supabase Storage (jika kredensial tersedia)
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = customFileName || `upload-${Date.now()}.${fileExt}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
    if (!upErr) {
      const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch (supabaseErr) {
    console.warn('[Upload] Supabase fallback error:', supabaseErr);
  }

  throw new Error('Gagal mengunggah gambar ke server lokal maupun cloud');
}
