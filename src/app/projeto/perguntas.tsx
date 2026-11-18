// Passo 4 — perguntas da instalação, uma por tela. Ao tocar numa resposta, avança sozinho.
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Cartao } from '@/componentes/Blocos';
import { BotaoOpcao } from '@/componentes/Botoes';
import { Contador } from '@/componentes/Contador';
import { Ilustracao } from '@/componentes/Ilustracao';
import { Carregando, Tela } from '@/componentes/Tela';
import { useApp, useMarcarTela, type Respostas } from '@/estado/projeto';
import { irPara, voltarOu } from '@/logica/navegar';
import { opcaoSelecionada, perguntasDoProjeto, respondida, valorDaOpcao, type Opcao } from '@/logica/perguntas';
import { cores, fonte } from '@/tema';

export default function TelaPerguntas() {
  const { estado, dispatch } = useApp();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const avancando = useRef(false);
  const projeto = estado.projeto;
  const lista = projeto ? perguntasDoProjeto(projeto) : [];
  const indice = Math.min(Math.max(Number(q) || 0, 0), Math.max(lista.length - 1, 0));
  useMarcarTela(`/projeto/perguntas?q=${indice}`);

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;

  const pergunta = lista[indice];
  const atual = projeto.respostas[pergunta.chave];
  const selecionada = opcaoSelecionada(pergunta, atual);
  const ultimoComodo = Math.max(projeto.comodos.length - 1, 0);

  const avancar = (respostas: Respostas) => {
    const proximas = perguntasDoProjeto({ ...projeto, respostas });
    if (indice + 1 < proximas.length) router.setParams({ q: String(indice + 1) });
    else irPara('/projeto/lista');
  };

  const responder = (opcao: Opcao) => {
    if (avancando.current) return;
    const valor = valorDaOpcao(pergunta, opcao, atual);
    dispatch({ tipo: 'responder', chave: pergunta.chave, valor });
    if (pergunta.contador && opcao.valor === 'sim') return; // espera a quantidade
    avancando.current = true;
    const respostas = { ...projeto.respostas, [pergunta.chave]: valor };
    setTimeout(() => {
      avancando.current = false;
      avancar(respostas);
    }, 350);
  };

  return (
    <Tela
      passo={4}
      titulo={pergunta.titulo}
      subtitulo={`Pergunta ${indice + 1} de ${lista.length}`}
      chaveRolagem={indice}
      voltar={() =>
        indice > 0 ? router.setParams({ q: String(indice - 1) }) : voltarOu(`/projeto/itens?c=${ultimoComodo}`)
      }
      continuar={() => avancar(projeto.respostas)}
      podeContinuar={respondida(projeto, pergunta)}
      motivo="Escolha uma resposta.">
      <View style={s.topo}>
        <Ilustracao nome={pergunta.ilustracao} tamanho={130} />
        <Text style={s.ajuda}>{pergunta.ajuda}</Text>
      </View>
      <View style={s.opcoes} accessibilityRole="radiogroup">
        {pergunta.opcoes.map((opcao) => (
          <BotaoOpcao
            key={opcao.valor}
            texto={opcao.texto}
            detalhe={opcao.detalhe}
            selecionado={selecionada === opcao.valor}
            onPress={() => responder(opcao)}
          />
        ))}
      </View>
      {pergunta.contador && typeof atual === 'number' && atual > 0 ? (
        <Cartao estilo={s.quantas}>
          <Text style={s.quantasTexto}>Quantas tomadas?</Text>
          <Contador
            valor={atual}
            minimo={1}
            rotulo="tomadas para aparelho forte"
            onMudar={(valor) => dispatch({ tipo: 'responder', chave: pergunta.chave, valor })}
          />
        </Cartao>
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  topo: { alignItems: 'center', gap: 12 },
  ajuda: { fontSize: fonte.texto, color: cores.textoSuave, textAlign: 'center', lineHeight: 26, maxWidth: 560 },
  opcoes: { gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  quantas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', maxWidth: 560, alignSelf: 'center', width: '100%' },
  quantasTexto: { fontSize: 20, fontWeight: '800', color: cores.texto },
});
