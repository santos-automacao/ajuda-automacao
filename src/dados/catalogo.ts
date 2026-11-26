// Tipos e acesso ao catálogo. Os dados vêm de catalogo.json, gerado da planilha
// catalogo/catalogo-casa.xlsx pelo comando: npm run dados
import dados from './catalogo.json';

export type ItemId =
  | 'luz'
  | 'tomada'
  | 'cortina'
  | 'ar_condicionado'
  | 'tv'
  | 'portao'
  | 'fechadura'
  | 'camera'
  | 'sensor';

export interface Imovel {
  id: string;
  nome: string;
  situacao: string;
}

export interface ComodoTipo {
  ordem: number;
  id: string;
  nome: string;
  sensorSugerido: string | null;
  sugestao: Record<ItemId, number>;
}

export interface Item {
  ordem: number;
  id: ItemId;
  botao: string;
  pergunta: string;
  ajuda: string;
  tipoPadrao: string;
  outrosTipos: string[];
}

export interface TipoAparelho {
  id: string;
  item: string;
  nome: string;
  paraQue: string;
  neutro: string;
  central: string;
  alimentacao: string;
  cuidados: string;
  passos: string;
}

export interface Produto {
  id: string;
  item: string;
  tipo: string;
  marca: string;
  modelo: string | null;
  nome: string;
  app: string | null;
  alexa: string | null;
  google: string | null;
  protocolo: string | null;
  neutro: string | null;
  tensao: string | null;
  correnteMax: number | string | null;
  potenciaMax: number | string | null;
  teclas: number | string | null;
  alimentacao: string | null;
  anatel: string | null;
  inmetro: string | null;
  fabricadoBrasil: string | null;
  garantiaMeses: number | null;
  preco: number | null;
  link: string | null;
  fonte: string | null;
  status: string;
  verificadoEm: string | null;
  observacoes: string | null;
  /** Foto oficial do produto (fabricante ou loja afiliada). */
  fotoUrl: string | null;
  fotoFonte: string | null;
}

export interface Regra {
  id: string;
  quando: string;
  acao: string;
  mensagem: string;
  servico: string;
  base: string;
}

export interface ServicoCatalogo {
  /** Código do serviço (S01, S02...). */
  id: string;
  servico: string;
  unidade: string;
  valor: number | null;
}

export interface Catalogo {
  geradoEm: string;
  imoveis: Imovel[];
  comodos: ComodoTipo[];
  itens: Item[];
  tipos: TipoAparelho[];
  produtos: Produto[];
  regras: Regra[];
  servicos: ServicoCatalogo[];
}

/** O catálogo que vai dentro do app (reserva para quando não há internet). Nunca muda. */
export const CATALOGO_DO_APP = dados as unknown as Catalogo;

/** O catálogo em uso. Começa igual ao do app; ao abrir, pode virar a cópia baixada do banco
 *  (ver sincronizarCatalogo.ts). As telas importam este objeto, então ele é trocado no lugar. */
export const catalogo: Catalogo = { ...CATALOGO_DO_APP };

export const ITENS: ItemId[] = catalogo.itens.map((i) => i.id);

/** Passa a usar outro catálogo. Chamar só antes de mostrar as telas (ao abrir o app). */
export function usarCatalogo(novo: Catalogo) {
  Object.assign(catalogo, novo);
  ITENS.splice(0, ITENS.length, ...novo.itens.map((i) => i.id));
}

export const comodoTipo = (id: string) => catalogo.comodos.find((c) => c.id === id);
export const itemPorId = (id: ItemId) => catalogo.itens.find((i) => i.id === id);
export const tipoPorId = (id: string) => catalogo.tipos.find((t) => t.id === id);

/** O valor foi preenchido de verdade? ("Verificar" na planilha conta como não preenchido.) */
export const informado = (valor: unknown) =>
  valor !== null && valor !== undefined && valor !== '' && !String(valor).startsWith('Verificar');

/** "Intelbras EWS 1003" — sem mostrar campos ainda a verificar. */
export function marcaModelo(p: Produto): string {
  return [p.marca, p.modelo].filter(informado).join(' ');
}

/** Tipos de aparelho que atendem um item: o padrão primeiro, depois as alternativas. */
export function tiposDoItem(id: ItemId): string[] {
  const item = itemPorId(id);
  if (!item) return [];
  return [item.tipoPadrao, ...item.outrosTipos].filter((t) => tipoPorId(t));
}
