// Passo 3 — o que automatizar em cada cômodo (uma tela por cômodo).
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Aviso, Grade } from '@/componentes/Blocos';
import { Botao } from '@/componentes/Botoes';
import { LinhaContador } from '@/componentes/Contador';
import { Ilustracao } from '@/componentes/Ilustracao';
import { Carregando, Tela } from '@/componentes/Tela';
import { catalogo } from '@/dados/catalogo';
import type { NomeIlustracao } from '@/dados/ilustracoes';
import { nomeComodo, totalItensComodo, useApp, useMarcarTela } from '@/estado/projeto';
import { irPara, voltarOu } from '@/logica/navegar';
import { cores } from '@/tema';

export default function TelaItens() {
  const { estado, dispatch } = useApp();
  const { c } = useLocalSearchParams<{ c?: string }>();
  const [copiadoEm, setCopiadoEm] = useState<number | null>(null);
  const projeto = estado.projeto;
  const total = projeto?.comodos.length ?? 0;
  const indice = Math.min(Math.max(Number(c) || 0, 0), Math.max(total - 1, 0));
  useMarcarTela(`/projeto/itens?c=${indice}`);

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;
  if (total === 0) return <Redirect href="/projeto/comodos" />;

  const comodo = projeto.comodos[indice];
  const nome = nomeComodo(projeto, comodo);
  const irmaos = projeto.comodos.filter((x) => x.tipo === comodo.tipo && x.uid !== comodo.uid);
  const nomesIrmaos = irmaos.map((x) => nomeComodo(projeto, x)).join(', ');
  const ultimo = indice === total - 1;
  const ir = (i: number) => router.setParams({ c: String(i) });

  return (
    <Tela
      passo={3}
      titulo={`${nome}: o que automatizar?`}
      subtitulo={`Cômodo ${indice + 1} de ${total}. Use − e + em cada item.`}
      chaveRolagem={indice}
      voltar={() => (indice > 0 ? ir(indice - 1) : voltarOu('/projeto/comodos'))}
      continuar={() => (ultimo ? irPara('/projeto/perguntas?q=0') : ir(indice + 1))}
      textoContinuar={ultimo ? 'Continuar →' : 'Próximo cômodo →'}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {projeto.comodos.map((x, i) => {
          const atual = i === indice;
          const itens = totalItensComodo(x);
          return (
            <Pressable
              key={x.uid}
              onPress={() => ir(i)}
              accessibilityRole="button"
              accessibilityLabel={`Ir para ${nomeComodo(projeto, x)}`}
              accessibilityState={{ selected: atual }}
              style={[s.chip, atual && s.chipAtual]}>
              <Ilustracao nome={`comodo_${x.tipo}` as NomeIlustracao} tamanho={32} />
              <Text style={[s.chipTexto, atual && s.chipTextoAtual]}>{nomeComodo(projeto, x)}</Text>
              {itens > 0 ? <Text style={s.chipConta}>{itens}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Aviso nivel="info" itens={['Luz: conte as teclas do interruptor, não as lâmpadas. 5 lâmpadas na mesma tecla = 1.']} />

      <Grade>
        {catalogo.itens.map((item) => (
          <LinhaContador
            key={item.id}
            ilustracao={`item_${item.id}` as NomeIlustracao}
            nome={item.botao}
            detalhe={item.pergunta}
            valor={comodo.itens[item.id] ?? 0}
            onMudar={(quantidade) => dispatch({ tipo: 'itemComodo', uid: comodo.uid, item: item.id, quantidade })}
          />
        ))}
      </Grade>

      {irmaos.length > 0 ? (
        copiadoEm === indice ? (
          <Aviso nivel="sucesso" titulo={`Copiado para ${nomesIrmaos} ✓`} />
        ) : (
          <Botao
            variante="secundario"
            texto={`Copiar estes itens para ${nomesIrmaos}`}
            onPress={() => {
              dispatch({ tipo: 'copiarItens', uid: comodo.uid });
              setCopiadoEm(indice);
            }}
          />
        )
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
  },
  chipAtual: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  chipTexto: { fontSize: 16, fontWeight: '600', color: cores.texto },
  chipTextoAtual: { color: cores.primaria, fontWeight: '800' },
  chipConta: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: cores.primaria,
    borderRadius: 13,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
