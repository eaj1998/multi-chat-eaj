<template>
  <div class="app-wrapper">
    <AppHeader />
    <main class="main-content">
      <ChatContainer />
    </main>
    <NotificationSystem />
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
import ChatContainer from './components/ChatContainer.vue';
import NotificationSystem from './components/NotificationSystem.vue';
</script>

<style>
:root {
  --bg-color-primary: #f0f2f5;
  --bg-color-secondary: #ffffff;
  --text-color-primary: #1c1e21;
  --text-color-secondary: #65676b;
  --border-color: #ced0d4;
  --input-bg-color: #ffffff;
  --btn-bg-color: #e4e6eb;
  --btn-hover-bg-color: #d8dadf;
}

body.theme-dark {
  --bg-color-primary: #18181b;
  --bg-color-secondary: #262626;
  --text-color-primary: #e4e6eb;
  --text-color-secondary: #b0b3b8;
  --border-color: #3e3e42;
  --input-bg-color: #333333;
  --btn-bg-color: #444444;
  --btn-hover-bg-color: #555555;
}

body {
  background-color: var(--bg-color-primary);
  color: var(--text-color-primary);
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
}
</style>