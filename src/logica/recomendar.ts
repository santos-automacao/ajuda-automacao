// Motor de recomendação: transforma o levantamento em lista de equipamentos,
// serviços (mão de obra + adicionais) e alertas elétricos.
// As regras seguem a aba "Regras elétricas" da planilha (R01 a R17).
import {
  catalogo,
  comodoTipo,
  tipoPorId,
  tiposDoItem,
  type ItemId,
  type Produto,
} from '@/dados/catalogo';
import type { NomeIlustracao } from '@/dados/ilustracoes';
import { nomeComodo, totalItem, type Projeto } from '@/estado/projeto';

export interface Linha {
  /** Identifica a linha para o botão "Trocar". Ex.: "quarto-1:luz:2" */
  chave: string;
  itemId: ItemId | 'casa';
  tipoId: string;
  titulo: string;
  descricao?: string;
  quantidade: number;
  produto: Produto | null;
  alternativas: Produto[];
  nota?: string;
  ilustracao: NomeIlustracao;
}

export interface Grupo {
  chave: string;
  titulo: string;
  ilustracao: NomeIlustracao;
  linhas: Linha[];
}

export interface LinhaServico {
  servico: string;
  unidade: string;
  quantidade: number;
  /** true = serviço gerado por regra elétrica (circuito, DR, neutro...) */
  adicional: boolean;
  motivos: string[];
}

export interface Alerta {
  regra: string;
  nivel: 'atencao' | 'info';
  mensagem: string;
}

export interface Recomendacao {
  grupos: Grupo[];
  servicos: LinhaServico[];
  alertas: Alerta[];
}

/** Cômodos onde circuito novo precisa de DR (NBR 5410). */
const AREAS_COM_DR = new Set(['banheiro', 'cozinha', 'area_servico', 'area_externa']);
/** Cômodos onde a câmera é externa (com detecção de pessoas). */
const AREAS_CAMERA_EXTERNA = new Set(['area_externa', 'garagem', 'entrada', 'varanda']);
/** R12: acima disso, sugerir Zigbee. Ajustar com testes reais. */
const LIMITE_APARELHOS_WIFI = 20;
/** Interruptores têm no máximo 4 teclas. */
const MAX_TECLAS = 4;

// Nomes iguais aos da aba "Mão de obra" da planilha.
const SERVICO = {
  interruptor: 'Instalar interruptor inteligente',
  modulo: 'Instalar módulo relé',
  tomada: 'Instalar tomada inteligente',
  plugue: 'Configurar plugue ou lâmpada inteligente',
  cortina: 'Instalar motor de cortina com trilho',
  infravermelho: 'Instalar controle infravermelho e cadastrar aparelhos',
  moduloPortao: 'Instalar módulo Wi-Fi no portão',
  motorPortao: 'Instalar motor de portão',
  fechadura: 'Instalar fechadura digital',
  camera: 'Instalar câmera',
  sensor: 'Instalar sensor',
  central: 'Instalar central Zigbee',
  configurar: 'Configurar app, cenas e Alexa/Google',
  neutro: 'Passar neutro até a caixa',
  circuito: 'Circuito exclusivo com disjuntor',
  dr: 'Instalar dispositivo DR',
  quadro: 'Troca/ampliação do quadro',
  repetidor: 'Instalar repetidor ou roteador mesh',
} as const;

const SERVICO_DO_TIPO: Record<string, string> = {
  INT_TOUCH: SERVICO.interruptor,
  DIMMER: SERVICO.interruptor,
  MOD_RELE: SERVICO.modulo,
  LAMPADA: SERVICO.plugue,
  TOMADA_EMBUTIR: SERVICO.tomada,
  PLUGUE: SERVICO.plugue,
  CORTINA_MOTOR: SERVICO.cortina,
  CORTINA_CONTROLADOR: SERVICO.cortina,
  IR_UNIVERSAL: SERVICO.infravermelho,
  PORTAO_MODULO: SERVICO.moduloPortao,
  PORTAO_MOTOR: SERVICO.motorPortao,
  FECHADURA: SERVICO.fechadura,
  CAMERA_INTERNA: SERVICO.camera,
  CAMERA_EXTERNA_IA: SERVICO.camera,
  SENSOR_PRESENCA: SERVICO.sensor,
  SENSOR_ABERTURA: SERVICO.sensor,
  SENSOR_VAZAMENTO: SERVICO.sensor,
  SENSOR_GAS: SERVICO.sensor,
  SENSOR_FUMACA: SERVICO.sensor,
  CENTRAL_ZIGBEE: SERVICO.central,
};

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

