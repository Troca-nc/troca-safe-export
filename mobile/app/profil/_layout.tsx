import { Stack } from 'expo-router';

// Ce layout enveloppe tous les écrans /app/profil/*
// Chaque écran gère son propre header via Stack.Screen options
export default function ProfilLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]"         />
      <Stack.Screen name="edit"          />
      <Stack.Screen name="mes-annonces"  />
      <Stack.Screen name="favoris"       />
      <Stack.Screen name="telephone"     />
      <Stack.Screen name="alertes"       />
      <Stack.Screen name="abonnement"    />
      <Stack.Screen name="confidentialite" />
      <Stack.Screen name="aide"          />
    </Stack>
  );
}
