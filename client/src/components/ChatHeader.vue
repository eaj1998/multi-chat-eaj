<template>
  <div class="chat-header">
    <span class="tag kick">
      Kick: {{ kickUsername }}
    </span>
    <span class="tag twitch">
      Twitch: {{ twitchUsername }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  kickConnected: Boolean,
  twitchConnected: Boolean,
  kickUsername: String,
  twitchUsername: String
});
</script>

<style scoped>
.chat-header {
  padding: 0px 0px;
  font-weight: 700;
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
}

.twitch {
  background-color: #9146FF;
}

.kick {
  background-color: #2CE080;
  color: #000;
}
</style>
