import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { supabaseStorage, SUPABASE_STORAGE_BUCKET } from '../config/supabase';

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const handleUpload = async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Data gambar tidak ditemukan' });

    // Jika sudah berupa URL publik lengkap (https://...) — kembalikan langsung
    if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
      return res.json({ url: image });
    }

    const matches = image.match(/^data:image\/([a-zA-Z0-9+.=-]+);base64,(.+)$/);
    if (!matches) {
      return res.json({ url: image });
    }

    const rawExt = matches[1].split('+')[0];
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt || 'png';
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // 1. Simpan ke disk lokal VPS (prioritas utama)
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, buffer);
    const backendBaseUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
    const url = backendBaseUrl ? `${backendBaseUrl}/uploads/${fileName}` : `/uploads/${fileName}`;
    console.log(`[UPLOAD] Image saved to local disk: ${url}`);
    return res.json({ url });
  } catch (err: any) {
    // Fallback: Supabase Storage (hanya jika UPLOAD_USE_SUPABASE=true dan kredensial tersedia)
    if (process.env.UPLOAD_USE_SUPABASE === 'true' && supabaseStorage) {
      try {
        const { image } = req.body;
        const matches = image.match(/^data:image\/([a-zA-Z0-9+.=-]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].split('+')[0];
          const ext = rawExt === 'jpeg' ? 'jpg' : rawExt || 'png';
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = `upload_${Date.now()}.${ext}`;
          const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
          const { error: upErr } = await supabaseStorage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(fileName, buffer, { contentType: mimeType, upsert: true });
          if (!upErr) {
            const { data: pubData } = supabaseStorage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(fileName);
            if (pubData?.publicUrl) {
              console.log(`[UPLOAD] Fallback: Image saved to Supabase Storage: ${pubData.publicUrl}`);
              return res.json({ url: pubData.publicUrl });
            }
          }
        }
      } catch (supabaseErr: any) {
        console.warn(`[UPLOAD WARNING] Supabase Storage fallback failed:`, supabaseErr.message);
      }
    }
    console.error('Error pada /api/upload:', err);
    return res.status(500).json({ error: err.message || 'Gagal menyimpan gambar di server' });
  }
};
