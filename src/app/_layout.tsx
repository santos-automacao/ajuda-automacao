import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProvedorProjeto } from '@/estado/projeto';
import { cores } from '@/tema';

export default function Layout() {
  return (
    <ProvedorProjeto>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          title: 'Ajuda Automação',
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </ProvedorProjeto>
  );
}
