<template>
  <header class="app-header">
    <div class="brand">
      <ChatHeader :kickConnected="isKickConnected" :twitchConnected="isTwitchConnected" :kickUsername="kickChannel"
        :twitchUsername="twitchChannel" />
    </div>

    <button class="mobile-nav-toggle" @click="toggleMobileMenu">
      <span>☰</span>
    </button>

    <div class="header-actions" :class="{ 'is-open': isMobileMenuOpen }">

      <div class="connection-controls">
        <input v-model="kickChannel" placeholder="Canal Kick" :disabled="isKickConnected || isTwitchConnected" />
        <input v-model="twitchChannel" placeholder="Canal Twitch" :disabled="isKickConnected || isTwitchConnected" />
        <button class="connect-btn" @click="connectSocket" :disabled="isKickConnected || isTwitchConnected">
          {{ isConnecting ? '...' : 'Conectar' }}
        </button>
        <button class="connect-btn" @click="disconnectSocket" :disabled="!isKickConnected && !isTwitchConnected">
          Desconectar
        </button>
        <button class="settings-btn" @click="isModalVisible = true" title="Configurações">
          ⚙️
        </button>
      </div>

      <!-- <nav class="main-nav">
         <ul>
           <li><a href="#" @click="closeMobileMenu">Configurações</a></li>
           <li><a href="#" @click="closeMobileMenu">Canais Salvos</a></li>
           <li><a href="#" @click="closeMobileMenu">Sobre</a></li>
         </ul>
      </nav> -->

    </div>

    <SettingsModal :show="isModalVisible" @close="isModalVisible = false">
      <div class="theme-switcher">
        <div class="theme-label">
          <span>🌙</span>
          <span>Tema escuro</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="isDarkMode">
          <span class="slider"></span>
        </label>
      </div>
    </SettingsModal>
  </header>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue';
import { useChatStore } from '../stores/chatStore.js';
import SettingsModal from './SettingsModal.vue';
import ChatHeader from './ChatHeader.vue';

const isDarkMode = ref(false);


onMounted(() => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode !== null) {
    isDarkMode.value = JSON.parse(savedMode);
  }
  updateBodyTheme(isDarkMode.value);
});

watch(isDarkMode, (newValue) => {
  localStorage.setItem('darkMode', newValue);
  updateBodyTheme(newValue);
});

function updateBodyTheme(isDark) {
  if (isDark) {
    document.body.classList.add('theme-dark');
  } else {
    document.body.classList.remove('theme-dark');
  }
}

const {
  kickChannel,
  twitchChannel,
  isConnecting,
  isKickConnected,
  isTwitchConnected,
  connectSocket,
  disconnectSocket,
} = useChatStore();

const isModalVisible = ref(false);


const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};
</script>

<style scoped>
.theme-switcher {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90%;
  padding: 12px;
  background-color: var(--bg-color-primary);
  border-radius: 8px;
}

.theme-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #5a5a5e;
  border-radius: 28px;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked + .slider {
  background-color: #9146ff;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background-color: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color);
  position: relative; 
  z-index: 10; 
  gap: 24px;
}

.brand {
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 24px;
}

.connection-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connection-controls input {
  width: 150px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color-primary);
  font-size: 0.9rem;
}

.connect-btn,
.settings-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: var(--btn-bg-color);
  color: var(--text-color-primary);
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.connect-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-btn {
  font-size: 1.2rem;
  line-height: 1;
}

.main-nav ul {
  display: flex;
  gap: 20px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.main-nav a {
  color: var(--text-color-secondary);
  text-decoration: none;
  font-weight: 500;
}

.mobile-nav-toggle {
  display: none;
}

@media (max-width: 850px) {
  .mobile-nav-toggle {
    display: block;
    background: none;
    border: none;
    font-size: 1.8rem;
    cursor: pointer;
    color: var(--text-color-primary);
    z-index: 1000;
    order: 3;
    z-index: 1001;
  }

  .header-actions {
    display: none;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px;
    background-color: var(--bg-color-secondary);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .header-actions.is-open {
    display: flex;
  }

  .connection-controls {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .connection-controls input,
  .connection-controls button {
    width: 100%;
    box-sizing: border-box;
  }

  .main-nav {
    border-top: 1px solid var(--border-color);
    padding-top: 10px;
  }

  .main-nav ul {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
}
</style>