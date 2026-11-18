// Guia de instalação: passo a passo simples de cada tipo de aparelho desta obra.
import { Redirect } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Aviso, Cartao } from '@/componentes/Blocos';
import { Botao } from '@/componentes/Botoes';
import { Ilustracao } from '@/componentes/Ilustracao';
import { Carregando, Tela } from '@/componentes/Tela';
import { marcaModelo, tipoPorId, type TipoAparelho } from '@/dados/catalogo';
import { useApp, useMarcarTela } from '@/estado/projeto';
import { voltarOu } from '@/logica/navegar';
import { recomendar, type Linha } from '@/logica/recomendar';
import { cores, fonte } from '@/tema';

/** "1. Faça isso. 2. Depois aquilo." → ["Faça isso.", "Depois aquilo."] */
function separarPassos(texto: string): string[] {
  return texto
    .split(/\s*(?=\d+\.\s)/)
    .map((p) => p.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

export default function TelaInstalacao() {
  const { estado } = useApp();
  useMarcarTela('/projeto/instalacao');
  const projeto = estado.projeto;

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;

  const rec = recomendar(projeto);
  const porTipo = new Map<string, { tipo: TipoAparelho; linhas: Linha[] }>();
  for (const linha of rec.grupos.flatMap((g) => g.linhas)) {
    const tipo = tipoPorId(linha.tipoId);
    if (!tipo) continue;
    const entrada = porTipo.get(tipo.id) ?? { tipo, linhas: [] };
    entrada.linhas.push(linha);
    porTipo.set(tipo.id, entrada);
  }
  const atencao = rec.alertas.filter((a) => a.nivel === 'atencao').map((a) => a.mensagem);

  return (
    <Tela
      titulo="Guia de instalação"
      subtitulo="Passo a passo simples de cada aparelho desta obra. Confira sempre o manual do fabricante."
      voltar={() => voltarOu('/projeto/proposta')}>
      {atencao.length > 0 ? <Aviso titulo="⚡ Atenção nesta obra" itens={atencao} /> : null}

      {[...porTipo.values()].map(({ tipo, linhas }) => {
        const quantidade = linhas.reduce((soma, l) => soma + l.quantidade, 0);
        const produtos = [
          ...new Set(linhas.map((l) => (l.produto ? marcaModelo(l.produto) : 'a definir'))),
        ];
        const manual = linhas
          .map((l) => l.produto?.fonte?.split(' | ')[0])
          .find((url) => url?.startsWith('http'));
        return (
          <Cartao key={tipo.id}>
            <View style={s.topo}>
              <Ilustracao nome={linhas[0].ilustracao} tamanho={64} />
              <View style={s.topoTextos}>
                <Text style={s.nome} accessibilityRole="header">
                  {tipo.nome}
                </Text>
                <Text style={s.paraQue}>{tipo.paraQue}</Text>
              </View>
            </View>
            <Text style={s.nestaObra}>
              Nesta obra: {quantidade} un. · {produtos.join(', ')}
            </Text>
            <Aviso titulo="Antes de começar" itens={[tipo.cuidados]} />
            <View style={s.passos}>
              {separarPassos(tipo.passos).map((passo, i) => (
                <View key={passo} style={s.passo}>
                  <View style={s.numero}>
                    <Text style={s.numeroTexto}>{i + 1}</Text>
                  </View>
                  <Text style={s.passoTexto}>{passo}</Text>
                </View>
              ))}
            </View>
            {manual ? (
              <Botao variante="link" texto="Ver manual ou ficha do fabricante ↗" onPress={() => Linking.openURL(manual)} />
            ) : null}
          </Cartao>
        );
      })}
    </Tela>
  );
}

const s = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topoTextos: { flex: 1, gap: 2 },
  nome: { fontSize: 21, fontWeight: '800', color: cores.texto },
  paraQue: { fontSize: fonte.pequeno + 1, color: cores.textoSuave },
  nestaObra: { fontSize: fonte.pequeno + 1, fontWeight: '700', color: cores.primaria },
  passos: { gap: 12 },
  passo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  numero: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  passoTexto: { flex: 1, fontSize: fonte.texto, color: cores.texto, lineHeight: 26 },
});
