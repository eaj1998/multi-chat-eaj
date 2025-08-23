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

const apiUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

function connectSocket() {
  if (socket.value) {
    socket.value.disconnect();
  }
  messages.value = []; 
  isConnecting.value = true;

  socket.value = io(apiUrl, { transports: ['websocket'] });

  socket.value.on('connect', () => {
    console.log('✅ Conectado ao servidor');
    isConnecting.value = false;
    
    if (kickChannel.value) {
      socket.value.emit('join-kick', { username: kickChannel.value });
      isKickConnected.value = true;
    }
    if (twitchChannel.value) {
      socket.value.emit('join-twitch', { username: twitchChannel.value });
      isTwitchConnected.value = true;
    }
  });

  socket.value.on('disconnect', () => {
    console.log('❌ Desconectado do servidor');
    isKickConnected.value = false;
    isTwitchConnected.value = false;
    isConnecting.value = false;
  });

  socket.value.on('channel-badges', (badges) => {
    channelBadges.value = badges;
  });

  socket.value.on('chat-message', (msg) => {
    messages.value.push({ id: msg.id, type: 'chat', data: msg });
  });

  socket.value.on('alert-message', (msg) => {
    messages.value.push({ id: msg.id, type: 'alert', data: msg });
  });
}

function disconnectSocket() {
  if (socket.value) {
    socket.value.disconnect();
    messages.value = [];
    kickChannel.value = '';
    twitchChannel.value = '';
  }
}

export function useChatStore() {
  return {
    messages: readonly(messages),
    channelBadges: readonly(channelBadges),
    isConnecting: readonly(isConnecting),
    isKickConnected: readonly(isKickConnected),
    isTwitchConnected: readonly(isTwitchConnected),

    kickChannel,
    twitchChannel,

    connectSocket,
    disconnectSocket,
  };
}