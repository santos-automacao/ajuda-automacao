// Cores, tamanhos e medidas do app.
// Público: eletricistas, inclusive os mais velhos — letras grandes, alto contraste e botões grandes.

export const cores = {
  fundo: '#F3F6FA',
  cartao: '#FFFFFF',
  texto: '#1B2430',
  textoSuave: '#4F5B6B',
  borda: '#D3DAE3',
  primaria: '#1565D8',
  primariaPressionada: '#0E4FAE',
  primariaClara: '#E7F0FD',
  sucesso: '#15803D',
  sucessoClaro: '#E6F6EC',
  whatsapp: '#1F9D55',
  atencaoTexto: '#7A4F00',
  atencaoFundo: '#FFF6D6',
  atencaoBorda: '#F1C84B',
  infoFundo: '#EEF3FA',
  infoBorda: '#C9D6E8',
  desabilitado: '#AEB8C4',
};

export const fonte = {
  tituloGrande: 32,
  titulo: 26,
  subtitulo: 18,
  texto: 18,
  pequeno: 15,
  botao: 20,
};

export const espaco = { p: 8, m: 16, g: 24 };

/** Largura máxima do conteúdo no notebook. */
export const LARGURA_MAXIMA = 880;
/** A partir desta largura, as listas usam duas colunas. */
export const LARGURA_DUAS_COLUNAS = 900;
/** Altura mínima de qualquer botão (dedo grande, celular na mão). */
export const TOQUE_MINIMO = 60;

export const sombra = { boxShadow: '0 1px 3px rgba(20, 30, 50, 0.10)' } as const;
