<script setup>
// (código Vue permanece inalterado do seu script setup original)
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Chat Aggregator</h1>
      <div v-if="accessToken">
        <span v-if="user">Logado como: <strong>{{ user.username }}</strong></span>
        <button @click="logout">Logout</button>
      </div>
      <div v-else>
        <button @click="login">Login com Kick (Chat Privado)</button>
      </div>
    </header>

    <main class="main">
      <!-- Conectar Canais -->
      <section class="channel-form">
        <h2>Conectar a Canais Públicos</h2>
        <div class="channel-inputs">
          <div>
            <label for="twitch-channel">Twitch</label>
            <input v-model="twitchInput" @keyup.enter="updateChannels" id="twitch-channel" type="text" placeholder="ex: gaules" />
          </div>
          <div>
            <label for="kick-channel">Kick</label>
            <input v-model="kickInput" @keyup.enter="updateChannels" id="kick-channel" type="text" placeholder="ex: coringa" />
          </div>
          <div>
            <label for="youtube-channel">YouTube ID</label>
            <input v-model="youtubeInput" @keyup.enter="updateChannels" id="youtube-channel" type="text" placeholder="ex: UC..." />
          </div>
          <button @click="updateChannels">Conectar</button>
        </div>
      </section>

      <!-- Tabs -->
      <div class="tabs">
        <button :class="{ active: activeTab === 'public' }" @click="activeTab = 'public'">Chat Agregado</button>
        <button v-if="accessToken" :class="{ active: activeTab === 'private' }" @click="activeTab = 'private'">Chat Privado</button>
      </div>

      <!-- Chat Container -->
      <section class="chat-container">
        <div v-show="activeTab === 'public'" class="chat-box">
          <div class="monitoring">
            Monitorando:
            <span v-if="connectedChannels.twitch">Twitch: {{ connectedChannels.twitch }}</span>
            <span v-if="connectedChannels.kick">Kick: {{ connectedChannels.kick }}</span>
            <span v-if="connectedChannels.youtube">YouTube: {{ connectedChannels.youtube }}</span>
            <span v-if="!connectedChannels.twitch && !connectedChannels.kick && !connectedChannels.youtube">Nenhum canal conectado.</span>
          </div>
          <ul class="messages">
            <li v-if="publicMessages.length === 0" class="no-msgs">Insira os canais acima e clique em "Conectar" para ver as mensagens.</li>
            <li v-for="(msg, index) in publicMessages" :key="index">
              <span class="platform" :class="msg.platform">{{ msg.platform }}</span>
              <span v-if="msg.platform !== 'system'">{{ msg.username }}:</span>
              <span>{{ msg.message }}</span>
            </li>
          </ul>
        </div>

        <div v-if="accessToken" v-show="activeTab === 'private'" class="chat-box">
          <ul class="messages">
            <li v-if="privateMessages.length === 0" class="no-msgs">Aguardando mensagens no seu canal privado...</li>
            <li v-for="msg in privateMessages" :key="msg.id">
              <span>{{ msg.username }}:</span>
              <span>{{ msg.content }}</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app {
  font-family: sans-serif;
  background-color: #111;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #222;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header button {
  background-color: #e11d48;
  border: none;
  padding: 0.5rem 1rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  border-radius: 5px;
}

.header button:hover {
  background-color: #be123c;
}

.main {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.channel-form {
  background: #1f1f1f;
  padding: 1rem;
  border-radius: 8px;
}

.channel-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.channel-inputs input {
  padding: 0.5rem;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
}

.channel-inputs button {
  padding: 0.5rem 1rem;
  background: #22c55e;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.channel-inputs button:hover {
  background: #16a34a;
}

.tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #444;
}

.tabs button {
  background: none;
  border: none;
  padding: 0.5rem;
  color: #aaa;
  cursor: pointer;
}

.tabs button.active {
  border-bottom: 2px solid #22c55e;
  color: #22c55e;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1f1f1f;
  border-radius: 8px;
  overflow: hidden;
}

.chat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem;
}

.monitoring {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #ccc;
}

.messages {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
}

.messages li {
  animation: fadeIn 0.3s ease-out;
}

.platform {
  font-weight: bold;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 5px;
}

.platform.twitch { background: rebeccapurple; color: white; }
.platform.youtube { background: red; color: white; }
.platform.kick { background: green; color: white; }
.platform.system { background: blue; color: white; }

.no-msgs {
  text-align: center;
  color: #888;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
