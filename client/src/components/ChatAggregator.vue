<template>
    <div class="flex flex-col items-center gap-4 my-4">
        <!-- Inputs para Kick e Twitch -->
        <div class="flex gap-4">
            <input
                type="text"
                v-model="kick"
                placeholder="Kick"
                class="w-48 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
            <input
                type="text"
                v-model="twitch"
                placeholder="Twitch"
                class="w-48 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
        </div>

        <!-- Botões -->
        <div class="flex gap-4">
            <button @click="connectSocket" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Conectar ao Agregador
            </button>
            <button @click="disconnectSocket" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                Desconectar
            </button>
        </div>
    </div>
</template>

<script setup>

</script>
