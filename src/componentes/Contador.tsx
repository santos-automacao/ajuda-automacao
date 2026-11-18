// O padrão de linha usado no app inteiro:  [desenho]  Nome      [ − ]  2  [ + ]
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { NomeIlustracao } from '@/dados/ilustracoes';
import { cores, fonte, LARGURA_DUAS_COLUNAS, sombra } from '@/tema';

import { Ilustracao } from './Ilustracao';

interface ContadorProps {
  valor: number;
  onMudar: (valor: number) => void;
  rotulo: string;
  minimo?: number;
  maximo?: number;
}

export function Contador({ valor, onMudar, rotulo, minimo = 0, maximo = 50 }: ContadorProps) {
  const { width } = useWindowDimensions();
  const tamanho = width < 400 ? 52 : 56;
  return (
    <View style={s.contador}>
      <BotaoRedondo
        simbolo="−"
        tamanho={tamanho}
        rotulo={`Diminuir ${rotulo}`}
        desabilitado={valor <= minimo}
        onPress={() => onMudar(Math.max(minimo, valor - 1))}
      />
      <Text style={s.valor} accessibilityLabel={`${rotulo}: ${valor}`} accessibilityLiveRegion="polite">
        {valor}
      </Text>
      <BotaoRedondo
        simbolo="+"
        tamanho={tamanho}
        principal
        rotulo={`Aumentar ${rotulo}`}
        desabilitado={valor >= maximo}
        onPress={() => onMudar(Math.min(maximo, valor + 1))}
      />
    </View>
  );
}

function BotaoRedondo(props: {
  simbolo: string;
  tamanho: number;
  rotulo: string;
  desabilitado: boolean;
  principal?: boolean;
  onPress: () => void;
}) {
  const { simbolo, tamanho, rotulo, desabilitado, principal, onPress } = props;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        s.redondo,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
        principal ? s.redondoPrincipal : s.redondoSecundario,
        pressed && (principal ? s.redondoPrincipalPressionado : s.redondoSecundarioPressionado),
        desabilitado && s.redondoDesabilitado,
      ]}>
      <Text style={[s.simbolo, { color: principal && !desabilitado ? '#FFFFFF' : desabilitado ? cores.desabilitado : cores.primaria }]}>
        {simbolo}
      </Text>
    </Pressable>
  );
}

interface LinhaProps {
  ilustracao: NomeIlustracao;
  nome: string;
  detalhe?: string;
  valor: number;
  onMudar: (valor: number) => void;
}

export function LinhaContador({ ilustracao, nome, detalhe, valor, onMudar }: LinhaProps) {
  const { width } = useWindowDimensions();
  const estreito = width < 400;
  // Celular e notebook em duas colunas: o cartão é estreito, então o − / + desce
  // para baixo do nome (assim "Ar-condicionado" não quebra no meio).
  const empilhado = width < 600 || width >= LARGURA_DUAS_COLUNAS;
  const contador = <Contador valor={valor} onMudar={onMudar} rotulo={nome} />;
  return (
    <View style={[s.linha, empilhado && s.linhaEmpilhada, valor > 0 && s.linhaAtiva]}>
      <Ilustracao nome={ilustracao} tamanho={estreito ? 56 : 64} />
      <View style={s.textos}>
        <Text style={[s.nome, estreito && s.nomeEstreito]}>{nome}</Text>
        {detalhe ? <Text style={s.detalhe}>{detalhe}</Text> : null}
        {empilhado ? <View style={s.contadorEmbaixo}>{contador}</View> : null}
      </View>
      {empilhado ? null : contador}
    </View>
  );
}

const s = StyleSheet.create({
  contador: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valor: { minWidth: 40, textAlign: 'center', fontSize: 26, fontWeight: '800', color: cores.texto },
  redondo: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  redondoPrincipal: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  redondoPrincipalPressionado: { backgroundColor: cores.primariaPressionada },
  redondoSecundario: { backgroundColor: cores.cartao, borderColor: cores.primaria },
  redondoSecundarioPressionado: { backgroundColor: cores.primariaClara },
  redondoDesabilitado: { backgroundColor: cores.fundo, borderColor: cores.borda },
  simbolo: { fontSize: 30, fontWeight: '700', lineHeight: 34 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: cores.borda,
    padding: 12,
    flexGrow: 1,
    ...sombra,
  },
  linhaEmpilhada: { alignItems: 'flex-start' },
  contadorEmbaixo: { alignSelf: 'flex-end', marginTop: 8 },
  linhaAtiva: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  textos: { flex: 1, minWidth: 0 },
  nome: { fontSize: 20, fontWeight: '800', color: cores.texto },
  nomeEstreito: { fontSize: 18 },
  detalhe: { fontSize: fonte.pequeno, color: cores.textoSuave, marginTop: 2 },
});
