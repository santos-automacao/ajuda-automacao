// Proposta pronta: prévia, salvar PDF, enviar no WhatsApp e ir para o guia de instalação.
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Aviso, Cartao } from '@/componentes/Blocos';
import { Botao } from '@/componentes/Botoes';
import { Ilustracao } from '@/componentes/Ilustracao';
import { Carregando, Tela } from '@/componentes/Tela';
import { marcaModelo } from '@/dados/catalogo';
import { useApp, useMarcarTela } from '@/estado/projeto';
import { formatarReais } from '@/logica/dinheiro';
import { irPara, voltarOu } from '@/logica/navegar';
import { salvarPdf } from '@/logica/pdf';
import { calcularTotais, dataDeHoje, htmlProposta, linkWhatsapp, textoWhatsapp } from '@/logica/proposta';
import { recomendar } from '@/logica/recomendar';
import { cores, fonte } from '@/tema';

export default function TelaProposta() {
  const { estado } = useApp();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  useMarcarTela('/projeto/proposta');
  const { projeto, perfil } = estado;

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;

  const rec = recomendar(projeto);
  const totais = calcularTotais(projeto, perfil, rec);
  const eletricistaCompra = projeto.quemCompra === 'eletricista';
  const lado = width >= 700;

  const pdf = async () => {
    try {
      const resultado = await salvarPdf(htmlProposta(projeto, perfil, rec, totais));
      if (resultado === 'bloqueado') {
        setMensagem('O navegador bloqueou a janela do PDF. Permita pop-ups para este site e toque de novo.');
      } else if (Platform.OS === 'web') {
        setMensagem('Na janela que abriu, escolha “Salvar como PDF” e depois anexe o arquivo no WhatsApp.');
      }
    } catch {
      setMensagem('Não foi possível gerar o PDF. Tente de novo.');
    }
  };

  const whatsapp = () => {
    Linking.openURL(linkWhatsapp(projeto.cliente.telefone, textoWhatsapp(projeto, perfil, rec, totais)));
  };

  return (
    <Tela titulo="Proposta pronta!" subtitulo="Salve o PDF e envie para o cliente." voltar={() => voltarOu('/projeto/valores')}>
      <View style={[s.acoes, lado && s.acoesLado]}>
        <Botao texto="📄 Salvar PDF" onPress={pdf} estilo={lado ? s.metade : undefined} />
        <Botao
          variante="whatsapp"
          texto="Enviar no WhatsApp"
          detalhe={projeto.cliente.telefone ? `Para ${projeto.cliente.nome || projeto.cliente.telefone}` : 'Você escolhe o contato'}
          onPress={whatsapp}
          estilo={lado ? s.metade : undefined}
        />
      </View>
      {mensagem ? <Aviso nivel="info" itens={[mensagem]} /> : null}

      <Cartao estilo={s.folha}>
        <View style={s.cabecalho}>
          <View style={s.cabecalhoTextos}>
            <Text style={s.folhaTitulo}>Proposta de automação residencial</Text>
            <Text style={s.pequeno}>Data: {dataDeHoje()} · Validade: 15 dias</Text>
          </View>
          <View>
            <Text style={s.eletricista}>{perfil.nome || 'Seu nome'}</Text>
            <Text style={s.pequeno}>{perfil.telefone}</Text>
          </View>
        </View>
        <Text style={s.cliente}>
          Cliente: <Text style={s.negrito}>{projeto.cliente.nome || '—'}</Text>
        </Text>

        {rec.grupos.map((grupo) => (
          <View key={grupo.chave} style={s.grupo}>
            <View style={s.grupoTitulo}>
              <Ilustracao nome={grupo.ilustracao} tamanho={32} />
              <Text style={s.grupoNome}>{grupo.titulo}</Text>
            </View>
            {grupo.linhas.map((linha) => (
              <View key={linha.chave} style={s.item}>
                <Ilustracao nome={linha.ilustracao} tamanho={28} />
                <Text style={s.itemTexto}>
                  {linha.quantidade} × {linha.descricao ?? linha.titulo}
                  <Text style={s.pequeno}>
                    {'  '}
                    {linha.produto ? marcaModelo(linha.produto) : 'a definir'}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.grupo}>
          <Text style={s.grupoNome}>Mão de obra e serviços</Text>
          {totais.servicos.map((servico) => (
            <View key={servico.servico} style={s.servico}>
              <Text style={s.itemTexto}>
                {servico.quantidade} × {servico.servico}
              </Text>
              <Text style={s.valor}>{formatarReais(servico.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totais}>
          {eletricistaCompra ? (
            <View style={s.servico}>
              <Text style={s.itemTexto}>Equipamentos</Text>
              <Text style={s.valor}>{formatarReais(totais.totalEquipamentos)}</Text>
            </View>
          ) : null}
          <View style={s.servico}>
            <Text style={s.totalTexto}>Total</Text>
            <Text style={s.totalTexto}>{formatarReais(totais.total)}</Text>
          </View>
        </View>
      </Cartao>

      <Botao variante="secundario" texto="🔧 Como instalar (guia da obra)" onPress={() => irPara('/projeto/instalacao')} />
      <Botao variante="link" texto="Voltar ao início" onPress={() => router.replace('/')} />
    </Tela>
  );
}

const s = StyleSheet.create({
  acoes: { gap: 12 },
  acoesLado: { flexDirection: 'row' },
  metade: { flex: 1 },
  folha: { gap: 14 },
  cabecalho: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 3,
    borderBottomColor: cores.primaria,
    paddingBottom: 12,
  },
  cabecalhoTextos: { flex: 1, minWidth: 220 },
  folhaTitulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  eletricista: { fontSize: 18, fontWeight: '800', color: cores.texto },
  pequeno: { fontSize: fonte.pequeno, color: cores.textoSuave, fontWeight: '400' },
  cliente: { fontSize: fonte.texto, color: cores.texto },
  negrito: { fontWeight: '800' },
  grupo: { gap: 6 },
  grupoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grupoNome: { fontSize: 19, fontWeight: '800', color: cores.texto },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  itemTexto: { flex: 1, fontSize: 17, color: cores.texto },
  servico: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  valor: { fontSize: 17, fontWeight: '700', color: cores.texto },
  totais: { borderTopWidth: 2, borderTopColor: cores.texto, paddingTop: 10, gap: 6 },
  totalTexto: { fontSize: 24, fontWeight: '800', color: cores.texto },
});
