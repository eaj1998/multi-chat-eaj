import { ref, readonly } from 'vue';
import { io } from 'socket.io-client';

const messages = ref([]);
const kickChannel = ref('');
const twitchChannel = ref('');
const isConnecting = ref(false);
const isKickConnected = ref(false);
const isTwitchConnected = ref(false);
const channelBadges = ref({});
const socket = ref(null);
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const notifications = ref([]);
const connectionStatus = ref({
  twitch: 'disconnected', // disconnected, connecting, connected, error, reconnecting
  kick: 'disconnected'
});
const lastError = ref(null);

const apiUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

if (isDarkMode.value) {
  document.body.classList.add('theme-dark');
}

function addNotification(type, message, platform = null, duration = 5000, action = null) {
  const notification = {
    id: Date.now() + Math.random(),
    type,
    message,
    platform,
    timestamp: new Date(),
    duration,
    action,
  };
  
  notifications.value.push(notification);
  
  if (!action && duration > 0) {
    setTimeout(() => {
      removeNotification(notification.id);
    }, duration);
  }
  
  return notification.id;
}

function removeNotification(id) {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
}

function clearNotifications() {
  notifications.value = [];
}

function connectSocket() {
  if (socket.value) {
    socket.value.disconnect();
  }
  
  messages.value = [];
  isConnecting.value = true;
  lastError.value = null;
  
  connectionStatus.value.twitch = kickChannel.value ? 'disconnected' : 'disconnected';
  connectionStatus.value.kick = twitchChannel.value ? 'disconnected' : 'disconnected';
  
  addNotification('info', 'Conectando ao servidor...', null, 3000);

  socket.value = io(apiUrl, { 
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000
  });

  // ===============================
  // EVENTOS DE CONEXÃO
  // ===============================
  
  socket.value.on('connect', () => {
    console.log('✅ Conectado ao servidor');
    isConnecting.value = false;
    addNotification('success', '🟢 Conectado ao servidor!', null, 3000);
    
    if (kickChannel.value) {
      connectionStatus.value.kick = 'connecting';
      socket.value.emit('join-kick', { username: kickChannel.value });
    }
    if (twitchChannel.value) {
      connectionStatus.value.twitch = 'connecting';
      socket.value.emit('join-twitch', { username: twitchChannel.value });
    }
  });

  socket.value.on('disconnect', (reason) => {
    console.log('❌ Desconectado do servidor:', reason);
    isKickConnected.value = false;
    isTwitchConnected.value = false;
    isConnecting.value = false;
    
    connectionStatus.value.twitch = 'disconnected';
    connectionStatus.value.kick = 'disconnected';
    
    addNotification('error', `🔴 Desconectado: ${reason}`, null, 5000);
  });

  socket.value.on('connect_error', (error) => {
    console.error('❌ Erro de conexão:', error);
    isConnecting.value = false;
    lastError.value = error;
    
    addNotification('error', `❌ Falha na conexão: ${error.message}`, null, 10000);
  });

  socket.value.on('reconnect', (attemptNumber) => {
    console.log('🔄 Reconectado após', attemptNumber, 'tentativas');
    addNotification('success', `🔄 Reconectado! (${attemptNumber} tentativas)`, null, 3000);
  });

  socket.value.on('reconnecting', (attemptNumber) => {
    console.log('🔄 Tentando reconectar...', attemptNumber);
    addNotification('info', `🔄 Reconectando... (tentativa ${attemptNumber})`, null, 2000);
  });

  socket.value.on('reconnect_error', (error) => {
    console.error('❌ Erro na reconexão:', error);
    addNotification('warning', '⚠️ Erro na reconexão. Tentando novamente...', null, 3000);
  });

  socket.value.on('reconnect_failed', () => {
    console.error('❌ Falha na reconexão');
    addNotification('error', '❌ Reconexão falhou. Verifique sua internet e tente novamente.', null, 0);
  });

  // ===============================
  // EVENTOS DE PLATAFORMA
  // ===============================
  
  socket.value.on('platform-connected', (data) => {
    console.log(`✅ ${data.platform} conectado:`, data.channel);
    
    if (data.platform === 'twitch') {
      isTwitchConnected.value = true;
      connectionStatus.value.twitch = 'connected';
    } else if (data.platform === 'kick') {
      isKickConnected.value = true;
      connectionStatus.value.kick = 'connected';
    }
    
    addNotification('success', `✅ ${data.platform.toUpperCase()} conectado: ${data.channel}`, data.platform, 4000);
  });

  socket.value.on('platform-disconnected', (data) => {
    console.log(`❌ ${data.platform} desconectado:`, data.reason);
    
    if (data.platform === 'twitch') {
      isTwitchConnected.value = false;
      connectionStatus.value.twitch = 'disconnected';
    } else if (data.platform === 'kick') {
      isKickConnected.value = false;
      connectionStatus.value.kick = 'disconnected';
    }
    
    addNotification('warning', `⚠️ ${data.platform.toUpperCase()} desconectado`, data.platform, 4000);
  });

  socket.value.on('platform-reconnecting', (data) => {
    console.log(`🔄 ${data.platform} reconectando...`);
    
    connectionStatus.value[data.platform] = 'reconnecting';
    addNotification('info', `🔄 ${data.platform.toUpperCase()} reconectando...`, data.platform, 3000);
  });

  // ===============================
  // EVENTOS DE ERRO E WARNING
  // ===============================
  
  socket.value.on('connection-error', (data) => {
    console.error(`❌ Erro ${data.platform}:`, data.error);
    
    connectionStatus.value[data.platform] = 'error';
    lastError.value = data;
    
    let message = `❌ ${data.platform.toUpperCase()}: ${data.error}`;
    if (data.willRetry) {
      message += ` (tentativa ${data.attempts}/${data.maxRetries})`;
    }
    
    addNotification('error', message, data.platform, 6000);
  });

  socket.value.on('connection-failed', (data) => {
    console.error(`💥 ${data.platform} falhou definitivamente:`, data.error);
    
    connectionStatus.value[data.platform] = 'error';
    lastError.value = data;
    
    addNotification('error', 
      `💥 ${data.platform.toUpperCase()} falhou: ${data.suggestion}`, 
      data.platform, 
      0
    );
  });

  socket.value.on('connection-recovered', (data) => {
    console.log(`✅ ${data.platform} recuperado:`, data.message);
    
    connectionStatus.value[data.platform] = 'connected';
    addNotification('success', `✅ ${data.platform.toUpperCase()} recuperado!`, data.platform, 4000);
  });

  socket.value.on('warning', (data) => {
    console.warn('⚠️ Warning:', data.message);
    addNotification('warning', `⚠️ ${data.message}`, null, 5000);
  });

  socket.value.on('channel-badges', (badges) => {
    console.log('🏆 Badges recebidos:', badges);
    channelBadges.value = badges;
  });

  socket.value.on('chat-message', (msg) => {
    messages.value.push({ 
      id: msg.id || `${msg.platform}-${Date.now()}-${Math.random()}`, 
      type: 'chat', 
      data: msg 
    });
  });

  socket.value.on('alert-message', (msg) => {
    messages.value.push({ 
      id: msg.id || `${msg.platform}-alert-${Date.now()}-${Math.random()}`, 
      type: 'alert', 
      data: msg 
    });
  });
}

