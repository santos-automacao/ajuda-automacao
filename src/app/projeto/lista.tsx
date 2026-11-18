// Passo 5 — equipamentos recomendados, alertas elétricos e serviços adicionais.
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Aviso, Cartao, Grade, Selo, TituloSecao } from '@/componentes/Blocos';
import { Botao, BotaoOpcao } from '@/componentes/Botoes';
import { Ilustracao } from '@/componentes/Ilustracao';
import { Carregando, Tela } from '@/componentes/Tela';
import { marcaModelo, type Produto } from '@/dados/catalogo';
import { useApp, useMarcarTela } from '@/estado/projeto';
import { irPara, voltarOu } from '@/logica/navegar';
import { recomendar, type Linha } from '@/logica/recomendar';
import { cores, fonte } from '@/tema';

const NOME_ASSISTENTE = { alexa: 'Alexa', google: 'Google', nenhum: 'nenhum ainda' } as const;

export default function TelaLista() {
  const { estado, dispatch } = useApp();
  const [aberta, setAberta] = useState<string | null>(null);
  useMarcarTela('/projeto/lista');
  const projeto = estado.projeto;

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;

  const rec = recomendar(projeto);
  const atencao = rec.alertas.filter((a) => a.nivel === 'atencao').map((a) => a.mensagem);
  const lembretes = rec.alertas.filter((a) => a.nivel === 'info').map((a) => a.mensagem);
  const adicionais = rec.servicos.filter((s) => s.adicional);
  const { tensao, assistente } = projeto.respostas;
  const vazio = rec.grupos.length === 0;

  return (
    <Tela
      passo={5}
      titulo="Equipamentos recomendados"
      subtitulo="Confira a lista. Toque em “Trocar” para ver outras opções."
      voltar={() => voltarOu('/projeto/perguntas?q=0')}
      continuar={() => irPara('/projeto/valores')}
      podeContinuar={!vazio}
      motivo="Nenhum item foi escolhido nos cômodos.">
      <View style={s.selos}>
        {tensao ? <Selo cor="info" texto={`Tensão: ${tensao === 'ambas' ? '127 V e 220 V' : `${tensao} V`}`} /> : null}
        {assistente ? <Selo cor="info" texto={`Assistente: ${NOME_ASSISTENTE[assistente]}`} /> : null}
      </View>

      {vazio ? (
        <Aviso nivel="info" titulo="Nenhum item escolhido" itens={['Volte ao passo 3 e use + nos itens de cada cômodo.']} />
      ) : null}

      {atencao.length > 0 ? <Aviso titulo="⚡ Atenção elétrica" itens={atencao} /> : null}

      {rec.grupos.map((grupo) => (
        <View key={grupo.chave} style={s.grupo}>
          <View style={s.grupoTitulo}>
            <Ilustracao nome={grupo.ilustracao} tamanho={44} />
            <Text style={s.grupoNome} accessibilityRole="header">
              {grupo.titulo}
            </Text>
          </View>
          <Grade>
            {grupo.linhas.map((linha) => (
              <CartaoLinha
                key={linha.chave}
                linha={linha}
                aberta={aberta === linha.chave}
                onAbrir={() => setAberta(aberta === linha.chave ? null : linha.chave)}
                onTrocar={(produto) => {
                  dispatch({ tipo: 'trocar', chave: linha.chave, produtoId: produto.id });
                  setAberta(null);
                }}
              />
            ))}
          </Grade>
        </View>
      ))}

      {adicionais.length > 0 ? (
        <Cartao>
          <TituloSecao>Serviços adicionais</TituloSecao>
          <Text style={s.texto}>Gerados pela análise elétrica. Já entram no orçamento.</Text>
          {adicionais.map((servico) => (
            <View key={servico.servico} style={s.servico}>
              <Text style={s.servicoNome}>
                {servico.quantidade} × {servico.servico}
              </Text>
              {servico.motivos.length > 0 ? <Text style={s.servicoMotivo}>{servico.motivos.join('; ')}</Text> : null}
            </View>
          ))}
        </Cartao>
      ) : null}

      {lembretes.length > 0 ? <Aviso nivel="info" titulo="Para lembrar" itens={lembretes} /> : null}
    </Tela>
  );
}

