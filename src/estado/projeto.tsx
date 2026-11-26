// Estado do app: o projeto em andamento e o perfil do eletricista.
// Sem banco de dados por enquanto: tudo fica salvo só neste aparelho (AsyncStorage,
// que no navegador usa o localStorage). Login e nuvem ficam para a versão 2.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';

import { catalogo, comodoTipo, type ItemId } from '@/dados/catalogo';
import { baixarCatalogo, carregarCatalogoGuardado } from '@/dados/sincronizarCatalogo';

/** Sugestões de itens por cômodo (aba Cômodos): decidido deixar para depois (18/11/2026). */
export const USAR_SUGESTOES = false;

export type SimNao = 'sim' | 'nao' | 'nao_sei';

export interface Respostas {
  tensao?: '127' | '220' | 'ambas';
  neutro?: SimNao;
  wifi?: SimNao;
  assistente?: 'alexa' | 'google' | 'nenhum';
  /** Quantas tomadas vão ligar aparelho forte (acima de 10 A). 0 = nenhuma. */
  tomadasFortes?: number;
  arInstalado?: 'sim' | 'nao';
  portaoTemMotor?: 'sim' | 'nao';
  quadroEspaco?: SimNao;
}

export interface Comodo {
  /** Ex.: "quarto-2" */
  uid: string;
  tipo: string;
  numero: number;
  itens: Partial<Record<ItemId, number>>;
}

export interface Projeto {
  id: string;
  criadoEm: number;
  imovel: string | null;
  /** Quantos cômodos de cada tipo. Ex.: { quarto: 3 } */
  contagem: Record<string, number>;
  comodos: Comodo[];
  respostas: Respostas;
  /** Produto escolhido pelo eletricista no botão "Trocar", por linha da lista. */
  trocas: Record<string, string>;
  quemCompra: 'cliente' | 'eletricista';
  /** Preço unitário de cada produto, quando o eletricista compra. */
  precos: Record<string, number>;
  cliente: { nome: string; telefone: string };
  /** Para o botão "Continuar o projeto anterior". */
  ultimaTela: string;
}

export interface Perfil {
  nome: string;
  telefone: string;
  /** Valor padrão de cada serviço de mão de obra (lembrado entre projetos). */
  valores: Record<string, number>;
}

interface Estado {
  carregado: boolean;
  projeto: Projeto | null;
  perfil: Perfil;
}

type Acao =
  | { tipo: 'carregar'; dados: Partial<Pick<Estado, 'projeto' | 'perfil'>> }
  | { tipo: 'novoProjeto' }
  | { tipo: 'imovel'; imovel: string }
  | { tipo: 'contagemComodo'; comodo: string; quantidade: number }
  | { tipo: 'itemComodo'; uid: string; item: ItemId; quantidade: number }
  | { tipo: 'copiarItens'; uid: string }
  | { tipo: 'responder'; chave: keyof Respostas; valor: string | number }
  | { tipo: 'trocar'; chave: string; produtoId: string }
  | { tipo: 'quemCompra'; valor: Projeto['quemCompra'] }
  | { tipo: 'preco'; produtoId: string; valor: number | null }
  | { tipo: 'cliente'; campo: 'nome' | 'telefone'; valor: string }
  | { tipo: 'perfil'; campo: 'nome' | 'telefone'; valor: string }
  | { tipo: 'valorServico'; servico: string; valor: number | null }
  | { tipo: 'ultimaTela'; tela: string };

const CHAVE_ARMAZENAMENTO = 'ajuda-automacao:v1';

const PERFIL_VAZIO: Perfil = { nome: '', telefone: '', valores: {} };

function criarProjeto(): Projeto {
  return {
    id: String(Date.now()),
    criadoEm: Date.now(),
    imovel: null,
    contagem: {},
    comodos: [],
    respostas: {},
    trocas: {},
    quemCompra: 'cliente',
    precos: {},
    cliente: { nome: '', telefone: '' },
    ultimaTela: '/projeto/imovel',
  };
}

/** Recria a lista de cômodos a partir da contagem, mantendo o que já foi preenchido. */
function sincronizarComodos(atuais: Comodo[], contagem: Record<string, number>): Comodo[] {
  const resultado: Comodo[] = [];
  for (const tipo of catalogo.comodos) {
    const quantidade = contagem[tipo.id] ?? 0;
    for (let numero = 1; numero <= quantidade; numero++) {
      const uid = `${tipo.id}-${numero}`;
      const existente = atuais.find((c) => c.uid === uid);
      resultado.push(
        existente ?? { uid, tipo: tipo.id, numero, itens: USAR_SUGESTOES ? { ...tipo.sugestao } : {} },
      );
    }
  }
  return resultado;
}

function semChave<T>(registro: Record<string, T>, chave: string): Record<string, T> {
  const copia = { ...registro };
  delete copia[chave];
  return copia;
}

function noProjeto(estado: Estado, mudar: (p: Projeto) => Projeto): Estado {
  return estado.projeto ? { ...estado, projeto: mudar(estado.projeto) } : estado;
}

