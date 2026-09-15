import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Corresponde 1:1 a supabase/migrations/006_fix_marca_familia_typos.sql
const MARCA_FIXES = [
  { marca: 'I-Scents', ids: ['d9cd62d2-cca6-43db-856a-294107dc3a63', '7435e773-c513-47c4-8421-a1c0827ae3a7'] },
  {
    marca: "L'acqua di Fiori".replace("'", '’'),
    ids: [
      'eebf0bc9-fc73-46d3-8fd6-564fe20bf037',
      'd5a93cd2-782f-4ca3-b3fe-7c74c7048cfc',
      'fa48d082-2f1e-43f3-9895-3e6b216c1a51',
      '2c850661-f579-4be2-9c97-cb1b877d69f9',
      '15abcd19-d900-4476-96a5-49eac7964abf',
      '81d4244c-c496-4d8f-a4c1-efa0b9f3e83f',
      '4228b282-9ed3-4a0e-b738-a9cfd1f84745',
      'd02d271c-cfc5-4533-ac48-c1c56054c8ce',
      '89851597-81f9-417e-883c-590569482f5f',
    ],
  },
  { marca: 'Paris Elysees', ids: ['63f60d76-04db-4cf7-850e-360e67818e2b'] },
];

const FAMILIA_FIXES = [
  {
    de: 'Ãmbar',
    para: 'Âmbar',
    ids: [
      '8a2d6e4d-1305-434a-9cad-f6de069fbb09',
      '32c66a4a-fa92-46f5-8649-63f19c462318',
      'd63f3e72-c4bd-426a-ab8d-c292fe4b6b1a',
      '5d4b5c31-f28e-4b23-bc41-8dc0df3cabf8',
      'dbe359a6-fa27-4a6a-a33a-6bc9bd5871fa',
      '6940b156-d826-43e8-a58f-5158496ac431',
      '203dff2a-17a7-425f-a7db-8cfb714527ff',
    ],
  },
  { de: 'apimentado', para: 'Apimentado', ids: ['8a2d6e4d-1305-434a-9cad-f6de069fbb09'] },
  { de: 'Aguático', para: 'Aquático', ids: ['6e07a61c-a415-4724-b96b-7c1be6038811'] },
  { de: 'Especiada', para: 'Especiado', ids: ['e4ecfc75-d7b1-4964-b755-24ef47c1d9ca'] },
  { de: 'Ambarada', para: 'Ambarado', ids: ['004fba74-64ac-42f8-88fb-6fbb2839de14'] },
  { de: 'Frutado', para: 'Frutal', ids: ['0c50aa3a-7661-476e-a41a-cd1ea1cc37e7'] },
];

let erros = 0;

for (const { marca, ids } of MARCA_FIXES) {
  const { data, error } = await supabase
    .from('perfumes')
    .update({ marca })
    .in('id', ids)
    .select('id');
  if (error) {
    console.error(`Erro ao aplicar marca="${marca}":`, error.message);
    erros++;
    continue;
  }
  console.log(`OK marca="${marca}": ${data.length}/${ids.length} linhas`);
}

// familia_olfativa é text[]: agrupa todas as trocas por perfume e aplica
// todas de uma vez sobre o array atual — um único fetch + update por id,
// nunca dois updates sequenciais sobre um cache desatualizado (o segundo
// reverteria o primeiro).
const trocasPorId = new Map();
for (const { de, para, ids } of FAMILIA_FIXES) {
  for (const id of ids) {
    if (!trocasPorId.has(id)) trocasPorId.set(id, []);
    trocasPorId.get(id).push({ de, para });
  }
}

for (const [id, trocas] of trocasPorId) {
  const { data: perfume, error: fetchError } = await supabase
    .from('perfumes')
    .select('id, nome, familia_olfativa')
    .eq('id', id)
    .single();
  if (fetchError) {
    console.error(`Erro ao buscar id ${id}:`, fetchError.message);
    erros++;
    continue;
  }

  let novaFamilia = perfume.familia_olfativa;
  for (const { de, para } of trocas) {
    novaFamilia = novaFamilia.map((f) => (f === de ? para : f));
  }

  if (JSON.stringify(novaFamilia) === JSON.stringify(perfume.familia_olfativa)) {
    console.log(`(pulado) ${perfume.nome}: familia_olfativa já está correta`);
    continue;
  }

  const { error } = await supabase
    .from('perfumes')
    .update({ familia_olfativa: novaFamilia })
    .eq('id', id);
  if (error) {
    console.error(`Erro ao corrigir ${perfume.nome}:`, error.message);
    erros++;
    continue;
  }
  console.log(`OK ${perfume.nome}: ${JSON.stringify(novaFamilia)}`);
}

if (erros > 0) {
  console.error(`\nConcluído com ${erros} erro(s).`);
  process.exit(1);
}
console.log('\nTodas as correções aplicadas com sucesso.');
