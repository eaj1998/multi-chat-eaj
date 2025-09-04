<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Configurações</h2>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="setting-group">
          <label class="setting-label">
            <span>Tema Escuro</span>
            <!-- Switch estilizado -->
            <div class="theme-toggle" :class="{ active: isDarkMode }" @click="toggleTheme">
              <div class="toggle-circle"></div>
            </div>
          </label>
        </div>

        <div class="setting-group">
          <button class="clear-chat-btn" @click="handleClearChat">
            Limpar Chat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useChatStore } from '../stores/chatStore.js';

const emit = defineEmits(['close']);
const chatStore = useChatStore();

const isDarkMode = ref(false);

onMounted(() => {
  isDarkMode.value = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode.value) {
    document.body.classList.add('theme-dark');
  }
});

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('theme-dark');
  localStorage.setItem('darkMode', isDarkMode.value);
};

const handleClearChat = () => {
  chatStore.addNotification(
    'warning',
    'Tem certeza que deseja limpar todo o chat?',
    null,
    1,
    {
      label: 'Limpar',
      callback: () => {
        chatStore.clearMessages();

        chatStore.addNotification('success', 'Chat limpo com sucesso!', null, 4000);
      }
    }
  );
};

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-color-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  transition: background 0.3s ease, color 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--text-color-primary);
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: var(--btn-bg-color);
}

.modal-body {
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color-primary);
  font-size: 0.95rem;
}

/* Toggle animado */
.theme-toggle {
  width: 46px;
  height: 24px;
  background: var(--border-color);
  border-radius: 50px;
  padding: 2px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s ease;
}

.theme-toggle .toggle-circle {
  width: 20px;
  height: 20px;
  background: var(--text-color-primary);
  border-radius: 50%;
  position: absolute;
  top: 4px;
  left: 2px;
  transition: all 0.3s ease;
}

.theme-toggle.active {
  background: #4ade80;
}

.theme-toggle.active .toggle-circle {
  left: 26px;
  background: #fff;
}

.clear-chat-btn {
  width: 100%;
  padding: 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-chat-btn:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
}
</style>