/** R01: o produto funciona na tensão da casa? (bivolt e "a verificar" passam) */
function aceitaTensao(p: Produto, tensao?: string): boolean {
  if (!tensao || tensao === 'ambas') return true;
  const t = (p.tensao ?? '').toLowerCase();
  if (!t || t === '—' || t.includes('verificar') || t.includes('bivolt') || t.includes('100') || t.includes(' ou ')) {
    return true;
  }
  const tem127 = t.includes('127') || t.includes('110');
  const tem220 = t.includes('220');
  return tensao === '220' ? tem220 || !tem127 : tem127 || !tem220;
}

/** Escolhe produtos e prefere repetir a marca já usada no projeto (menos apps para configurar). */
class Escolhedor {
  private marcas = new Map<string, number>();

  constructor(private projeto: Projeto) {}

  candidatos(tipoId: string, teclas?: number): Produto[] {
    const { tensao, assistente } = this.projeto.respostas;
    const pontos = (p: Produto) => {
      let s = 0;
      if (teclas !== undefined && Number(p.teclas) === teclas) s += 10;
      if ((this.marcas.get(p.marca) ?? 0) > 0) s += 3;
      if (p.status === 'Verificado') s += 2;
      const compativel = assistente === 'google' ? p.google : p.alexa;
      if (compativel?.startsWith('Sim')) s += 1;
      if (p.protocolo?.includes('Wi-Fi')) s += 0.5; // Wi-Fi dispensa central
      if (p.fabricadoBrasil?.startsWith('Sim')) s += 0.5;
      return s;
    };
    return catalogo.produtos
      .filter((p) => p.tipo === tipoId && p.status !== 'Inativo' && aceitaTensao(p, tensao))
      .sort((a, b) => pontos(b) - pontos(a));
  }

  usar(p: Produto | null) {
    if (p) this.marcas.set(p.marca, (this.marcas.get(p.marca) ?? 0) + 1);
  }
}

interface PedidoLinha {
  chave: string;
  itemId: ItemId | 'casa';
  tipos: string[];
  teclas?: number;
  quantidade: number;
  descricao?: string;
  ilustracao: NomeIlustracao;
}

function montarLinha(escolhedor: Escolhedor, projeto: Projeto, pedido: PedidoLinha): Linha {
  const { tipos, teclas } = pedido;
  const porTipo = tipos.map((t) => ({ tipo: t, candidatos: escolhedor.candidatos(t, teclas) }));
  const todos = porTipo.flatMap((t) => t.candidatos);
  const primeiroComProduto = porTipo.find((t) => t.candidatos.length > 0);

  const escolhidoPeloEletricista = todos.find((p) => p.id === projeto.trocas[pedido.chave]);
  const produto = escolhidoPeloEletricista ?? primeiroComProduto?.candidatos[0] ?? null;
  escolhedor.usar(produto);

  const tipoId = produto?.tipo ?? tipos[0];
  let nota: string | undefined;
  if (!produto) {
    nota = 'Nenhum produto cadastrado para este tipo. Cadastre na planilha do catálogo.';
  } else if (tipoId !== tipos[0]) {
    nota = `Sem "${tipoPorId(tipos[0])?.nome}" no catálogo: sugerindo ${tipoPorId(tipoId)?.nome?.toLowerCase()}.`;
  } else if (teclas !== undefined && Number(produto.teclas) !== teclas) {
    nota = `Confira: este modelo tem ${produto.teclas} ${plural(Number(produto.teclas), 'tecla', 'teclas')}.`;
  }

  return {
    chave: pedido.chave,
    itemId: pedido.itemId,
    tipoId,
    titulo: tipoPorId(tipoId)?.nome ?? tipoId,
    descricao: pedido.descricao,
    quantidade: pedido.quantidade,
    produto,
    alternativas: todos.filter((p) => p.id !== produto?.id),
    nota,
    ilustracao: pedido.ilustracao,
  };
}

