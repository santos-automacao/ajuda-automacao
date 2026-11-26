// Confere se o catálogo montado a partir do banco é IGUAL ao src/dados/catalogo.json.
// Uso: npm run comparar-catalogo   (rodar depois de aplicar supabase/seed/catalogo.sql no banco)
// Diferença encontrada = corrigir a conversão (src/dados/catalogoBanco.ts) ou o gerador do SQL, não este script.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

import { buscarLinhas, montarCatalogo } from '../src/dados/catalogoBanco.ts';
import { compararCatalogos } from './compararCatalogo.mjs';

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

const { diferencas } = compararCatalogos(doBanco, doApp);
if (diferencas.length) {
  console.error(`${diferencas.length} diferença(s):\n` + diferencas.join('\n'));
  process.exit(1);
}
console.log(`Catálogo do banco igual ao catalogo.json (${doBanco.produtos.length} produtos, gerado em ${doBanco.geradoEm}).`);
