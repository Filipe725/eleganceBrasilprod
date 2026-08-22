import { createClient } from '@/lib/supabase/client';

/** Mesmos limites configurados no bucket `perfumes` do Storage. */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Valida tipo e tamanho de uma imagem antes do upload. Retorna a
 * mensagem de erro em português, ou `null` se o arquivo é válido.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Formato não suportado (${file.type || 'desconhecido'}). Use JPG, PNG, WebP ou AVIF.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)} MB). O limite é 5 MB.`;
  }
  return null;
}

/**
 * Envia uma imagem para o bucket público `perfumes` do Supabase Storage
 * e retorna a URL pública. `folder` separa fotos de produto ('') de
 * banners ('banners').
 */
export async function uploadImage(file: File, folder = ''): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const extension = file.name.split('.').pop() ?? 'jpg';
  const name = `${crypto.randomUUID()}.${extension}`;
  const path = folder ? `${folder}/${name}` : name;

  const { error } = await supabase.storage
    .from('perfumes')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Falha no upload da imagem: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from('perfumes').getPublicUrl(path);

  return publicUrl;
}
