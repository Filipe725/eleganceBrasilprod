import { createClient } from '@/lib/supabase/client';

/**
 * Envia uma imagem para o bucket público `perfumes` do Supabase Storage
 * e retorna a URL pública. `folder` separa fotos de produto ('') de
 * banners ('banners').
 */
export async function uploadImage(file: File, folder = ''): Promise<string> {
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
