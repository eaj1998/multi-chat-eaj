<template>
  <div class="app-wrapper">
    <AppHeader />

    <main class="main-content">
      <ChatContainer />
    </main>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
import ChatContainer from './components/ChatContainer.vue';
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
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.app-wrapper {
  display: flex;
  flex-direction: column; /* Organiza os filhos (header e main) em uma coluna */
  height: 100dvh; /* Ocupa a altura inteira da tela */
}

.sidebar-menu {
  width: 180px;
  flex-shrink: 0;
  transition: transform 0.3s ease-in-out;
}

.main-content {
  flex: 1; /* Faz esta área "esticar" e ocupar todo o espaço vertical restante */
  display: flex; /* Necessário para que o filho (ChatContainer) possa ter height: 100% */
  overflow: hidden; /* Evita que o chat cause uma barra de rolagem na página inteira */
}

.menu-toggle,
.overlay {
  display: none;
}


@media (max-width: 768px) {
  .app-wrapper {
    overflow-x: hidden;
  }

  .sidebar-menu {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
  }

  .app-wrapper.menu-open .sidebar-menu {
    transform: translateX(0);
  }

  .menu-toggle {
    display: block;
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1001;
    background: var(--bg-color-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 1.2rem;
  }

  .app-wrapper.menu-open .overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}
</style>
