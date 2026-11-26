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

test('produto que saiu da planilha fica Inativo no banco (nunca é apagado)', () => {
  const sql = gerarSql();
  assert.doesNotMatch(sql, /delete from public\.produtos/);
  const inativar = sql.match(/update public\.produtos set status = 'Inativo' where id not in \(([^)]*)\)/);
  assert.ok(inativar, 'falta o update que inativa');
  assert.equal(inativar[1].split(',').length, catalogo.produtos.length);
  assert.ok(inativar[1].includes("'P037'"));
});

test('as outras abas: apaga do banco o que saiu da planilha', () => {
  const sql = gerarSql();
  for (const tabela of ['regras_eletricas', 'itens', 'comodos', 'imoveis', 'tipos_aparelho', 'servicos']) {
    assert.match(sql, new RegExp(`delete from public\\.${tabela} where id not in \\(`), tabela);
  }
});

test('inativa/apaga depois de inserir, e os filhos antes dos pais', () => {
  const sql = gerarSql();
  const pos = (trecho) => sql.indexOf(trecho);
  assert.ok(pos("update public.produtos set status = 'Inativo'") > pos('insert into public.produtos'), 'insere antes de inativar');
  assert.ok(pos('delete from public.itens') < pos('delete from public.tipos_aparelho'), 'item antes do tipo');
  assert.ok(pos('delete from public.comodos') < pos('delete from public.tipos_aparelho'), 'cômodo antes do tipo');
  assert.ok(pos('delete from public.regras_eletricas') < pos('delete from public.servicos'), 'regra antes do serviço');
  assert.ok(pos('delete from public.servicos') < pos('commit;'));
});
