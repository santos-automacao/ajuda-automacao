// Testes da comparação banco x planilha. Rodar: npm run testes
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { compararCatalogos } from '../compararCatalogo.mjs';

const planilha = JSON.parse(readFileSync(new URL('../../src/dados/catalogo.json', import.meta.url), 'utf8'));
const copia = () => structuredClone(planilha);

test('iguais: sem diferenças nem avisos', () => {
  assert.deepEqual(compararCatalogos(copia(), copia()), { diferencas: [] });
});

test('acusa valor diferente e ordem diferente', () => {
  const banco = copia();
  banco.produtos[0].preco = 999;
  [banco.imoveis[0], banco.imoveis[1]] = [banco.imoveis[1], banco.imoveis[0]];
  const { diferencas } = compararCatalogos(banco, planilha);
  assert.ok(diferencas.includes(`catalogo.produtos[P001].preco: banco 999 ≠ planilha ${planilha.produtos[0].preco}`));
  assert.ok(diferencas.includes('catalogo.imoveis: ordem diferente'));
});

test('produto que só existe no banco é diferença, mesmo com status Inativo', () => {
  // O banco só manda registros atuais (stareg A): o que saiu da planilha já não vem.
  const banco = copia();
  banco.produtos.push({ ...planilha.produtos[0], id: 'P999', status: 'Inativo' });
  const { diferencas } = compararCatalogos(banco, planilha);
  assert.ok(diferencas.some((d) => d.startsWith('catalogo.produtos[P999]')), diferencas.join('\n'));
});
