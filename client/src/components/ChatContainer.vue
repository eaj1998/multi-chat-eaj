<template>
    <div class="chat-wrapper">
        <ChatStream :messages="messages" :isDarkMode="isDarkMode" :channelBadges="channelBadges" :kickUsername="kickChannel"  :twitchUsername="twitchChannel"/>
    </div>
</template>

<script setup>
import { useChatStore } from '../stores/chatStore.js';
import ChatStream from './ChatStream.vue';
import { ref } from 'vue';

const { messages, channelBadges, kickChannel,
    twitchChannel, } = useChatStore();

const isDarkMode = ref(false); 
</script>

<style scoped>
.chat-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}
</style>