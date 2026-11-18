// Passo 4 — perguntas da instalação. Cada pergunta só aparece quando importa.
import type { NomeIlustracao } from '@/dados/ilustracoes';
import { totalItem, type Projeto, type Respostas } from '@/estado/projeto';

export interface Opcao {
  valor: string;
  texto: string;
  detalhe?: string;
}

export interface Pergunta {
  chave: keyof Respostas;
  ilustracao: NomeIlustracao;
  titulo: string;
  ajuda: string;
  opcoes: Opcao[];
  /** Pergunta "Não / Sim, quantas?" que guarda um número. */
  contador?: boolean;
  aparece: (p: Projeto) => boolean;
}

const SIM_NAO_NAOSEI: Opcao[] = [
  { valor: 'sim', texto: 'Sim' },
  { valor: 'nao', texto: 'Não' },
  { valor: 'nao_sei', texto: 'Não sei' },
];

/** O projeto vai precisar de disjuntor novo? (ar novo, motor de portão novo, tomada forte) */
export function precisaCircuitoNovo(p: Projeto): boolean {
  const r = p.respostas;
  return (
    (totalItem(p, 'ar_condicionado') > 0 && r.arInstalado === 'nao') ||
    (totalItem(p, 'portao') > 0 && r.portaoTemMotor === 'nao') ||
    (totalItem(p, 'tomada') > 0 && (r.tomadasFortes ?? 0) > 0)
  );
}

export const PERGUNTAS: Pergunta[] = [
  {
    chave: 'tensao',
    ilustracao: 'q_tensao',
    titulo: 'Qual a tensão da casa?',
    ajuda: 'O app só mostra aparelhos que funcionam nessa tensão.',
    opcoes: [
      { valor: '127', texto: '127 V (110)' },
      { valor: '220', texto: '220 V' },
      { valor: 'ambas', texto: 'Tem as duas' },
    ],
    aparece: () => true,
  },
  {
    chave: 'neutro',
    ilustracao: 'q_neutro',
    titulo: 'Tem fio neutro nas caixas dos interruptores?',
    ajuda: 'A maioria dos interruptores inteligentes precisa do neutro na caixa 4x2.',
    opcoes: SIM_NAO_NAOSEI,
    aparece: (p) => totalItem(p, 'luz') > 0,
  },
  {
    chave: 'wifi',
    ilustracao: 'q_wifi',
    titulo: 'O Wi-Fi chega em todos os cômodos?',
    ajuda: 'Os aparelhos usam Wi-Fi de 2,4 GHz. Teste com o celular em cada cômodo.',
    opcoes: SIM_NAO_NAOSEI,
    aparece: () => true,
  },
  {
    chave: 'assistente',
    ilustracao: 'q_assistente',
    titulo: 'Qual assistente de voz o cliente usa?',
    ajuda: 'É por ele que o cliente vai controlar tudo num app só, mesmo com marcas diferentes.',
    opcoes: [
      { valor: 'alexa', texto: 'Alexa' },
      { valor: 'google', texto: 'Google' },
      { valor: 'nenhum', texto: 'Nenhum ainda', detalhe: 'O app inclui um na lista' },
    ],
    aparece: () => true,
  },
  {
    chave: 'tomadasFortes',
    ilustracao: 'q_forno',
    titulo: 'Alguma tomada vai ligar aparelho forte?',
    ajuda: 'Forno, aquecedor, ar portátil. Acima de 10 A precisa de circuito exclusivo.',
    opcoes: [
      { valor: 'nao', texto: 'Não' },
      { valor: 'sim', texto: 'Sim' },
    ],
    contador: true,
    aparece: (p) => totalItem(p, 'tomada') > 0,
  },
  {
    chave: 'arInstalado',
    ilustracao: 'item_ar_condicionado',
    titulo: 'Os ar-condicionados já estão instalados?',
    ajuda: 'Ar novo precisa de circuito e disjuntor próprios.',
    opcoes: [
      { valor: 'sim', texto: 'Sim, só automatizar' },
      { valor: 'nao', texto: 'Não, vou instalar' },
    ],
    aparece: (p) => totalItem(p, 'ar_condicionado') > 0,
  },
  {
    chave: 'portaoTemMotor',
    ilustracao: 'item_portao',
    titulo: 'O portão já tem motor?',
    ajuda: 'Se já tem, basta um módulo Wi-Fi. Motor novo precisa de circuito exclusivo.',
    opcoes: [
      { valor: 'sim', texto: 'Sim, só colocar Wi-Fi' },
      { valor: 'nao', texto: 'Não, motor novo' },
    ],
    aparece: (p) => totalItem(p, 'portao') > 0,
  },
  {
    chave: 'quadroEspaco',
    ilustracao: 'q_quadro',
    titulo: 'Tem espaço livre no quadro de disjuntores?',
    ajuda: 'Este projeto precisa de disjuntor novo.',
    opcoes: SIM_NAO_NAOSEI,
    aparece: precisaCircuitoNovo,
  },
];

export function perguntasDoProjeto(p: Projeto): Pergunta[] {
  return PERGUNTAS.filter((q) => q.aparece(p));
}

export function respondida(p: Projeto, q: Pergunta): boolean {
  return p.respostas[q.chave] !== undefined;
}

/** Valor que a opção representa no estado (a pergunta-contador guarda número). */
export function valorDaOpcao(q: Pergunta, opcao: Opcao, atual: Respostas[keyof Respostas]): string | number {
  if (!q.contador) return opcao.valor;
  if (opcao.valor === 'nao') return 0;
  return typeof atual === 'number' && atual > 0 ? atual : 1;
}

export function opcaoSelecionada(q: Pergunta, atual: Respostas[keyof Respostas]): string | undefined {
  if (atual === undefined) return undefined;
  if (!q.contador) return String(atual);
  return atual === 0 ? 'nao' : 'sim';
}
