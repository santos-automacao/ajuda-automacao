// Converte a planilha do catálogo e os desenhos SVG em dados para o app.
// Uso: npm run dados
// Lê:   catalogo/catalogo-casa.xlsx  e  design/ilustracoes/svg/*.svg
// Gera: src/dados/catalogo.json      e  src/dados/ilustracoes.ts
import readExcelFile from 'read-excel-file/node';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'src', 'dados');
fs.mkdirSync(destino, { recursive: true });

// ---------------------------------------------------------------- Planilha
const abas = await readExcelFile(path.join(raiz, 'catalogo', 'catalogo-casa.xlsx'));

/** Lê uma aba e devolve objetos com as chaves do mapa { chave: 'Título da coluna' }. */
function lerAba(nomeAba, mapa, chaveObrigatoria) {
  const aba = abas.find((a) => a.sheet === nomeAba);
  if (!aba) throw new Error(`Aba "${nomeAba}" não encontrada na planilha`);
  const [cabecalho, ...linhasBrutas] = aba.data;
  const titulos = cabecalho.map((v) => (typeof v === 'string' ? v.trim() : v));
  const indices = Object.fromEntries(
    Object.entries(mapa).map(([chave, coluna]) => {
      const i = titulos.indexOf(coluna);
      if (i < 0) throw new Error(`Coluna "${coluna}" não encontrada na aba "${nomeAba}"`);
      return [chave, i];
    }),
  );
  const linhas = [];
  for (const linha of linhasBrutas) {
    const obj = {};
    for (const [chave, i] of Object.entries(indices)) obj[chave] = linha[i] ?? null;
    if (obj[chaveObrigatoria] !== null && obj[chaveObrigatoria] !== '') linhas.push(obj);
  }
  return linhas;
}

const ITENS = ['luz', 'tomada', 'cortina', 'ar_condicionado', 'tv', 'portao', 'fechadura', 'camera', 'sensor'];
const COLUNA_SUGESTAO = {
  luz: 'Luz (teclas)', tomada: 'Tomada', cortina: 'Cortina', ar_condicionado: 'Ar-condicionado', tv: 'TV',
  portao: 'Portão', fechadura: 'Fechadura', camera: 'Câmera', sensor: 'Sensor',
};

const comodos = lerAba('Cômodos', {
  ordem: 'Ordem', id: 'ID', nome: 'Nome', sensorSugerido: 'Sensor sugerido',
  ...Object.fromEntries(ITENS.map((i) => [`sug_${i}`, COLUNA_SUGESTAO[i]])),
}, 'ordem').map((c) => ({
  ordem: c.ordem, id: c.id, nome: c.nome, sensorSugerido: c.sensorSugerido || null,
  sugestao: Object.fromEntries(ITENS.map((i) => [i, Number(c[`sug_${i}`]) || 0])),
}));

const catalogo = {
  geradoEm: new Date().toISOString(),
  imoveis: lerAba('Imóveis', { id: 'ID', nome: 'Nome', situacao: 'Situação' }, 'id'),
  comodos,
  itens: lerAba('Itens', {
    ordem: 'Ordem', id: 'ID', botao: 'Texto do botão', pergunta: 'Pergunta de quantidade',
    ajuda: 'Ajuda (texto curto na tela)', tipoPadrao: 'Tipo padrão', outrosTipos: 'Outros tipos',
  }, 'id').map((i) => ({
    ...i,
    outrosTipos: (i.outrosTipos || '').split(',').map((t) => t.trim()).filter(Boolean),
  })),
  tipos: lerAba('Tipos de aparelho', {
    id: 'ID', item: 'Item', nome: 'Nome', paraQue: 'Para que serve', neutro: 'Precisa de neutro',
    central: 'Precisa de central', alimentacao: 'Alimentação', cuidados: 'Cuidados elétricos',
    passos: 'Passo a passo de instalação (resumo)',
  }, 'id'),
  produtos: lerAba('Produtos', {
    id: 'ID', item: 'Item', tipo: 'Tipo de aparelho', marca: 'Marca', modelo: 'Modelo', nome: 'Nome comercial',
    app: 'App do fabricante', alexa: 'Alexa', google: 'Google Home', protocolo: 'Protocolo',
    neutro: 'Precisa de neutro', tensao: 'Tensão', correnteMax: 'Corrente máx. (A)', potenciaMax: 'Potência máx. (W)',
    teclas: 'Teclas / canais', alimentacao: 'Alimentação', anatel: 'Nº Anatel', inmetro: 'INMETRO',
    fabricadoBrasil: 'Fabricado no Brasil', garantiaMeses: 'Garantia (meses)', preco: 'Preço de referência (R$)',
    link: 'Link de compra', fonte: 'Fonte da informação', status: 'Status', verificadoEm: 'Verificado em',
    observacoes: 'Observações',
  }, 'id').map((p) => ({ ...p, preco: typeof p.preco === 'number' ? p.preco : null })),
  regras: lerAba('Regras elétricas', {
    id: 'ID', quando: 'Quando acontece', acao: 'O que o app faz', mensagem: 'Mensagem para o eletricista',
    servico: 'Serviço adicionado ao orçamento', base: 'Base',
  }, 'id'),
  servicos: lerAba('Mão de obra', { servico: 'Serviço', unidade: 'Unidade', valor: 'Valor (R$)' }, 'unidade')
    .map((s) => ({ ...s, valor: typeof s.valor === 'number' ? s.valor : null })),
};

fs.writeFileSync(path.join(destino, 'catalogo.json'), JSON.stringify(catalogo, null, 2) + '\n');

// ---------------------------------------------------------------- Ilustrações
const pastaSvg = path.join(raiz, 'design', 'ilustracoes', 'svg');
const pastaPng = path.join(raiz, 'design', 'ilustracoes', 'png');
fs.mkdirSync(pastaPng, { recursive: true });
const arquivos = fs.readdirSync(pastaSvg).filter((f) => f.endsWith('.svg')).sort();
const mapa = {};
for (const arquivo of arquivos) {
  const nome = path.basename(arquivo, '.svg');
  const svg = fs.readFileSync(path.join(pastaSvg, arquivo), 'utf8').replace(/\s+/g, ' ').trim();
  mapa[nome] = svg;
  // PNG de 256 px (usado na planilha e onde SVG não serve)
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } }).render().asPng();
  fs.writeFileSync(path.join(pastaPng, `${nome}.png`), png);
}
const ts = `// Arquivo gerado por scripts/gerar-dados.mjs — não edite à mão.
// Para mudar um desenho, edite design/ilustracoes/svg/<nome>.svg e rode: npm run dados

export const ilustracoes = ${JSON.stringify(mapa, null, 2)} as const;

export type NomeIlustracao = keyof typeof ilustracoes;
`;
fs.writeFileSync(path.join(destino, 'ilustracoes.ts'), ts);

console.log(
  `Catálogo: ${catalogo.comodos.length} cômodos, ${catalogo.itens.length} itens, ${catalogo.tipos.length} tipos, ` +
  `${catalogo.produtos.length} produtos, ${catalogo.regras.length} regras, ${catalogo.servicos.length} serviços. ` +
  `Ilustrações: ${arquivos.length}.`,
);
