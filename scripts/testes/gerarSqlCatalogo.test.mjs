// Testes do gerador do SQL de carga do catálogo. Rodar: npm run testes
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { test } from 'node:test';

const gerador = new URL('../gerar-sql-catalogo.mjs', import.meta.url);
const catalogo = JSON.parse(readFileSync(new URL('../../src/dados/catalogo.json', import.meta.url), 'utf8'));

/** Roda o gerador gravando num arquivo temporário (não mexe em supabase/seed/). */
function gerarSql() {
  const saida = path.join(mkdtempSync(path.join(tmpdir(), 'sql-catalogo-')), 'catalogo.sql');
  execFileSync(process.execPath, [gerador.pathname.replace(/^\/([A-Za-z]:)/, '$1'), saida]);
  return readFileSync(saida, 'utf8');
}

test('apaga do banco o que saiu da planilha', () => {
  const sql = gerarSql();
  for (const tabela of ['produtos', 'regras_eletricas', 'itens', 'comodos', 'imoveis', 'tipos_aparelho', 'servicos']) {
    assert.match(sql, new RegExp(`delete from public\\.${tabela} where id not in \\(`), tabela);
  }
  const apagarProdutos = sql.match(/delete from public\.produtos where id not in \(([^)]*)\)/)[1];
  assert.equal(apagarProdutos.split(',').length, catalogo.produtos.length);
  assert.ok(apagarProdutos.includes("'P037'"));
});

test('apaga depois de inserir, e os filhos antes dos pais', () => {
  const sql = gerarSql();
  const pos = (trecho) => sql.indexOf(trecho);
  assert.ok(pos('delete from public.produtos') > pos('insert into public.produtos'), 'produtos: insere antes de apagar');
  assert.ok(pos('delete from public.produtos') < pos('delete from public.tipos_aparelho'), 'produto antes do tipo');
  assert.ok(pos('delete from public.itens') < pos('delete from public.tipos_aparelho'), 'item antes do tipo');
  assert.ok(pos('delete from public.comodos') < pos('delete from public.tipos_aparelho'), 'cômodo antes do tipo');
  assert.ok(pos('delete from public.regras_eletricas') < pos('delete from public.servicos'), 'regra antes do serviço');
  assert.ok(pos('delete from public.servicos') < pos('commit;'));
});
