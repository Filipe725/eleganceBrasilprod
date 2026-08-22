/**
 * Valida se um link de destino (banner) é seguro para virar `href`:
 * âncora da própria página, caminho relativo, ou URL http(s) absoluta.
 * Bloqueia esquemas como `javascript:`/`data:` que executariam código
 * no clique.
 */
export function isSafeLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    /^https?:\/\//i.test(trimmed)
  );
}
