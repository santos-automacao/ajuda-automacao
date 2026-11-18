import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { cores, fonte, TOQUE_MINIMO } from '@/tema';

type Variante = 'primario' | 'secundario' | 'whatsapp' | 'link';

const FUNDO: Record<Variante, string> = {
  primario: cores.primaria,
  secundario: cores.cartao,
  whatsapp: cores.whatsapp,
  link: 'transparent',
};
const FUNDO_PRESSIONADO: Record<Variante, string> = {
  primario: cores.primariaPressionada,
  secundario: cores.primariaClara,
  whatsapp: '#17803F',
  link: cores.primariaClara,
};
const COR_TEXTO: Record<Variante, string> = {
  primario: '#FFFFFF',
  secundario: cores.primaria,
  whatsapp: '#FFFFFF',
  link: cores.primaria,
};
const BORDA: Record<Variante, string> = {
  primario: cores.primaria,
  secundario: cores.primaria,
  whatsapp: cores.whatsapp,
  link: 'transparent',
};

interface BotaoProps {
  texto: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  detalhe?: string;
  estilo?: StyleProp<ViewStyle>;
  rotulo?: string;
  /** Letra e margem um pouco menores, para caber em celular estreito. */
  compacto?: boolean;
}

export function Botao({ texto, onPress, variante = 'primario', desabilitado, detalhe, estilo, rotulo, compacto }: BotaoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? texto}
      accessibilityState={{ disabled: !!desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        s.botao,
        { backgroundColor: pressed ? FUNDO_PRESSIONADO[variante] : FUNDO[variante], borderColor: BORDA[variante] },
        desabilitado && s.desabilitado,
        compacto && s.botaoCompacto,
        estilo,
      ]}>
      <Text style={[s.texto, compacto && s.textoCompacto, { color: desabilitado ? '#FFFFFF' : COR_TEXTO[variante] }]}>
        {texto}
      </Text>
      {detalhe ? <Text style={[s.detalhe, { color: COR_TEXTO[variante] }]}>{detalhe}</Text> : null}
    </Pressable>
  );
}

interface OpcaoProps {
  texto: string;
  detalhe?: string;
  selecionado: boolean;
  onPress: () => void;
  desabilitado?: boolean;
}

/** Opção grande de escolha única (respostas do passo 4, "quem compra" etc.). */
export function BotaoOpcao({ texto, detalhe, selecionado, onPress, desabilitado }: OpcaoProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={detalhe ? `${texto}. ${detalhe}` : texto}
      accessibilityState={{ checked: selecionado, disabled: !!desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        s.opcao,
        selecionado && s.opcaoSelecionada,
        pressed && !selecionado && s.opcaoPressionada,
        desabilitado && s.opcaoDesabilitada,
      ]}>
      <View style={[s.marca, selecionado && s.marcaSelecionada]}>
        {selecionado ? <Text style={s.check}>✓</Text> : null}
      </View>
      <View style={s.opcaoTextos}>
        <Text style={s.opcaoTexto}>{texto}</Text>
        {detalhe ? <Text style={s.opcaoDetalhe}>{detalhe}</Text> : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  botao: {
    minHeight: TOQUE_MINIMO,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desabilitado: { backgroundColor: cores.desabilitado, borderColor: cores.desabilitado },
  botaoCompacto: { paddingHorizontal: 10 },
  texto: { fontSize: fonte.botao, fontWeight: '700', textAlign: 'center' },
  textoCompacto: { fontSize: 18 },
  detalhe: { fontSize: fonte.pequeno, marginTop: 2, textAlign: 'center', opacity: 0.9 },
  opcao: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: cores.cartao,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: cores.borda,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  opcaoSelecionada: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  opcaoPressionada: { backgroundColor: cores.infoFundo },
  opcaoDesabilitada: { opacity: 0.5 },
  marca: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.cartao,
  },
  marcaSelecionada: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  check: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  opcaoTextos: { flex: 1 },
  opcaoTexto: { fontSize: fonte.botao, fontWeight: '700', color: cores.texto },
  opcaoDetalhe: { fontSize: fonte.pequeno, color: cores.textoSuave, marginTop: 2 },
});
