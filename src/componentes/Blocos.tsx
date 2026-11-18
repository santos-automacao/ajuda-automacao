// Blocos de apoio: grade responsiva, avisos, cartões, campos de texto e de valor.
import { Children, isValidElement, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatarNumero, lerReais } from '@/logica/dinheiro';
import { cores, fonte, LARGURA_DUAS_COLUNAS, sombra, TOQUE_MINIMO } from '@/tema';

/** Uma coluna no celular, duas no notebook. */
export function Grade({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const duasColunas = width >= LARGURA_DUAS_COLUNAS;
  return (
    <View style={s.grade}>
      {Children.toArray(children).map((filho, i) => (
        <View key={isValidElement(filho) && filho.key !== null ? filho.key : i} style={duasColunas ? s.metade : s.inteira}>
          {filho}
        </View>
      ))}
    </View>
  );
}

export function Cartao({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return <View style={[s.cartao, estilo]}>{children}</View>;
}

export function TituloSecao({ children }: { children: ReactNode }) {
  return (
    <Text style={s.tituloSecao} accessibilityRole="header">
      {children}
    </Text>
  );
}

interface AvisoProps {
  titulo?: string;
  itens?: string[];
  nivel?: 'atencao' | 'info' | 'sucesso';
  children?: ReactNode;
}

export function Aviso({ titulo, itens, nivel = 'atencao', children }: AvisoProps) {
  const estilo = nivel === 'atencao' ? s.atencao : nivel === 'sucesso' ? s.sucesso : s.info;
  return (
    <View style={[s.aviso, estilo]} accessibilityRole="summary">
      {titulo ? <Text style={s.avisoTitulo}>{titulo}</Text> : null}
      {itens?.map((item) => (
        <View key={item} style={s.avisoLinha}>
          <Text style={s.avisoMarcador}>•</Text>
          <Text style={s.avisoTexto}>{item}</Text>
        </View>
      ))}
      {children}
    </View>
  );
}

export function Selo({ texto, cor = 'atencao' }: { texto: string; cor?: 'atencao' | 'sucesso' | 'info' }) {
  const estilo = cor === 'atencao' ? s.seloAtencao : cor === 'sucesso' ? s.seloSucesso : s.seloInfo;
  return (
    <View style={[s.selo, estilo]}>
      <Text style={s.seloTexto}>{texto}</Text>
    </View>
  );
}

interface CampoTextoProps {
  rotulo: string;
  valor: string;
  onMudar: (texto: string) => void;
  tipo?: 'nome' | 'telefone';
  placeholder?: string;
}

export function CampoTexto({ rotulo, valor, onMudar, tipo = 'nome', placeholder }: CampoTextoProps) {
  return (
    <View style={s.campo}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <TextInput
        value={valor}
        onChangeText={onMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.desabilitado}
        keyboardType={tipo === 'telefone' ? 'phone-pad' : 'default'}
        autoCapitalize={tipo === 'nome' ? 'words' : 'none'}
        autoComplete={tipo === 'telefone' ? 'tel' : 'name'}
        accessibilityLabel={rotulo}
        style={s.entrada}
      />
    </View>
  );
}

/** Campo de dinheiro: aceita "80", "80,50" ou "1.200,00". */
export function CampoValor({ valor, onMudar, rotulo }: { valor: number | null; onMudar: (v: number | null) => void; rotulo: string }) {
  const [texto, setTexto] = useState(valor !== null ? formatarNumero(valor) : '');
  return (
    <View style={s.valorCaixa}>
      <Text style={s.prefixo}>R$</Text>
      <TextInput
        value={texto}
        onChangeText={(t) => {
          setTexto(t);
          onMudar(lerReais(t));
        }}
        placeholder="0,00"
        placeholderTextColor={cores.desabilitado}
        keyboardType="decimal-pad"
        accessibilityLabel={rotulo}
        style={s.valorEntrada}
      />
    </View>
  );
}

const s = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metade: { flexBasis: '48%', flexGrow: 1 },
  inteira: { width: '100%' },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
    gap: 12,
    flexGrow: 1,
    ...sombra,
  },
  tituloSecao: { fontSize: 22, fontWeight: '800', color: cores.texto, marginTop: 8 },
  aviso: { borderRadius: 14, borderWidth: 2, padding: 16, gap: 8 },
  atencao: { backgroundColor: cores.atencaoFundo, borderColor: cores.atencaoBorda },
  info: { backgroundColor: cores.infoFundo, borderColor: cores.infoBorda },
  sucesso: { backgroundColor: cores.sucessoClaro, borderColor: '#9BD3AE' },
  avisoTitulo: { fontSize: 19, fontWeight: '800', color: cores.texto },
  avisoLinha: { flexDirection: 'row', gap: 8 },
  avisoMarcador: { fontSize: fonte.texto, color: cores.texto, lineHeight: 25 },
  avisoTexto: { flex: 1, fontSize: fonte.texto - 1, color: cores.texto, lineHeight: 25 },
  selo: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  seloAtencao: { backgroundColor: cores.atencaoFundo, borderColor: cores.atencaoBorda },
  seloSucesso: { backgroundColor: cores.sucessoClaro, borderColor: '#9BD3AE' },
  seloInfo: { backgroundColor: cores.infoFundo, borderColor: cores.infoBorda },
  seloTexto: { fontSize: 14, fontWeight: '700', color: cores.texto },
  campo: { gap: 6 },
  rotulo: { fontSize: 17, fontWeight: '700', color: cores.texto },
  entrada: {
    minHeight: TOQUE_MINIMO,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 20,
    color: cores.texto,
    backgroundColor: cores.cartao,
  },
  valorCaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 12,
    backgroundColor: cores.cartao,
    paddingLeft: 12,
    width: 150,
  },
  prefixo: { fontSize: 18, color: cores.textoSuave, fontWeight: '700' },
  valorEntrada: { flex: 1, minWidth: 0, fontSize: 20, color: cores.texto, paddingHorizontal: 8, minHeight: 52 },
});