function CartaoLinha(props: { linha: Linha; aberta: boolean; onAbrir: () => void; onTrocar: (p: Produto) => void }) {
  const { linha, aberta, onAbrir, onTrocar } = props;
  const p = linha.produto;
  const opcoes = linha.alternativas.length;
  return (
    <Cartao>
      <View style={s.linhaTopo}>
        <Ilustracao nome={linha.ilustracao} tamanho={56} />
        <View style={s.linhaTextos}>
          <Text style={s.produtoNome}>{p ? p.nome : linha.titulo}</Text>
          <Text style={s.produtoMarca}>{p ? marcaModelo(p) : 'Produto a definir'}</Text>
          {linha.descricao ? <Text style={s.descricao}>{linha.descricao}</Text> : null}
        </View>
        <View style={s.quantidade} accessibilityLabel={`Quantidade: ${linha.quantidade}`}>
          <Text style={s.quantidadeTexto}>×{linha.quantidade}</Text>
        </View>
      </View>
      {p ? (
        <View style={s.selos}>
          <Selo
            texto={p.status === 'Verificado' ? 'Verificado' : 'Em verificação'}
            cor={p.status === 'Verificado' ? 'sucesso' : 'atencao'}
          />
          {p.protocolo?.includes('Zigbee') ? <Selo texto="Precisa de central" cor="info" /> : null}
          {p.fabricadoBrasil?.startsWith('Sim') ? <Selo texto="Fabricado no Brasil" cor="sucesso" /> : null}
          {p.app && !p.app.startsWith('Verificar') ? <Selo texto={`App: ${p.app}`} cor="info" /> : null}
        </View>
      ) : null}
      {linha.nota ? <Text style={s.nota}>{linha.nota}</Text> : null}
      {opcoes > 0 ? (
        <Botao
          variante="secundario"
          texto={aberta ? 'Fechar opções' : `Trocar (${opcoes} ${opcoes === 1 ? 'opção' : 'opções'})`}
          onPress={onAbrir}
        />
      ) : null}
      {aberta ? (
        <View style={s.alternativas}>
          {linha.alternativas.map((alt) => (
            <BotaoOpcao
              key={alt.id}
              texto={alt.nome}
              detalhe={marcaModelo(alt)}
              selecionado={false}
              onPress={() => onTrocar(alt)}
            />
          ))}
        </View>
      ) : null}
    </Cartao>
  );
}

const s = StyleSheet.create({
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grupo: { gap: 10 },
  grupoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  grupoNome: { fontSize: 22, fontWeight: '800', color: cores.texto },
  texto: { fontSize: fonte.pequeno + 1, color: cores.textoSuave },
  servico: { gap: 2, borderTopWidth: 1, borderTopColor: cores.borda, paddingTop: 10 },
  servicoNome: { fontSize: fonte.texto, fontWeight: '700', color: cores.texto },
  servicoMotivo: { fontSize: fonte.pequeno, color: cores.textoSuave },
  linhaTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  linhaTextos: { flex: 1, minWidth: 0, gap: 2 },
  produtoNome: { fontSize: 19, fontWeight: '800', color: cores.texto },
  produtoMarca: { fontSize: 16, color: cores.textoSuave },
  descricao: { fontSize: 16, color: cores.primaria, fontWeight: '700' },
  quantidade: {
    minWidth: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  quantidadeTexto: { fontSize: 22, fontWeight: '800', color: cores.primaria },
  nota: { fontSize: fonte.pequeno, color: cores.atencaoTexto, fontStyle: 'italic' },
  alternativas: { gap: 8 },
});
