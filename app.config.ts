import type { ConfigContext, ExpoConfig } from 'expo/config';

// Lê o app.json e acrescenta o endereço-base do site quando a variável BASE_URL existe.
// No GitHub Pages o site fica em /ajuda-automacao (ver .github/workflows/pages.yml).
// Rodando no seu computador (npm run web) a variável não existe e o site fica na raiz.
export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.BASE_URL;
  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  } as ExpoConfig;
};
