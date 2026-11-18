import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Aviso, Cartao } from '@/componentes/Blocos';
import { Botao } from '@/componentes/Botoes';
import { Ilustracao } from '@/componentes/Ilustracao';
import { Carregando, Tela } from '@/componentes/Tela';
import { totalComodos, useApp } from '@/estado/projeto';
import { irPara } from '@/logica/navegar';
import { cores, fonte } from '@/tema';

const COMO_FUNCIONA = [
  'Toque nos desenhos e use os botões − e +.',
  'O app avisa quando precisa de disjuntor, neutro ou DR.',
  'No fim, gere o PDF e mande pelo WhatsApp.',
];

export default function Inicio() {
  const { estado, dispatch } = useApp();
  const [confirmar, setConfirmar] = useState(false);

  if (!estado.carregado) return <Carregando />;

  const anterior = estado.projeto?.imovel ? estado.projeto : null;
  const comecar = () => {
    dispatch({ tipo: 'novoProjeto' });
    setConfirmar(false);
    irPara('/projeto/imovel');
  };
  const resumoAnterior = anterior
    ? [`${totalComodos(anterior)} cômodo(s)`, anterior.cliente.nome].filter(Boolean).join(' · ')
    : '';

  return (
    <Tela
      titulo="Ajuda Automação"
      subtitulo="Planeje a automação da casa do seu cliente em 6 passos e envie a proposta em PDF.">
      <Cartao estilo={s.destaque}>
        <Ilustracao nome="imovel_casa" tamanho={150} />
        <View style={s.lista}>
          {COMO_FUNCIONA.map((texto, i) => (
            <View key={texto} style={s.linha}>
              <View style={s.numero}>
                <Text style={s.numeroTexto}>{i + 1}</Text>
              </View>
              <Text style={s.texto}>{texto}</Text>
            </View>
          ))}
        </View>
      </Cartao>

      {!anterior ? <Botao texto="Começar novo projeto" onPress={comecar} /> : null}

      {anterior && !confirmar ? (
        <>
          <Botao
            texto="Continuar o projeto anterior"
            detalhe={resumoAnterior}
            onPress={() => irPara(anterior.ultimaTela)}
          />
          <Botao variante="secundario" texto="Começar um projeto novo" onPress={() => setConfirmar(true)} />
        </>
      ) : null}

      {anterior && confirmar ? (
        <Aviso titulo="Começar um projeto novo?" itens={['O projeto anterior será apagado deste aparelho.']}>
          <Botao texto="Sim, começar novo" onPress={comecar} />
          <Botao variante="secundario" texto="Não, voltar" onPress={() => setConfirmar(false)} />
        </Aviso>
      ) : null}

      <Text style={s.nota}>
        Protótipo para teste. Os produtos ainda estão em verificação. O projeto fica salvo só neste aparelho: nada
        é enviado para a internet.
      </Text>
    </Tela>
  );
}

const s = StyleSheet.create({
  destaque: { alignItems: 'center', paddingVertical: 24 },
  lista: { alignSelf: 'stretch', gap: 12, marginTop: 8 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numero: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  texto: { flex: 1, fontSize: fonte.texto, color: cores.texto, lineHeight: 25 },
  nota: { fontSize: fonte.pequeno, color: cores.textoSuave, textAlign: 'center', lineHeight: 21 },
});