export function recomendar(projeto: Projeto): Recomendacao {
  const r = projeto.respostas;
  const escolhedor = new Escolhedor(projeto);
  const grupos: Grupo[] = [];
  const servicos = new Map<string, LinhaServico>();
  const alertas: Alerta[] = [];

  const servico = (nome: string, quantidade: number, adicional = false, motivo?: string) => {
    if (quantidade <= 0) return;
    const unidade = catalogo.servicos.find((s) => s.servico === nome)?.unidade ?? '';
    const atual = servicos.get(nome) ?? { servico: nome, unidade, quantidade: 0, adicional, motivos: [] };
    atual.quantidade += quantidade;
    if (motivo && !atual.motivos.includes(motivo)) atual.motivos.push(motivo);
    servicos.set(nome, atual);
  };
  const alerta = (regra: string, nivel: Alerta['nivel'], mensagem: string) => alertas.push({ regra, nivel, mensagem });

  let interruptores = 0;
  let circuitosNovos = 0;
  const comodosQuePrecisamDeDR = new Set<string>();

  for (const comodo of projeto.comodos) {
    const nome = nomeComodo(projeto, comodo);
    const qtd = (i: ItemId) => comodo.itens[i] ?? 0;
    const linhas: Linha[] = [];
    const nova = (pedido: Omit<PedidoLinha, 'ilustracao'> & { ilustracao?: NomeIlustracao }) => {
      const linha = montarLinha(escolhedor, projeto, {
        ...pedido,
        ilustracao: pedido.ilustracao ?? (`item_${pedido.itemId}` as NomeIlustracao),
      });
      linhas.push(linha);
      return linha;
    };
    const precisaDR = () => {
      if (AREAS_COM_DR.has(comodo.tipo)) comodosQuePrecisamDeDR.add(nome);
    };

    // Luz: teclas divididas em interruptores de até 4 teclas (R15)
    const luz = qtd('luz');
    if (luz > 0) {
      const quantos = Math.ceil(luz / MAX_TECLAS);
      const porTamanho = new Map<number, number>();
      for (let i = 0; i < quantos; i++) {
        const tamanho = Math.floor(luz / quantos) + (i < luz % quantos ? 1 : 0);
        porTamanho.set(tamanho, (porTamanho.get(tamanho) ?? 0) + 1);
      }
      for (const [teclas, quantidade] of porTamanho) {
        const linha = nova({
          chave: `${comodo.uid}:luz:${teclas}`,
          itemId: 'luz',
          tipos: ['INT_TOUCH', 'MOD_RELE', 'DIMMER'],
          teclas,
          quantidade,
          descricao: `Interruptor de ${teclas} ${plural(teclas, 'tecla', 'teclas')}`,
        });
        servico(SERVICO_DO_TIPO[linha.tipoId] ?? SERVICO.interruptor, quantidade);
        interruptores += quantidade;
      }
      if (luz > MAX_TECLAS) {
        alerta('R15', 'info', `${nome}: ${luz} teclas divididas em ${quantos} interruptores. Ajuste se ficam em caixas diferentes.`);
      }
    }

    const tomadas = qtd('tomada');
    if (tomadas > 0) {
      const linha = nova({ chave: `${comodo.uid}:tomada`, itemId: 'tomada', tipos: tiposDoItem('tomada'), quantidade: tomadas });
      servico(SERVICO_DO_TIPO[linha.tipoId], tomadas);
    }

    const cortinas = qtd('cortina');
    if (cortinas > 0) {
      const linha = nova({ chave: `${comodo.uid}:cortina`, itemId: 'cortina', tipos: tiposDoItem('cortina'), quantidade: cortinas });
      servico(SERVICO_DO_TIPO[linha.tipoId], cortinas);
    }

    // Ar e TV: um controle infravermelho por cômodo atende os dois (R14)
    const ar = qtd('ar_condicionado');
    const tv = qtd('tv');
    if (ar + tv > 0) {
      const partes = [ar ? `${ar} ar` : '', tv ? `${tv} TV` : ''].filter(Boolean).join(' e ');
      nova({
        chave: `${comodo.uid}:infravermelho`,
        itemId: ar ? 'ar_condicionado' : 'tv',
        tipos: ['IR_UNIVERSAL'],
        quantidade: 1,
        descricao: `Comanda ${partes} deste cômodo`,
      });
      servico(SERVICO.infravermelho, 1);
      if (ar > 0 && r.arInstalado === 'nao') {
        servico(SERVICO.circuito, ar, true, `Ar-condicionado novo (${nome})`);
        circuitosNovos += ar;
        precisaDR();
      }
    }

    const portoes = qtd('portao');
    if (portoes > 0) {
      const temMotor = r.portaoTemMotor === 'sim';
      nova({
        chave: `${comodo.uid}:portao`,
        itemId: 'portao',
        tipos: temMotor ? ['PORTAO_MODULO'] : ['PORTAO_MOTOR'],
        quantidade: portoes,
        descricao: temMotor ? 'Para o motor que já existe' : 'Motor novo, já com Wi-Fi',
      });
      servico(temMotor ? SERVICO.moduloPortao : SERVICO.motorPortao, portoes);
      if (!temMotor) {
        servico(SERVICO.circuito, portoes, true, `Motor de portão novo (${nome})`);
        circuitosNovos += portoes;
        precisaDR();
      }
    }

    const fechaduras = qtd('fechadura');
    if (fechaduras > 0) {
      nova({ chave: `${comodo.uid}:fechadura`, itemId: 'fechadura', tipos: ['FECHADURA'], quantidade: fechaduras });
      servico(SERVICO.fechadura, fechaduras);
    }

    const cameras = qtd('camera');
    if (cameras > 0) {
      const externa = AREAS_CAMERA_EXTERNA.has(comodo.tipo);
      nova({
        chave: `${comodo.uid}:camera`,
        itemId: 'camera',
        tipos: externa ? ['CAMERA_EXTERNA_IA', 'CAMERA_INTERNA'] : ['CAMERA_INTERNA', 'CAMERA_EXTERNA_IA'],
        quantidade: cameras,
        descricao: externa ? 'Área externa: com detecção de pessoas' : 'Câmera interna',
      });
      servico(SERVICO.camera, cameras);
    }

    const sensores = qtd('sensor');
    if (sensores > 0) {
      const tipoSensor = comodoTipo(comodo.tipo)?.sensorSugerido || 'SENSOR_PRESENCA';
      nova({
        chave: `${comodo.uid}:sensor`,
        itemId: 'sensor',
        tipos: [tipoSensor],
        quantidade: sensores,
        descricao: tipoPorId(tipoSensor)?.nome,
      });
      servico(SERVICO.sensor, sensores);
    }

    if (linhas.length > 0) {
      grupos.push({ chave: comodo.uid, titulo: nome, ilustracao: `comodo_${comodo.tipo}` as NomeIlustracao, linhas });
    }
  }

  // ------------------------------------------------ Casa toda
  const casa: Linha[] = [];
  const todasAsLinhas = grupos.flatMap((g) => g.linhas);

  if (todasAsLinhas.some((l) => l.produto?.protocolo?.includes('Zigbee'))) {
    casa.push(
      montarLinha(escolhedor, projeto, {
        chave: 'casa:central',
        itemId: 'casa',
        tipos: ['CENTRAL_ZIGBEE'],
        quantidade: 1,
        descricao: 'Necessária para os aparelhos Zigbee',
        ilustracao: 'q_wifi',
      }),
    );
    servico(SERVICO.central, 1);
    alerta('R13', 'info', 'Há aparelhos Zigbee no projeto: foi incluída uma central.');
  }

  if (r.assistente === 'nenhum' && todasAsLinhas.length > 0) {
    casa.push({
      chave: 'casa:assistente',
      itemId: 'casa',
      tipoId: 'ASSISTENTE',
      titulo: 'Assistente de voz (Alexa ou Google)',
      descricao: 'Para o cliente controlar tudo num app só',
      quantidade: 1,
      produto: null,
      alternativas: [],
      nota: 'Escolha o modelo junto com o cliente.',
      ilustracao: 'q_assistente',
    });
  }

  if (casa.length > 0) grupos.push({ chave: 'casa', titulo: 'Casa toda', ilustracao: 'imovel_casa', linhas: casa });

  // ------------------------------------------------ Regras do projeto inteiro
  if (interruptores > 0) {
    if (r.neutro === 'nao') {
      servico(SERVICO.neutro, interruptores, true, 'A casa não tem neutro nas caixas');
      alerta('R02', 'atencao', `Os interruptores inteligentes precisam de neutro. Incluído "passar neutro" em ${interruptores} ${plural(interruptores, 'caixa', 'caixas')}.`);
    } else if (r.neutro === 'nao_sei') {
      alerta('R03', 'atencao', 'Confira se há neutro nas caixas dos interruptores antes de comprar.');
    }
    alerta('R17', 'info', 'Confira na obra se há interruptor paralelo (three-way): ele exige modelo compatível.');
  }

  const tomadasFortes = totalItem(projeto, 'tomada') > 0 ? (r.tomadasFortes ?? 0) : 0;
  if (tomadasFortes > 0) {
    servico(SERVICO.circuito, tomadasFortes, true, 'Tomada para aparelho forte (acima de 10 A)');
    circuitosNovos += tomadasFortes;
    alerta('R04', 'atencao', `${tomadasFortes} ${plural(tomadasFortes, 'tomada', 'tomadas')} para aparelho forte: tomada 20 A e circuito exclusivo com disjuntor (NBR 5410).`);
  }
  if (r.arInstalado === 'nao' && totalItem(projeto, 'ar_condicionado') > 0) {
    alerta('R05', 'atencao', 'Cada ar-condicionado novo precisa de circuito e disjuntor próprios (dimensione pelo manual do aparelho).');
  }
  if (r.portaoTemMotor === 'nao' && totalItem(projeto, 'portao') > 0) {
    alerta('R07', 'atencao', 'Motor de portão novo: circuito exclusivo e tensão do motor igual à da casa.');
  }
  if (comodosQuePrecisamDeDR.size > 0) {
    const lista = [...comodosQuePrecisamDeDR].join(', ');
    servico(SERVICO.dr, 1, true, `Circuito novo em área molhada ou externa: ${lista}`);
    alerta('R08', 'atencao', `Circuito novo em área molhada ou externa (${lista}) precisa de proteção DR.`);
  }
  if (circuitosNovos > 0) {
    const disjuntores = `${circuitosNovos} ${plural(circuitosNovos, 'disjuntor novo', 'disjuntores novos')}`;
    if (r.quadroEspaco === 'nao') {
      servico(SERVICO.quadro, 1, true, `Sem espaço no quadro para ${disjuntores}`);
      alerta('R09', 'atencao', `Não há espaço no quadro para ${disjuntores}: incluída a ampliação do quadro.`);
    } else if (r.quadroEspaco === 'nao_sei') {
      alerta('R10', 'atencao', `Confira se há espaço no quadro para ${disjuntores}.`);
    }
  }
  if (r.wifi === 'nao') {
    servico(SERVICO.repetidor, 1, true, 'O Wi-Fi não chega em todos os cômodos');
    alerta('R11', 'atencao', 'O Wi-Fi não chega em todos os cômodos: incluído repetidor ou roteador mesh.');
  } else if (r.wifi === 'nao_sei') {
    alerta('R11', 'info', 'Teste o sinal do Wi-Fi 2,4 GHz em cada cômodo antes de instalar.');
  }
  const aparelhosWifi = todasAsLinhas
    .filter((l) => l.produto?.protocolo?.includes('Wi-Fi'))
    .reduce((soma, l) => soma + l.quantidade, 0);
  if (aparelhosWifi > LIMITE_APARELHOS_WIFI) {
    alerta('R12', 'atencao', `${aparelhosWifi} aparelhos Wi-Fi: a rede pode ficar instável. Considere aparelhos Zigbee com central.`);
  }
  if (r.tensao) {
    alerta('R01', 'info', r.tensao === 'ambas'
      ? 'A casa tem 127 V e 220 V: confira a tensão de cada ponto antes de ligar.'
      : `Mostrando só aparelhos que funcionam em ${r.tensao} V.`);
  }
  if (todasAsLinhas.length > 0) servico(SERVICO.configurar, 1);

  return {
    grupos,
    servicos: [...servicos.values()].sort((a, b) => Number(a.adicional) - Number(b.adicional)),
    alertas: alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'atencao' ? -1 : 1)),
  };
}
