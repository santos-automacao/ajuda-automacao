// Confere se o catálogo montado a partir do banco é IGUAL ao src/dados/catalogo.json.
// Uso: npm run comparar-catalogo   (rodar depois de aplicar supabase/seed/catalogo.sql no banco)
// Diferença encontrada = corrigir a conversão (src/dados/catalogoBanco.ts) ou o gerador do SQL, não este script.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

import { buscarLinhas, montarCatalogo } from '../src/dados/catalogoBanco.ts';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !chave) {
  console.error('Faltam EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env');
  process.exit(1);
}

const cliente = createClient(url, chave, { auth: { persistSession: false } });
const doBanco = montarCatalogo(await buscarLinhas(cliente));
// Opcional: outro arquivo para comparar (usado para provar que o script acusa diferença).
const arquivo = process.argv[2] ?? new URL('../src/dados/catalogo.json', import.meta.url);
const doApp = JSON.parse(readFileSync(arquivo, 'utf8'));

const diferencas = [];
/** Compara campo a campo; listas de objetos com "id" são casadas pelo id. */
function comparar(a, b, caminho) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (Array.isArray(a) && Array.isArray(b) && a.every((x) => x?.id) && b.every((x) => x?.id)) {
    const ids = [...new Set([...a.map((x) => x.id), ...b.map((x) => x.id)])];
    for (const id of ids) comparar(a.find((x) => x.id === id), b.find((x) => x.id === id), `${caminho}[${id}]`);
    if (JSON.stringify(a.map((x) => x.id)) !== JSON.stringify(b.map((x) => x.id))) diferencas.push(`${caminho}: ordem diferente`);
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) comparar(a[k], b[k], `${caminho}.${k}`);
    return;
  }
  diferencas.push(`${caminho}: banco ${JSON.stringify(a)} ≠ planilha ${JSON.stringify(b)}`);
}

comparar(doBanco, doApp, 'catalogo');
if (diferencas.length) {
  console.error(`${diferencas.length} diferença(s):\n` + diferencas.join('\n'));
  process.exit(1);
}
console.log(`Catálogo do banco igual ao catalogo.json (${doBanco.produtos.length} produtos, gerado em ${doBanco.geradoEm}).`);
