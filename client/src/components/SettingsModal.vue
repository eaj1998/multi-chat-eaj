<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Configurações</h2>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Tema -->
        <div class="setting-group">
          <label class="setting-label">
            <span>Tema Escuro</span>
            <input type="checkbox" v-model="isDarkMode" @change="toggleTheme" />
          </label>
        </div>      
        <!-- Limpar chat -->
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
const fontSize = ref('medium');
const soundEnabled = ref(true);
const autoScroll = ref(true);

onMounted(() => {
  isDarkMode.value = localStorage.getItem('darkMode') === 'true';
  fontSize.value = localStorage.getItem('fontSize') || 'medium';
  soundEnabled.value = localStorage.getItem('soundEnabled') !== 'false';
  autoScroll.value = localStorage.getItem('autoScroll') !== 'false';

  if (isDarkMode.value) {
    document.body.classList.add('theme-dark');
  }
});

const toggleTheme = () => {
  document.body.classList.toggle('theme-dark');
  localStorage.setItem('darkMode', isDarkMode.value);
};

const updateFontSize = () => {
  document.documentElement.style.setProperty('--chat-font-size',
    fontSize.value === 'small' ? '0.8rem' :
      fontSize.value === 'large' ? '1rem' : '0.9rem'
  );
  localStorage.setItem('fontSize', fontSize.value);
};

const toggleSound = () => {
  localStorage.setItem('soundEnabled', soundEnabled.value);
};

const toggleAutoScroll = () => {
  localStorage.setItem('autoScroll', autoScroll.value);
};

const handleClearChat = () => {
  if (confirm('Tem certeza que deseja limpar todo o chat?')) {
    chatStore.clearMessages();
    emit('close');
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.setting-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.setting-label select {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg-color);
  color: var(--text-color-primary);
  cursor: pointer;
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