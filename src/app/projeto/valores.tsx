// Passo 6 — dados do eletricista e do cliente, quem compra os equipamentos e valores.
import { Redirect } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Cartao, CampoTexto, CampoValor, Selo, TituloSecao } from '@/componentes/Blocos';
import { BotaoOpcao } from '@/componentes/Botoes';
import { Carregando, Tela } from '@/componentes/Tela';
import { marcaModelo } from '@/dados/catalogo';
import { useApp, useMarcarTela } from '@/estado/projeto';
import { formatarReais } from '@/logica/dinheiro';
import { irPara, voltarOu } from '@/logica/navegar';
import { calcularTotais } from '@/logica/proposta';
import { recomendar } from '@/logica/recomendar';
import { cores, fonte } from '@/tema';

export default function TelaValores() {
  const { estado, dispatch } = useApp();
  useMarcarTela('/projeto/valores');
  const { projeto, perfil } = estado;

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;

  const rec = recomendar(projeto);
  const totais = calcularTotais(projeto, perfil, rec);
  const eletricistaCompra = projeto.quemCompra === 'eletricista';
  const semProduto = rec.grupos.flatMap((g) => g.linhas).filter((l) => !l.produto).length;

  return (
    <Tela
      passo={6}
      titulo="Valores e dados da proposta"
      subtitulo="Seus dados e seus valores ficam salvos para os próximos projetos."
      voltar={() => voltarOu('/projeto/lista')}
      continuar={() => irPara('/projeto/proposta')}
      textoContinuar="Ver proposta →">
      <Cartao>
        <TituloSecao>Seus dados</TituloSecao>
        <CampoTexto
          rotulo="Seu nome"
          valor={perfil.nome}
          placeholder="Ex.: João Eletricista"
          onMudar={(valor) => dispatch({ tipo: 'perfil', campo: 'nome', valor })}
        />
        <CampoTexto
          rotulo="Seu telefone"
          tipo="telefone"
          valor={perfil.telefone}
          placeholder="(11) 99999-9999"
          onMudar={(valor) => dispatch({ tipo: 'perfil', campo: 'telefone', valor })}
        />
      </Cartao>

      <Cartao>
        <TituloSecao>Cliente</TituloSecao>
        <CampoTexto
          rotulo="Nome do cliente"
          valor={projeto.cliente.nome}
          placeholder="Ex.: Maria Silva"
          onMudar={(valor) => dispatch({ tipo: 'cliente', campo: 'nome', valor })}
        />
        <CampoTexto
          rotulo="WhatsApp do cliente"
          tipo="telefone"
          valor={projeto.cliente.telefone}
          placeholder="(11) 99999-9999"
          onMudar={(valor) => dispatch({ tipo: 'cliente', campo: 'telefone', valor })}
        />
      </Cartao>

      <Cartao>
        <TituloSecao>Quem compra os equipamentos?</TituloSecao>
        <BotaoOpcao
          texto="O cliente compra"
          detalhe="A proposta lista os equipamentos, sem preço."
          selecionado={!eletricistaCompra}
          onPress={() => dispatch({ tipo: 'quemCompra', valor: 'cliente' })}
        />
        <BotaoOpcao
          texto="Eu compro e cobro"
          detalhe="Você informa o preço de cada equipamento."
          selecionado={eletricistaCompra}
          onPress={() => dispatch({ tipo: 'quemCompra', valor: 'eletricista' })}
        />
      </Cartao>

      {eletricistaCompra ? (
        <Cartao>
          <TituloSecao>Preço dos equipamentos</TituloSecao>
          <Text style={s.explica}>Preço de cada unidade.</Text>
          {totais.equipamentos.map((e) => (
            <LinhaValor
              key={e.produto.id}
              titulo={e.produto.nome}
              detalhe={`${marcaModelo(e.produto)} · ${e.quantidade} un.`}
              valor={e.precoUnitario}
              subtotal={e.subtotal}
              rotulo={`Preço de ${e.produto.nome}`}
              onMudar={(valor) => dispatch({ tipo: 'preco', produtoId: e.produto.id, valor })}
            />
          ))}
          {semProduto > 0 ? (
            <Text style={s.alerta}>{semProduto} item(ns) ainda sem produto definido não entram no total.</Text>
          ) : null}
        </Cartao>
      ) : null}

      <Cartao>
        <TituloSecao>Mão de obra e serviços</TituloSecao>
        <Text style={s.explica}>Valor de cada unidade. Fica salvo para os próximos projetos.</Text>
        {totais.servicos.map((servico) => (
          <LinhaValor
            key={servico.servico}
            titulo={servico.servico}
            selo={servico.adicional ? 'Adicional' : undefined}
            detalhe={`${servico.quantidade} × ${servico.unidade.replace(/^por /, '')}`}
            valor={servico.valorUnitario}
            subtotal={servico.subtotal}
            rotulo={`Valor de ${servico.servico}`}
            onMudar={(valor) => dispatch({ tipo: 'valorServico', servico: servico.servico, valor })}
          />
        ))}
      </Cartao>

      <Cartao estilo={s.totais}>
        {eletricistaCompra ? <LinhaTotal texto="Equipamentos" valor={totais.totalEquipamentos} /> : null}
        <LinhaTotal texto="Mão de obra e serviços" valor={totais.totalServicos} />
        <LinhaTotal texto="Total" valor={totais.total} grande />
        {totais.servicosSemValor > 0 ? (
          <Text style={s.alerta}>{totais.servicosSemValor} serviço(s) ainda sem valor.</Text>
        ) : null}
        {totais.equipamentosSemPreco > 0 ? (
          <Text style={s.alerta}>{totais.equipamentosSemPreco} equipamento(s) ainda sem preço.</Text>
        ) : null}
      </Cartao>
    </Tela>
  );
}

