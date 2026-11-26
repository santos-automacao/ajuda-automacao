// Testes da comparação banco x planilha. Rodar: npm run testes
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { compararCatalogos } from '../compararCatalogo.mjs';

const planilha = JSON.parse(readFileSync(new URL('../../src/dados/catalogo.json', import.meta.url), 'utf8'));
const copia = () => structuredClone(planilha);

test('iguais: sem diferenças nem avisos', () => {
  assert.deepEqual(compararCatalogos(copia(), copia()), { diferencas: [], avisos: [] });
});

test('acusa valor diferente e ordem diferente', () => {
  const banco = copia();
  banco.produtos[0].preco = 999;
  [banco.imoveis[0], banco.imoveis[1]] = [banco.imoveis[1], banco.imoveis[0]];
  const { diferencas } = compararCatalogos(banco, planilha);
  assert.ok(diferencas.includes(`catalogo.produtos[P001].preco: banco 999 ≠ planilha ${planilha.produtos[0].preco}`));
  assert.ok(diferencas.includes('catalogo.imoveis: ordem diferente'));
});

test('produto que só existe no banco e está Inativo é aviso, não diferença', () => {
  const banco = copia();
  banco.produtos.push({ ...planilha.produtos[0], id: 'P999', status: 'Inativo' });
  assert.deepEqual(compararCatalogos(banco, planilha), {
    diferencas: [],
    avisos: ['P999 está só no banco, Inativo (saiu da planilha)'],
  });
});

test('produto que só existe no banco e NÃO está Inativo é diferença', () => {
  const banco = copia();
  banco.produtos.push({ ...planilha.produtos[0], id: 'P999', status: 'A verificar' });
  const { diferencas, avisos } = compararCatalogos(banco, planilha);
  assert.ok(diferencas.some((d) => d.startsWith('catalogo.produtos[P999]')), diferencas.join('\n'));
  assert.deepEqual(avisos, []);
});
