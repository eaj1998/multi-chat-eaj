<template>
  <header class="app-header">
    <button class="menu-toggle" @click="() => {
      isMobileMenuOpen = !isMobileMenuOpen;
      console.log('menu toggle clicado', isMobileMenuOpen);
    }" :class="{ 'menu-open': isMobileMenuOpen }">
      <span></span>
      <span></span>
      <span></span>
    </button>


    <div class="connection-controls" :class="{ 'mobile-menu-open': isMobileMenuOpen }">
      <button class="close-menu" @click="isMobileMenuOpen = false">
        ✕
      </button>

      <div class="controls-group">
        <input v-model="kickChannel" placeholder="Canal Kick" :disabled="isKickConnected || isTwitchConnected"
          @keyup.enter="handleConnect" />
        <input v-model="twitchChannel" placeholder="Canal Twitch" :disabled="isKickConnected || isTwitchConnected"
          @keyup.enter="handleConnect" />
        <button class="connect-btn" @click="handleConnect"
          :disabled="isKickConnected || isTwitchConnected || isConnecting">
          {{ isConnecting ? 'Conectando...' : 'Conectar' }}
        </button>
        <button class="connect-btn disconnect-btn" @click="handleDisconnect"
          :disabled="!isKickConnected && !isTwitchConnected">
          Desconectar
        </button>
        <button class="settings-btn" @click="toggleSettings" title="Configurações">
          ⚙️
        </button>
      </div>
    </div>

    <div class="header-status">
      <ConnectionStatus />
    </div>

    <div v-if="isMobileMenuOpen" class="menu-overlay" @click="isMobileMenuOpen = false"></div>

    <SettingsModal v-if="isSettingsOpen" @close="isSettingsOpen = false" />
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useChatStore } from '../stores/chatStore.js';
import { storeToRefs } from 'pinia';
import ConnectionStatus from './ConnectionStatus.vue';
import SettingsModal from './SettingsModal.vue';

const chatStore = useChatStore();
const {
  kickChannel,
  twitchChannel,
  isKickConnected,
  isTwitchConnected,
  isConnecting
} = storeToRefs(chatStore);

const { connectSocket, disconnectSocket, addNotification } = chatStore;

const isMobileMenuOpen = ref(false);
const isSettingsOpen = ref(false);

const handleConnect = () => {
  if (!kickChannel.value && !twitchChannel.value) {
    addNotification({
      type: 'warning',
      title: 'Atenção',
      message: 'Digite pelo menos um canal para conectar',
      duration: 3000
    });
    return;
  }

  connectSocket();
  isMobileMenuOpen.value = false;
};

const handleDisconnect = () => {
  disconnectSocket();
  isMobileMenuOpen.value = false;
};

const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value;
  isMobileMenuOpen.value = false;
};
</script>

<style scoped>
.app-header {
  background-color: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 12px 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-toggle {
  display: none;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  z-index: 1002;
  padding: 0;
}

.menu-toggle span {
  display: block !important;
  width: 25px !important;
  height: 3px !important;
  background: var(--text-color-primary);
  margin: 5px 0 !important;
  border: 1px solid var(--text-color-primary) !important;
}


.menu-toggle.menu-open span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.menu-toggle.menu-open span:nth-child(2) {
  opacity: 0;
}

.menu-toggle.menu-open span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

.close-menu {
  display: none;
}

.connection-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.controls-group {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.connection-controls input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg-color);
  color: var(--text-color-primary);
  min-width: 120px;
}

.connect-btn,
.settings-btn {
  padding: 8px 16px;
  background: var(--btn-bg-color);
  color: var(--text-color-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.connect-btn:hover:not(:disabled),
.settings-btn:hover {
  background: var(--btn-hover-bg-color);
}

.connect-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.disconnect-btn {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.disconnect-btn:hover:not(:disabled) {
  background: #dc2626;
}

.header-status {
  margin-left: auto;
}

.menu-overlay {
  display: none;
}

@media (max-width: 768px) {
  .app-header {
    padding: 8px 12px;
  }

  .menu-toggle {
    display: flex !important;    
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .connection-controls {
    position: fixed !important;
    top: 0;
    left: -100%;
    width: 85%;
    max-width: 320px;
    height: 100vh;
    background: var(--bg-color-secondary);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    flex-direction: column;
    padding: 20px;
    transition: left 0.3s ease;
    overflow-y: auto;
    z-index: 9999 !important;
  }

  .connection-controls.mobile-menu-open {
    left: 0;
  }

  .close-menu {
    display: block;
    position: absolute;
    top: 15px;
    right: 15px;
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-color-primary);
    padding: 5px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .controls-group {
    flex-direction: column;
    margin-top: 50px;
    width: 100%;
  }

  .connection-controls input {
    width: 92%;
    min-width: unset;
  }

  .connect-btn,
  .disconnect-btn,
  .settings-btn {
    width: 100%;
  }

  .menu-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .header-status {
    flex: 1;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 380px) {
  .connection-controls {
    width: 90%;
  }

}
</style>
