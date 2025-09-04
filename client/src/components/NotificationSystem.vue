<template>
    <div class="notification-system">
        <TransitionGroup name="notification">
            <div v-for="notification in notifications" :key="notification.id"
                :class="['notification', `notification-${notification.type}`]"
                @click="removeNotification(notification.id)">
                <div class="notification-icon">
                    {{ getIcon(notification.type) }}
                </div>
                <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                </div>
                <button v-if="notification.action" @click.stop="notification.action.callback"
                    class="notification-action">
                    {{ notification.action.label }}
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../stores/chatStore.js';
import { storeToRefs } from 'pinia';

const chatStore = useChatStore();
const { notifications } = storeToRefs(chatStore);
const { removeNotification } = chatStore;

const getIcon = (type) => {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
};
</script>

<style scoped>
.notification-system {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
}

.notification {
    background: var(--bg-color-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
}

.notification:hover {
    transform: translateX(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.notification-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
}

.notification-success .notification-icon {
    background: #10b981;
    color: white;
}

.notification-error .notification-icon {
    background: #ef4444;
    color: white;
}

.notification-warning .notification-icon {
    background: #f59e0b;
    color: white;
}

.notification-info .notification-icon {
    background: #3b82f6;
    color: white;
}

.notification-content {
    flex: 1;
}

.notification-title {
    font-weight: 600;
    margin-bottom: 2px;
    color: var(--text-color-primary);
}

.notification-message {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
}

.notification-action {
    padding: 6px 12px;
    background: var(--btn-bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
    color: var(--text-color-primary);
}

.notification-action:hover {
    background: var(--btn-hover-bg-color);
}

.notification-enter-active,
.notification-leave-active {
    transition: all 0.3s ease;
}

.notification-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.notification-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

@media (max-width: 768px) {
    .notification-system {
        left: 20px;
        right: 20px;
        max-width: none;
    }
}
</style>