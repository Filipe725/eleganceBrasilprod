import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const { data, error } = await supabase
  .from('perfumes')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Erro ao consultar perfumes:', error.message);
  process.exit(1);
}

const columns = [
  'id', 'nome', 'marca', 'preco_antigo', 'preco_atual',
  'familia_olfativa', 'tamanho', 'tag_destaque', 'resumo',
  'notas_olfativas', 'fotos', 'ativo', 'created_at', 'updated_at',
];

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value) ? value.join('; ') : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const header = columns.join(',');
const rows = data.map((row) => columns.map((col) => csvEscape(row[col])).join(','));
const csv = [header, ...rows].join('\n');

const outPath = new URL('../relatorio-perfumes.csv', import.meta.url);
writeFileSync(outPath, csv, 'utf8');

console.log(`OK: ${data.length} perfumes exportados para ${outPath.pathname}`);
