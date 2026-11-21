import type { Assinante, PlanoAssinatura, StatusAssinante } from './types';
import { formatTelefone } from './assinatura';

/**
 * Exportação para a planilha "Controle de Assinantes - Clube de Decants"
 * (aba Clientes). Ela tem 8 colunas de PREENCHIMENTO (A–H, cabeçalho
 * dourado) e, de I a O, fórmulas já escritas até a linha 504. Por isso a
 * exportação traz exatamente estas 8 colunas, nesta ordem e SEM cabeçalho:
 * colando/importando a partir da primeira linha vazia da coluna A, as
 * fórmulas de I–O continuam intactas e calculam sozinhas.
 */
export const COLUNAS_PLANILHA = [
  'Cliente',
  'WhatsApp',
  'Plano',
  'Período',
  'Data do pagamento',
  'Status',
  'Atendente',
  'Observações',
] as const;

/**
 * A planilha só aceita Ativo / Pausado / Cancelado (validação da coluna F).
 * "Pendente" (ainda não pagou) sai em branco: a coluna Situação mostra
 * "Falta preencher" até a atendente completar Período, Data e Status.
 */
const STATUS_PLANILHA: Record<StatusAssinante, string> = {
  pendente: '',
  ativo: 'Ativo',
  pausado: 'Pausado',
  cancelado: 'Cancelado',
};

/**
 * Texto digitado pelo cliente no site vai para a planilha: algo como
 * `=IMPORTXML(...)` viraria FÓRMULA (CSV/formula injection). O apóstrofo
 * na frente força texto no Google Planilhas e no Excel e não aparece na
 * célula. Tabs e quebras de linha viram espaço (quebrariam as colunas).
 */
function celula(valor: string): string {
  const limpo = valor.replace(/[\t\r\n]+/g, ' ').trim();
  return /^[=+\-@]/.test(limpo) ? `'${limpo}` : limpo;
}

function observacoes(assinante: Assinante): string {
  const partes: string[] = [];
  if (assinante.familias_preferidas.length > 0) {
    partes.push(`Prefere: ${assinante.familias_preferidas.join(', ')}`);
  }
  if (assinante.familias_evitar.length > 0) {
    partes.push(`Evita: ${assinante.familias_evitar.join(', ')}`);
  }
  if (assinante.genero_preferido !== 'Sem preferência') {
    partes.push(`Gênero: ${assinante.genero_preferido}`);
  }
  if (assinante.observacoes?.trim()) {
    partes.push(`Obs. do cliente: ${assinante.observacoes.trim()}`);
  }
  return partes.join('. ');
}

/** Uma linha da aba Clientes (colunas A–H). */
export function linhaPlanilha(
  assinante: Assinante,
  plano: PlanoAssinatura | undefined
): string[] {
  return [
    assinante.nome,
    formatTelefone(assinante.whatsapp),
    plano?.nome ?? '',
    '', // Período: combinado no WhatsApp (Trimestral / Semestral / Anual)
    '', // Data do pagamento: preenchida quando o cliente pagar
    STATUS_PLANILHA[assinante.status],
    '', // Atendente
    observacoes(assinante),
  ].map(celula);
}

/** Para colar (Ctrl+V) direto na planilha: colunas separadas por tab. */
export function paraColar(linhas: string[][]): string {
  return linhas.map((linha) => linha.join('\t')).join('\n');
}

/**
 * CSV para Arquivo → Importar no Google Planilhas: UTF-8 sem BOM (o
 * Google lê UTF-8 por padrão; o BOM apareceria grudado no 1º nome),
 * vírgula como separador e todos os campos entre aspas.
 */
export function paraCsv(linhas: string[][]): string {
  return linhas
    .map((linha) => linha.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}
