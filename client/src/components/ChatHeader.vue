<template>
  <div class="chat-header">
    <span v-if="twitchConnected" class="tag twitch">
      Twitch: {{ twitchUsername }}
    </span>

    <span v-if="kickConnected" class="tag kick">
      Kick: {{ kickUsername }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  kickConnected: Boolean,
  twitchConnected: Boolean,
  kickUsername: String,
  twitchUsername: String
});
</script>

<style scoped>
.chat-header {
  padding: 12px 16px;
  font-weight: 700;
  background-color: #1f1f23;
  border-bottom: 1px solid #36363a;
  text-align: center;
  font-size: 0.9rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.tag {
  display: inline-block;
  margin-left: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  color: white;
}

.twitch {
  background-color: #9146FF;
}

.kick {
  background-color: #2CE080;
  color: #000;
}
</style>
