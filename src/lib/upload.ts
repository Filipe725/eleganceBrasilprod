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

const PUBLIC_BUCKET_PREFIX = '/storage/v1/object/public/perfumes/';

/**
 * Extrai o caminho dentro do bucket `perfumes` a partir da URL pública.
 * Retorna null para URLs de fora do bucket (ex.: `/hero-desktop.jpeg`).
 */
function storagePathFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const index = pathname.indexOf(PUBLIC_BUCKET_PREFIX);
    if (index === -1) return null;
    return decodeURIComponent(pathname.slice(index + PUBLIC_BUCKET_PREFIX.length));
  } catch {
    return null;
  }
}

/**
 * Apaga do Storage as imagens que deixaram de ser usadas (registro
 * excluído ou arte/foto substituída). É "melhor esforço": se falhar, o
 * registro já foi salvo e o arquivo só fica órfão no bucket, como antes.
 */
export async function deleteImages(
  urls: (string | null | undefined)[]
): Promise<void> {
  const paths = urls.flatMap((url) => {
    const path = url ? storagePathFromUrl(url) : null;
    return path ? [path] : [];
  });
  if (paths.length === 0) return;

  try {
    await createClient().storage.from('perfumes').remove(paths);
  } catch {
    // ignora: ver comentário acima
  }
}
