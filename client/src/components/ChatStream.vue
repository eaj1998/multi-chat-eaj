<template>
  <div class="chat-stream">
    <ChatHeader :title="props.title" :kickConnected="props.kickConnected" :twitchConnected="props.twitchConnected"
      :kickUsername="props.kickUsername" :twitchUsername="props.twitchUsername" />
    <ChatMessages :messages="props.messages" :isDarkMode="props.isDarkMode" :channelBadges="props.channelBadges"/>
  </div>
</template>

<script setup>
import ChatHeader from './ChatHeader.vue';
import ChatMessages from './ChatMessages.vue';

const props = defineProps({
  messages: Array,
  title: String,
  kickConnected: Boolean,
  twitchConnected: Boolean,
  kickUsername: String,
  twitchUsername: String,
  isDarkMode: Boolean,
  channelBadges: Object,
});
</script>

<style scoped>
.chat-stream {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
}
</style>