function redutor(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case 'carregar':
      return {
        carregado: true,
        projeto: acao.dados.projeto ?? null,
        perfil: { ...PERFIL_VAZIO, ...acao.dados.perfil, valores: { ...acao.dados.perfil?.valores } },
      };
    case 'novoProjeto':
      return { ...estado, projeto: criarProjeto() };
    case 'imovel':
      return noProjeto(estado, (p) => ({ ...p, imovel: acao.imovel }));
    case 'contagemComodo':
      return noProjeto(estado, (p) => {
        const contagem = { ...p.contagem, [acao.comodo]: Math.max(0, acao.quantidade) };
        return { ...p, contagem, comodos: sincronizarComodos(p.comodos, contagem) };
      });
    case 'itemComodo':
      return noProjeto(estado, (p) => ({
        ...p,
        comodos: p.comodos.map((c) =>
          c.uid === acao.uid ? { ...c, itens: { ...c.itens, [acao.item]: Math.max(0, acao.quantidade) } } : c,
        ),
      }));
    case 'copiarItens':
      return noProjeto(estado, (p) => {
        const origem = p.comodos.find((c) => c.uid === acao.uid);
        if (!origem) return p;
        return {
          ...p,
          comodos: p.comodos.map((c) =>
            c.tipo === origem.tipo && c.uid !== origem.uid ? { ...c, itens: { ...origem.itens } } : c,
          ),
        };
      });
    case 'responder':
      return noProjeto(estado, (p) => ({ ...p, respostas: { ...p.respostas, [acao.chave]: acao.valor } }));
    case 'trocar':
      return noProjeto(estado, (p) => ({ ...p, trocas: { ...p.trocas, [acao.chave]: acao.produtoId } }));
    case 'quemCompra':
      return noProjeto(estado, (p) => ({ ...p, quemCompra: acao.valor }));
    case 'preco':
      return noProjeto(estado, (p) => ({
        ...p,
        precos: acao.valor === null ? semChave(p.precos, acao.produtoId) : { ...p.precos, [acao.produtoId]: acao.valor },
      }));
    case 'cliente':
      return noProjeto(estado, (p) => ({ ...p, cliente: { ...p.cliente, [acao.campo]: acao.valor } }));
    case 'perfil':
      return { ...estado, perfil: { ...estado.perfil, [acao.campo]: acao.valor } };
    case 'valorServico':
      return {
        ...estado,
        perfil: {
          ...estado.perfil,
          valores:
            acao.valor === null
              ? semChave(estado.perfil.valores, acao.servico)
              : { ...estado.perfil.valores, [acao.servico]: acao.valor },
        },
      };
    case 'ultimaTela':
      if (!estado.projeto || estado.projeto.ultimaTela === acao.tela) return estado;
      return noProjeto(estado, (p) => ({ ...p, ultimaTela: acao.tela }));
  }
}

const Contexto = createContext<{ estado: Estado; dispatch: Dispatch<Acao> } | null>(null);

export function ProvedorProjeto({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(redutor, { carregado: false, projeto: null, perfil: PERFIL_VAZIO });

  useEffect(() => {
    // Primeiro o catálogo guardado (só leitura no aparelho, sem esperar internet);
    // depois de abrir, baixa o do banco em segundo plano para a próxima vez.
    carregarCatalogoGuardado()
      .then(() => AsyncStorage.getItem(CHAVE_ARMAZENAMENTO))
      .then((texto) => {
        let dados = {};
        try {
          dados = texto ? JSON.parse(texto) : {};
        } catch {
          dados = {};
        }
        dispatch({ tipo: 'carregar', dados });
      })
      .catch(() => dispatch({ tipo: 'carregar', dados: {} }))
      .finally(() => baixarCatalogo());
  }, []);

  useEffect(() => {
    if (!estado.carregado) return;
    const { projeto, perfil } = estado;
    AsyncStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ projeto, perfil })).catch(() => {});
  }, [estado]);

  return <Contexto.Provider value={{ estado, dispatch }}>{children}</Contexto.Provider>;
}

export function useApp() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useApp precisa estar dentro do ProvedorProjeto');
  return valor;
}

// ---------------------------------------------------------------- Ajudantes

export function nomeComodo(p: Projeto, c: Comodo): string {
  const base = comodoTipo(c.tipo)?.nome ?? c.tipo;
  return (p.contagem[c.tipo] ?? 0) > 1 ? `${base} ${c.numero}` : base;
}

export function totalItem(p: Projeto, item: ItemId): number {
  return p.comodos.reduce((soma, c) => soma + (c.itens[item] ?? 0), 0);
}

export function totalItensComodo(c: Comodo): number {
  return Object.values(c.itens).reduce<number>((soma, n) => soma + (n ?? 0), 0);
}

export function totalComodos(p: Projeto): number {
  return Object.values(p.contagem).reduce((soma, n) => soma + n, 0);
}

/** Guarda a tela atual para o botão "Continuar o projeto anterior". */
export function useMarcarTela(tela: string) {
  const { estado, dispatch } = useApp();
  const temProjeto = estado.projeto !== null;
  useEffect(() => {
    if (temProjeto) dispatch({ tipo: 'ultimaTela', tela });
  }, [tela, temProjeto, dispatch]);
}
