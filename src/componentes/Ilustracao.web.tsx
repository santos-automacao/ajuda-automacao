// Navegador: mostra o SVG como imagem (data URI), nítido em qualquer tela.
import { Image } from 'react-native';

import { ilustracoes, type NomeIlustracao } from '@/dados/ilustracoes';

export function Ilustracao({ nome, tamanho = 64 }: { nome: NomeIlustracao; tamanho?: number }) {
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ilustracoes[nome])}`;
  return (
    <Image
      source={{ uri }}
      style={{ width: tamanho, height: tamanho }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
