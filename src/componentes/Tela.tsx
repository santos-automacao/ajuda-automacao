// Estrutura comum de todas as telas: progresso, título, conteúdo e barra fixa
// embaixo com "Voltar" e "Continuar" sempre no mesmo lugar.
import { useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, fonte, LARGURA_MAXIMA } from '@/tema';

import { Botao } from './Botoes';

export const PASSOS = ['Imóvel', 'Cômodos', 'Itens', 'Instalação', 'Lista', 'Valores'];

interface TelaProps {
  passo?: number;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  voltar?: () => void;
  continuar?: () => void;
  textoContinuar?: string;
  podeContinuar?: boolean;
  /** Explica por que "Continuar" está desligado. */
  motivo?: string;
  /** Quando muda (ex.: próximo cômodo), a tela volta para o topo. */
  chaveRolagem?: string | number;
}

export function Tela({
  passo,
  titulo,
  subtitulo,
  children,
  voltar,
  continuar,
  textoContinuar,
  podeContinuar,
  motivo,
  chaveRolagem,
}: TelaProps) {
  const rolagem = useRef<ScrollViewInstance>(null);
  const { width } = useWindowDimensions();
  const estreito = width < 430;

  useEffect(() => {
    rolagem.current?.scrollTo({ y: 0, animated: false });
  }, [chaveRolagem]);

  return (
    <SafeAreaView style={s.raiz} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView ref={rolagem} contentContainerStyle={s.rolagem} keyboardShouldPersistTaps="handled">
        <View style={s.miolo}>
          {passo ? <Progresso passo={passo} /> : null}
          <Text style={[s.titulo, estreito && s.tituloEstreito]} accessibilityRole="header">
            {titulo}
          </Text>
          {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
          <View style={s.conteudo}>{children}</View>
        </View>
      </ScrollView>
      {voltar || continuar ? (
        <View style={s.barra}>
          <View style={s.barraMiolo}>
            {podeContinuar === false && motivo ? <Text style={s.motivo}>{motivo}</Text> : null}
            <View style={s.botoes}>
              {voltar ? (
                <Botao texto="← Voltar" variante="secundario" onPress={voltar} estilo={s.voltar} compacto={estreito} />
              ) : null}
              {continuar ? (
                <Botao
                  texto={textoContinuar ?? 'Continuar →'}
                  onPress={continuar}
                  desabilitado={podeContinuar === false}
                  estilo={s.continuar}
                  compacto={estreito}
                />
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Progresso({ passo }: { passo: number }) {
  const { width } = useWindowDimensions();
  const mostrarNomes = width >= 700;
  return (
    <View
      style={s.progresso}
      accessible
      accessibilityLabel={`Passo ${passo} de ${PASSOS.length}: ${PASSOS[passo - 1]}`}>
      <Text style={s.progressoTexto}>
        Passo {passo} de {PASSOS.length} · {PASSOS[passo - 1]}
      </Text>
      <View style={s.segmentos}>
        {PASSOS.map((nome, i) => (
          <View key={nome} style={s.segmento}>
            <View style={[s.barrinha, i < passo && s.barrinhaFeita]} />
            {mostrarNomes ? <Text style={[s.nomePasso, i === passo - 1 && s.nomePassoAtual]}>{nome}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function Carregando() {
  return (
    <View style={[s.raiz, s.centro]}>
      <ActivityIndicator size="large" color={cores.primaria} />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  centro: { alignItems: 'center', justifyContent: 'center' },
  rolagem: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, flexGrow: 1 },
  miolo: { width: '100%', maxWidth: LARGURA_MAXIMA, alignSelf: 'center' },
  titulo: { fontSize: fonte.titulo, fontWeight: '800', color: cores.texto, marginTop: 8 },
  tituloEstreito: { fontSize: 24 },
  subtitulo: { fontSize: fonte.subtitulo, color: cores.textoSuave, marginTop: 6, lineHeight: 25 },
  conteudo: { marginTop: 20, gap: 16 },
  barra: {
    backgroundColor: cores.cartao,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  barraMiolo: { width: '100%', maxWidth: LARGURA_MAXIMA, alignSelf: 'center', gap: 8 },
  motivo: { fontSize: fonte.pequeno, color: cores.atencaoTexto, textAlign: 'center' },
  botoes: { flexDirection: 'row', gap: 12 },
  voltar: { flex: 1 },
  continuar: { flex: 2 },
  progresso: { gap: 8 },
  progressoTexto: { fontSize: fonte.pequeno, fontWeight: '700', color: cores.primaria },
  segmentos: { flexDirection: 'row', gap: 6 },
  segmento: { flex: 1, gap: 4 },
  barrinha: { height: 8, borderRadius: 4, backgroundColor: cores.borda },
  barrinhaFeita: { backgroundColor: cores.primaria },
  nomePasso: { fontSize: 13, color: cores.textoSuave, textAlign: 'center' },
  nomePassoAtual: { color: cores.primaria, fontWeight: '700' },
});
