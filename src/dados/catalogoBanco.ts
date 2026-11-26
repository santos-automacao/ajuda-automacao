// Monta o catálogo do app a partir das tabelas do Supabase, no MESMO formato do catalogo.json.
// Este arquivo não importa nada em tempo de execução (só tipos), para os testes rodarem no Node:
// npm run testes  (testes em scripts/testes/catalogoBanco.test.mjs)
import type { Catalogo, ComodoTipo, Imovel, Item, ItemId, Produto, Regra, ServicoCatalogo, TipoAparelho } from './catalogo';

type Linha = Record<string, any>;

export interface LinhasBanco {
  catalogo_info: Linha[];
  imoveis: Linha[];
  comodos: Linha[];
  itens: Linha[];
  tipos_aparelho: Linha[];
  produtos: Linha[];
  regras_eletricas: Linha[];
  servicos: Linha[];
}

export const TABELAS_CATALOGO: (keyof LinhasBanco)[] = [
  'catalogo_info', 'imoveis', 'comodos', 'itens', 'tipos_aparelho', 'produtos', 'regras_eletricas', 'servicos',
];

/** O mínimo do cliente do Supabase que usamos (assim este arquivo não depende da biblioteca). */
export interface ClienteLeitura {
  from(tabela: string): { select(colunas: string): PromiseLike<{ data: unknown[] | null; error: unknown }> };
}

/** Lê todas as tabelas do catálogo ao mesmo tempo. Se alguma falhar, lança erro. */
export async function buscarLinhas(cliente: ClienteLeitura): Promise<LinhasBanco> {
  const respostas = await Promise.all(TABELAS_CATALOGO.map((t) => cliente.from(t).select('*')));
  const linhas = {} as LinhasBanco;
  respostas.forEach(({ data, error }, i) => {
    if (error || !data) throw new Error(`Falha ao ler ${TABELAS_CATALOGO[i]}: ${JSON.stringify(error)}`);
    linhas[TABELAS_CATALOGO[i]] = data as Linha[];
  });
  return linhas;
}

const ITENS: ItemId[] = ['luz', 'tomada', 'cortina', 'ar_condicionado', 'tv', 'portao', 'fechadura', 'camera', 'sensor'];

/** "10" vira 10; "10 (5 por canal)" e "Verificar" continuam texto (igual à planilha). */
function numeroOuTexto(x: unknown): number | string | null {
  if (x === null || x === undefined) return null;
  return typeof x === 'string' && /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : (x as number | string);
}

const porOrdem = (a: Linha, b: Linha) => a.ordem - b.ordem;
const porId = (a: Linha, b: Linha) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function montarCatalogo(l: LinhasBanco): Catalogo {
  return {
    geradoEm: new Date(l.catalogo_info[0]?.gerado_em).toISOString(),
    imoveis: [...l.imoveis].sort(porOrdem).map((i): Imovel => ({ id: i.id, nome: i.nome, situacao: i.situacao })),
    comodos: [...l.comodos].sort(porOrdem).map((c): ComodoTipo => ({
      ordem: c.ordem,
      id: c.id,
      nome: c.nome,
      sensorSugerido: c.sensor_sugerido,
      sugestao: Object.fromEntries(ITENS.map((i) => [i, c[`sugestao_${i}`]])) as Record<ItemId, number>,
    })),
    itens: [...l.itens].sort(porOrdem).map((i): Item => ({
      ordem: i.ordem,
      id: i.id,
      botao: i.botao,
      pergunta: i.pergunta,
      ajuda: i.ajuda,
      tipoPadrao: i.tipo_padrao ?? '(pelo cômodo)', // no banco, nulo = o tipo vem do cômodo
      outrosTipos: i.outros_tipos,
    })),
    tipos: [...l.tipos_aparelho].sort(porOrdem).map((t): TipoAparelho => ({
      id: t.id,
      item: t.item,
      nome: t.nome,
      paraQue: t.para_que,
      neutro: t.neutro,
      central: t.central,
      alimentacao: t.alimentacao,
      cuidados: t.cuidados,
      passos: t.passos,
    })),
    produtos: [...l.produtos].sort(porId).map((p): Produto => ({
      id: p.id,
      item: p.item,
      tipo: p.tipo,
      marca: p.marca,
      modelo: p.modelo,
      nome: p.nome,
      app: p.app,
      alexa: p.alexa,
      google: p.google,
      protocolo: p.protocolo,
      neutro: p.neutro,
      tensao: p.tensao,
      correnteMax: numeroOuTexto(p.corrente_max),
      potenciaMax: numeroOuTexto(p.potencia_max),
      teclas: numeroOuTexto(p.teclas),
      alimentacao: p.alimentacao,
      anatel: p.anatel,
      inmetro: p.inmetro,
      fabricadoBrasil: p.fabricado_brasil,
      garantiaMeses: p.garantia_meses,
      preco: p.preco === null ? null : Number(p.preco),
      link: p.link,
      fonte: p.fonte,
      status: p.status,
      verificadoEm: p.verificado_em,
      observacoes: p.observacoes,
      fotoUrl: p.foto_url,
      fotoFonte: p.foto_fonte,
    })),
    regras: [...l.regras_eletricas].sort(porId).map((r): Regra => ({
      id: r.id,
      quando: r.quando,
      acao: r.acao,
      mensagem: r.mensagem,
      servico: r.servico,
      base: r.base,
    })),
    servicos: [...l.servicos].sort(porId).map((s): ServicoCatalogo => ({
      id: s.id,
      servico: s.nome,
      unidade: s.unidade,
      valor: s.valor_referencia === null ? null : Number(s.valor_referencia),
    })),
  };
}

const LISTAS = ['imoveis', 'comodos', 'itens', 'tipos', 'produtos', 'regras', 'servicos'] as const;

/** A cópia tem todas as listas preenchidas e uma data válida? (Protege contra download pela metade.) */
export function catalogoValido(c: unknown): c is Catalogo {
  if (!c || typeof c !== 'object') return false;
  const cat = c as Record<string, unknown>;
  if (typeof cat.geradoEm !== 'string' || Number.isNaN(Date.parse(cat.geradoEm))) return false;
  return LISTAS.every((k) => Array.isArray(cat[k]) && (cat[k] as unknown[]).length > 0);
}

/** Fica com a cópia de data mais nova. Empate ou cópia ausente: fica com a do app. */
export function maisNovo(doApp: Catalogo, outro: Catalogo | null): Catalogo {
  if (!outro) return doApp;
  return Date.parse(outro.geradoEm) > Date.parse(doApp.geradoEm) ? outro : doApp;
}