function disconnectSocket() {
  if (socket.value) {
    socket.value.disconnect();
    messages.value = [];
    kickChannel.value = '';
    twitchChannel.value = '';
    connectionStatus.value.twitch = 'disconnected';
    connectionStatus.value.kick = 'disconnected';
    
    addNotification('info', '🔌 Desconectado manualmente', null, 3000);
  }
}

function retryConnection(platform) {
  if (!socket.value || !socket.value.connected) {
    addNotification('error', 'Conecte ao servidor primeiro!', null, 3000);
    return;
  }
  
  const username = platform === 'twitch' ? twitchChannel.value : kickChannel.value;
  if (!username) {
    addNotification('error', `Nome de usuário ${platform} não informado!`, platform, 3000);
    return;
  }
  
  connectionStatus.value[platform] = 'connecting';
  socket.value.emit('retry-connection', { platform, username });
  
  addNotification('info', `🔄 Tentando reconectar ${platform.toUpperCase()}...`, platform, 3000);
}

function clearMessages() {
  messages.value = [];
  // addNotification('info', '🧹 Chat limpo', null, 2000);
}

export function useChatStore() {
  return {
    isDarkMode: readonly(isDarkMode),
    messages: readonly(messages),
    channelBadges: readonly(channelBadges),
    isConnecting: readonly(isConnecting),
    isKickConnected: readonly(isKickConnected),
    isTwitchConnected: readonly(isTwitchConnected),
    notifications: readonly(notifications),
    connectionStatus: readonly(connectionStatus),
    lastError: readonly(lastError),

    kickChannel,
    twitchChannel,

    connectSocket,
    disconnectSocket,
    retryConnection,
    clearMessages,
    
    addNotification,
    removeNotification,
    clearNotifications
  };
}