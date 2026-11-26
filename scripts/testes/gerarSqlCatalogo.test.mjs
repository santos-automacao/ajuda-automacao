// Testes do gerador do SQL de carga do catálogo. Rodar: npm run testes
// Regra (decisão do dono, 26/11/2026): nada é apagado. Mudou → registro antigo vira stareg 'I' e entra um novo
// com id novo e o mesmo código. Saiu da planilha → stareg 'I'.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { test } from 'node:test';

const gerador = new URL('../gerar-sql-catalogo.mjs', import.meta.url);
const catalogo = JSON.parse(readFileSync(new URL('../../src/dados/catalogo.json', import.meta.url), 'utf8'));
const TABELAS = ['imoveis', 'tipos_aparelho', 'itens', 'comodos', 'servicos', 'regras_eletricas', 'produtos'];

/** Roda o gerador gravando num arquivo temporário (não mexe em supabase/seed/). */
function gerarSql() {
  const saida = path.join(mkdtempSync(path.join(tmpdir(), 'sql-catalogo-')), 'catalogo.sql');
  execFileSync(process.execPath, [gerador.pathname.replace(/^\/([A-Za-z]:)/, '$1'), saida]);
  return readFileSync(saida, 'utf8');
}

test('nada é apagado nem sobrescrito', () => {
  const sql = gerarSql();
  assert.doesNotMatch(sql, /delete from/i);
  // Só a data do catálogo (catalogo_info, uma linha só) é sobrescrita.
  assert.deepEqual(sql.match(/insert into public\.\w+ \([^)]*\) values \([^)]*\) on conflict/g)?.map((s) => s.split(' ')[2]),
    ['public.catalogo_info']);
  assert.equal(sql.match(/on conflict/g).length, 1);
});

test('cada tabela: inativa o que mudou, grava o novo e inativa o que saiu da planilha', () => {
  const sql = gerarSql();
  for (const t of TABELAS) {
    const pos = (trecho) => {
      const i = sql.indexOf(trecho);
      assert.ok(i >= 0, `${t}: falta "${trecho}"`);
      return i;
    };
    const temp = pos(`create temp table novo_${t} `);
    const mudou = pos(`update public.${t} t set stareg = 'I' from novo_${t} n where t.codigo = n.codigo and t.stareg = 'A' and (`);
    const insere = pos(`insert into public.${t} (`);
    const saiu = pos(`update public.${t} set stareg = 'I' where stareg = 'A' and codigo not in (select codigo from novo_${t});`);
    assert.ok(temp < mudou && mudou < insere && insere < saiu, `${t}: ordem errada`);
  }
});

test('a comparação usa todas as colunas da planilha (menos id, stareg e datas do registro)', () => {
  const sql = gerarSql();
  const linha = sql.match(/update public\.produtos t set stareg = 'I' from novo_produtos n where .* and \((.*)\) is distinct from \((.*)\);/);
  assert.ok(linha, 'falta o "is distinct from" dos produtos');
  for (const col of ['t.nome', 't.preco', 't.anatel', 't.status', 't.verificado_em', 't.teclas']) assert.ok(linha[1].includes(col), col);
  for (const col of ['t.id', 't.stareg', 't.criado_em', 't.atualizado_em']) assert.ok(!linha[1].includes(col), col);
});

test('todos os códigos da planilha vão para a tabela temporária', () => {
  const sql = gerarSql();
  for (const p of catalogo.produtos) assert.ok(sql.includes(`('${p.id}', `), p.id);
  assert.match(sql, /insert into novo_regras_eletricas \(codigo, quando, acao, mensagem, servico, servico_codigo, base\)/);
});
