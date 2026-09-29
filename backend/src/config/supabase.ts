import { StorageClient } from '@supabase/storage-js';
import dotenv from 'dotenv';

dotenv.config();

export const SUPABASE_STORAGE_URL =
  process.env.SUPABASE_URL || 'https://ykzpelepxkrkzbxlrydi.supabase.co';
export const SUPABASE_STORAGE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
export const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'products';

export const supabaseStorage =
  SUPABASE_STORAGE_URL && SUPABASE_STORAGE_KEY
    ? new StorageClient(`${SUPABASE_STORAGE_URL}/storage/v1`, {
        apikey: SUPABASE_STORAGE_KEY,
        Authorization: `Bearer ${SUPABASE_STORAGE_KEY}`,
      })
    : null;
