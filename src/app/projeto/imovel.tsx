// Passo 1 — tipo de imóvel. Só Casa está ativa no MVP.
import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Grade, Selo } from '@/componentes/Blocos';
import { Ilustracao } from '@/componentes/Ilustracao';
import { Carregando, Tela } from '@/componentes/Tela';
import { catalogo } from '@/dados/catalogo';
import type { NomeIlustracao } from '@/dados/ilustracoes';
import { useApp, useMarcarTela } from '@/estado/projeto';
import { irPara, voltarOu } from '@/logica/navegar';
import { cores, sombra } from '@/tema';

export default function TelaImovel() {
  const { estado, dispatch } = useApp();
  useMarcarTela('/projeto/imovel');
  const projeto = estado.projeto;

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;

  const escolher = (id: string) => {
    dispatch({ tipo: 'imovel', imovel: id });
    irPara('/projeto/comodos');
  };

  return (
    <Tela
      passo={1}
      titulo="Qual é o imóvel?"
      subtitulo="Toque no desenho."
      voltar={() => voltarOu('/')}
      continuar={() => irPara('/projeto/comodos')}
      podeContinuar={!!projeto.imovel}
      motivo="Escolha o tipo de imóvel.">
      <Grade>
        {catalogo.imoveis.map((imovel) => {
          const ativo = imovel.situacao.startsWith('Ativo');
          const selecionado = projeto.imovel === imovel.id;
          return (
            <Pressable
              key={imovel.id}
              disabled={!ativo}
              onPress={() => escolher(imovel.id)}
              accessibilityRole="button"
              accessibilityLabel={ativo ? imovel.nome : `${imovel.nome}, em breve`}
              accessibilityState={{ disabled: !ativo, selected: selecionado }}
              style={({ pressed }) => [
                s.cartao,
                selecionado && s.selecionado,
                pressed && s.pressionado,
                !ativo && s.inativo,
              ]}>
              <Ilustracao nome={`imovel_${imovel.id}` as NomeIlustracao} tamanho={96} />
              <View style={s.textos}>
                <Text style={s.nome}>{imovel.nome}</Text>
                {ativo ? <Text style={s.detalhe}>Toque para escolher</Text> : <Selo texto="Em breve" cor="info" />}
              </View>
              {ativo ? <Text style={s.seta}>›</Text> : null}
            </Pressable>
          );
        })}
      </Grade>
    </Tela>
  );
}

const s = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: cores.cartao,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: cores.borda,
    padding: 14,
    minHeight: 124,
    ...sombra,
  },
  selecionado: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  pressionado: { backgroundColor: cores.infoFundo },
  inativo: { opacity: 0.55 },
  textos: { flex: 1, gap: 6 },
  nome: { fontSize: 24, fontWeight: '800', color: cores.texto },
  detalhe: { fontSize: 16, color: cores.textoSuave },
  seta: { fontSize: 44, color: cores.primaria, fontWeight: '300' },
});
