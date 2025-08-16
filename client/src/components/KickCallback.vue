<template>
  <div class="text-white text-center mt-8">
    Autenticando com Kick...
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const code = route.query.code;
  const returnedState = route.query.state;
  const storedState = localStorage.getItem('kick_state');
  const codeVerifier = localStorage.getItem('kick_code_verifier');

  if (!code || !returnedState || returnedState !== storedState) {
    console.error('Estado inválido ou código ausente');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state: returnedState,
        sessionState: storedState,
        codeVerifier
      })
    });

    const tokens = await res.json();
    console.log('Tokens recebidos:', tokens);

    localStorage.setItem('kick_access_token', tokens.access_token);

    router.push('/');
  } catch (err) {
    console.error('Erro ao obter o token:', err);
  }
});
</script>
