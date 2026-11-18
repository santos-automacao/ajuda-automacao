// Celular: desenha o SVG com react-native-svg. No navegador é usado o Ilustracao.web.tsx.
import { SvgXml } from 'react-native-svg';

import { ilustracoes, type NomeIlustracao } from '@/dados/ilustracoes';

export function Ilustracao({ nome, tamanho = 64 }: { nome: NomeIlustracao; tamanho?: number }) {
  return <SvgXml xml={ilustracoes[nome]} width={tamanho} height={tamanho} />;
}
