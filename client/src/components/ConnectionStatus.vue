<template>
    <div class="connection-status">
        <div v-if="isKickConnected" class="status-badge status-kick" :title="`Kick: ${kickChannel}`">
            <span class="status-dot"></span>
            Kick
        </div>

        <div v-if="isTwitchConnected" class="status-badge status-twitch" :title="`Twitch: ${twitchChannel}`">
            <span class="status-dot"></span>
            Twitch
        </div>

        <div v-if="!isKickConnected && !isTwitchConnected && isConnecting" class="status-badge status-connecting">
            <span class="status-dot status-dot-pulse"></span>
            Conectando...
        </div>

        <div v-if="!isKickConnected && !isTwitchConnected && !isConnecting" class="status-badge status-disconnected">
            <span class="status-dot"></span>
            Desconectado
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useChatStore } from '../stores/chatStore.js';

const chatStore = useChatStore();

const isKickConnected = computed(() => chatStore.isKickConnected);
console.log('ISCONNECTED:', isKickConnected);

const isTwitchConnected = computed(() => chatStore.isTwitchConnected);
const kickChannel = computed(() => chatStore.kickChannel);
const twitchChannel = computed(() => chatStore.twitchChannel);
const isConnecting = computed(() => chatStore.isConnecting);
</script>

<style scoped>
.connection-status {
    display: flex;
    gap: 6px;
    align-items: center;
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.status-kick {
    background: rgba(83, 252, 24, 0.1);
    color: #53fc18;
    border: 1px solid rgba(83, 252, 24, 0.3);
}

.status-kick .status-dot {
    background: #53fc18;
    box-shadow: 0 0 4px #53fc18;
}

.status-twitch {
    background: rgba(169, 112, 255, 0.1);
    color: #a970ff;
    border: 1px solid rgba(169, 112, 255, 0.3);
}

.status-twitch .status-dot {
    background: #a970ff;
    box-shadow: 0 0 4px #a970ff;
}

.status-connecting {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
}

.status-connecting .status-dot {
    background: #fbbf24;
}

.status-disconnected {
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
    border: 1px solid rgba(107, 114, 128, 0.3);
}

.status-disconnected .status-dot {
    background: #6b7280;
}

.status-dot-pulse {
    animation: pulse 1s infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

@media (max-width: 768px) {
    .connection-status {
        width: 100%;
        justify-content: center;
        margin-top: 8px;
    }

    .status-badge {
        padding: 2px 6px;
        font-size: 0.7rem;
    }

    .status-dot {
        width: 6px;
        height: 6px;
    }
}
</style>