function LinhaValor(props: {
  titulo: string;
  detalhe: string;
  selo?: string;
  valor: number | null;
  subtotal: number;
  rotulo: string;
  onMudar: (valor: number | null) => void;
}) {
  const { width } = useWindowDimensions();
  const estreito = width < 600;
  return (
    <View style={[s.linha, estreito && s.linhaEstreita]}>
      <View style={s.linhaTextos}>
        <Text style={s.linhaTitulo}>{props.titulo}</Text>
        <View style={s.linhaDetalhe}>
          <Text style={s.detalhe}>{props.detalhe}</Text>
          {props.selo ? <Selo texto={props.selo} /> : null}
        </View>
      </View>
      <View style={s.linhaValores}>
        <CampoValor valor={props.valor} onMudar={props.onMudar} rotulo={props.rotulo} />
        <Text style={s.subtotal}>= {formatarReais(props.subtotal)}</Text>
      </View>
    </View>
  );
}

function LinhaTotal({ texto, valor, grande }: { texto: string; valor: number; grande?: boolean }) {
  return (
    <View style={[s.total, grande && s.totalGrande]}>
      <Text style={[s.totalTexto, grande && s.totalTextoGrande]}>{texto}</Text>
      <Text style={[s.totalTexto, grande && s.totalTextoGrande]}>{formatarReais(valor)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  explica: { fontSize: fonte.pequeno + 1, color: cores.textoSuave },
  alerta: { fontSize: fonte.pequeno + 1, color: cores.atencaoTexto, fontWeight: '700' },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingTop: 12,
  },
  linhaEstreita: { flexDirection: 'column', alignItems: 'stretch' },
  linhaTextos: { flex: 1, gap: 4 },
  linhaTitulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  linhaDetalhe: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  detalhe: { fontSize: fonte.pequeno, color: cores.textoSuave },
  linhaValores: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subtotal: { fontSize: 17, fontWeight: '700', color: cores.texto, minWidth: 120 },
  totais: { backgroundColor: cores.primariaClara, borderColor: cores.primaria },
  total: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  totalGrande: { borderTopWidth: 2, borderTopColor: cores.texto, paddingTop: 10 },
  totalTexto: { fontSize: 18, color: cores.texto },
  totalTextoGrande: { fontSize: 24, fontWeight: '800' },
});
