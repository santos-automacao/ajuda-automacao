// Testes da conversão banco → catálogo. Rodar: npm run testes
// (O Node 26 lê o arquivo .ts direto, sem compilar.)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { buscarLinhas, catalogoValido, maisNovo, montarCatalogo } from '../../src/dados/catalogoBanco.ts';

const doApp = JSON.parse(readFileSync(new URL('../../src/dados/catalogo.json', import.meta.url), 'utf8'));

/**
 * Como o banco devolve: o código da planilha fica em "codigo"; "id" é o número do registro
 * (de propósito em ordem contrária ao código, para pegar quem ordenar ou usar o id errado).
 */
function comoNoBanco(lista) {
  return lista.map(({ id, ...resto }, n) => ({ id: 900 - n, codigo: id, stareg: 'A', criado_em: '2026-11-26T00:00:00Z', ...resto }));
}

/** Linhas mínimas do banco, uma de cada tabela; cada teste muda só o que precisa. */
function linhas(mudar = {}) {
  const l = {
    catalogo_info: [{ id: 1, gerado_em: '2026-11-26 12:07:38.239+00' }],
    imoveis: [{ id: 'casa', ordem: 1, nome: 'Casa', situacao: 'Ativo no MVP' }],
    comodos: [{
      id: 'sala', ordem: 1, nome: 'Sala', sensor_sugerido: 'SENSOR_PRESENCA',
      sugestao_luz: 2, sugestao_tomada: 0, sugestao_cortina: 0, sugestao_ar_condicionado: 0, sugestao_tv: 0,
      sugestao_portao: 0, sugestao_fechadura: 0, sugestao_camera: 0, sugestao_sensor: 1,
    }],
    itens: [{ id: 'luz', ordem: 1, botao: 'Luz', pergunta: 'Quantas?', ajuda: 'Conte.', tipo_padrao: 'INT_TOUCH', outros_tipos: ['MOD_RELE'] }],
    tipos_aparelho: [{
      id: 'INT_TOUCH', ordem: 1, item: 'luz', nome: 'Interruptor', para_que: 'Troca', neutro: 'Sim',
      central: 'Não', alimentacao: 'Rede', cuidados: 'Cuidado', passos: '1. Desligue.',
    }],
    produtos: [produto('P001')],
    regras_eletricas: [{ id: 'R01', quando: 'Q', acao: 'A', mensagem: 'M', servico: '—', servico_codigo: null, base: 'B' }],
    servicos: [{ id: 'S01', nome: 'Instalar', unidade: 'por unidade', valor_referencia: null }],
    ...mudar,
  };
  for (const t of Object.keys(l)) if (t !== 'catalogo_info') l[t] = comoNoBanco(l[t]);
  return l;
}

function produto(id, mudar = {}) {
  return {
    id, item: 'luz', tipo: 'INT_TOUCH', marca: 'Intelbras', modelo: 'EWS 1001', nome: 'Interruptor', app: 'Mibo',
    alexa: 'Sim', google: 'Sim', protocolo: 'Wi-Fi', neutro: 'Sim', tensao: 'bivolt', corrente_max: '10',
    potencia_max: '1270 (127 V) / 2200 (220 V)', teclas: 'Verificar', alimentacao: 'Rede', anatel: '123',
    inmetro: '—', fabricado_brasil: 'Não', garantia_meses: 12, preco: 135.9, preco_em: null, link: 'https://a',
    fonte: 'https://b', foto_url: null, foto_fonte: null, status: 'A verificar', verificado_em: null,
    observacoes: null, atualizado_em: '2026-11-26T00:00:00Z', ...mudar,
  };
}

test('converte nomes e números', () => {
  const c = montarCatalogo(linhas());
  const p = c.produtos[0];
  assert.equal(p.correnteMax, 10);
  assert.equal(p.potenciaMax, '1270 (127 V) / 2200 (220 V)');
  assert.equal(p.teclas, 'Verificar');
  assert.equal(p.fotoUrl, null);
  assert.equal(p.fabricadoBrasil, 'Não');
  assert.equal('preco_em' in p, false);
  assert.equal('atualizadoEm' in p, false);
  assert.deepEqual(c.servicos[0], { id: 'S01', servico: 'Instalar', unidade: 'por unidade', valor: null });
  assert.deepEqual(c.tipos[0], {
    id: 'INT_TOUCH', item: 'luz', nome: 'Interruptor', paraQue: 'Troca', neutro: 'Sim',
    central: 'Não', alimentacao: 'Rede', cuidados: 'Cuidado', passos: '1. Desligue.',
  });
  assert.deepEqual(c.regras[0], { id: 'R01', quando: 'Q', acao: 'A', mensagem: 'M', servico: '—', base: 'B' });
  assert.equal(c.geradoEm, '2026-11-26T12:07:38.239Z');
});

test('ordena pela ordem da planilha e pelo código', () => {
  const c = montarCatalogo(linhas({
    imoveis: [
      { id: 'apartamento', ordem: 2, nome: 'Apartamento', situacao: 'Em breve' },
      { id: 'casa', ordem: 1, nome: 'Casa', situacao: 'Ativo no MVP' },
    ],
    produtos: [produto('P002'), produto('P001')],
  }));
  assert.deepEqual(c.imoveis.map((i) => i.id), ['casa', 'apartamento']);
  assert.deepEqual(c.imoveis[0], { id: 'casa', nome: 'Casa', situacao: 'Ativo no MVP' });
  assert.deepEqual(c.produtos.map((p) => p.id), ['P001', 'P002']);
});

test('tipo padrão do sensor vem do cômodo', () => {
  const c = montarCatalogo(linhas({ itens: [{ id: 'sensor', ordem: 9, botao: 'Sensor', pergunta: 'Q', ajuda: 'A', tipo_padrao: null, outros_tipos: [] }] }));
  assert.equal(c.itens[0].tipoPadrao, '(pelo cômodo)');
});

test('sugestão do cômodo vira um objeto por item', () => {
  const c = montarCatalogo(linhas());
  assert.equal(c.comodos[0].sugestao.luz, 2);
  assert.equal(c.comodos[0].sugestao.sensor, 1);
  assert.equal(c.comodos[0].sensorSugerido, 'SENSOR_PRESENCA');
  assert.equal('sugestao_luz' in c.comodos[0], false);
});

test('catalogoValido recusa cópia estragada', () => {
  assert.equal(catalogoValido(null), false);
  assert.equal(catalogoValido('{}'), false);
  assert.equal(catalogoValido({}), false);
  assert.equal(catalogoValido({ ...doApp, produtos: [] }), false);
  assert.equal(catalogoValido({ ...doApp, geradoEm: 'abc' }), false);
  assert.equal(catalogoValido(doApp), true);
});

test('maisNovo fica com a cópia de data mais nova; empate fica com a do app', () => {
  const novo = { ...doApp, geradoEm: '2099-01-01T00:00:00.000Z' };
  const velho = { ...doApp, geradoEm: '2000-01-01T00:00:00.000Z' };
  const igual = { ...doApp };
  assert.equal(maisNovo(doApp, novo), novo);
  assert.equal(maisNovo(doApp, velho), doApp);
  assert.equal(maisNovo(doApp, igual), doApp);
  assert.equal(maisNovo(doApp, null), doApp);
});

test('o código da planilha vira o id do app (o número do registro não entra)', () => {
  const c = montarCatalogo(linhas());
  assert.equal(c.produtos[0].id, 'P001');
  assert.equal(c.servicos[0].id, 'S01');
  assert.equal(c.imoveis[0].id, 'casa');
  for (const k of ['codigo', 'stareg', 'criadoEm', 'criado_em']) assert.equal(k in c.produtos[0], false, k);
});

test('buscarLinhas baixa só os registros atuais (stareg A) das 7 tabelas', async () => {
  const pedidos = [];
  const resposta = { data: [], error: null };
  const cliente = {
    from(tabela) {
      return {
        select(colunas) {
          const consulta = Promise.resolve(resposta);
          consulta.eq = (coluna, valor) => { pedidos.push(`${tabela}:${coluna}=${valor}`); return Promise.resolve(resposta); };
          pedidos.push(`${tabela}:${colunas}`);
          return consulta;
        },
      };
    },
  };
  await buscarLinhas(cliente);
  for (const t of ['imoveis', 'comodos', 'itens', 'tipos_aparelho', 'produtos', 'regras_eletricas', 'servicos']) {
    assert.ok(pedidos.includes(`${t}:stareg=A`), t);
  }
  assert.ok(!pedidos.includes('catalogo_info:stareg=A'));
});
