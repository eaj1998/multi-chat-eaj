# Multi-Chat EAJ 🚀

Um agregador de chat em tempo real para múltiplas plataformas de streaming (Twitch, Kick e YouTube) desenvolvido com Vue.js e Node.js.

## ✨ Funcionalidades

- **Chat em Tempo Real**: Receba mensagens de chat de múltiplas plataformas simultaneamente
- **Multiplataforma**: Suporte para Twitch e Kick (YouTube em implementação futura)
- **Interface Moderna**: Interface limpa e responsiva construída com Vue.js e Tailwind CSS
- **WebSocket**: Comunicação em tempo real via Socket.IO
- **Persistência de Conexões**: Mantém conexões ativas e gerencia reconexões automaticamente

## 🏗️ Arquitetura

O projeto é dividido em duas partes principais:

### Frontend (Client)
- **Framework**: Vue.js 3 com Composition API
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Real-time**: Socket.IO Client

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **APIs**: Integração com Twitch (TMI.js) e Kick
- **WebSocket**: Gerenciamento de conexões WebSocket

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta nas plataformas de streaming (Twitch, Kick)

### Configuração do Ambiente

1. **Clone o repositório**
   ```bash
   git clone git@github.com:eaj1998/multi-chat-eaj.git
   cd multi-chat-eaj
   ```

2. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env` na pasta `server/`:
   ```env
   TWITCH_USERNAME=seu_usuario_twitch
   TWITCH_OAUTH_TOKEN=seu_token_oauth_twitch
   ```

   > **Nota**: Para obter o token OAuth da Twitch, visite: https://twitchapps.com/tmi/

3. **Instale as dependências**
   ```bash
   # Instalar dependências do servidor
   cd server
   npm install
   
   # Instalar dependências do cliente
   cd ../client
   npm install
   ```

### Executando o Projeto

1. **Inicie o servidor**
   ```bash
   cd server
   npm run dev
   ```
   O servidor estará rodando em `http://localhost:3000`

2. **Inicie o cliente**
   ```bash
   cd client
   npm run dev
   ```
   O cliente estará rodando em `http://localhost:5173`

3. **Acesse a aplicação**
   Abra seu navegador e acesse `http://localhost:5173`

## 📱 Como Usar

1. **Conectar aos Canais**:
   - Digite o nome do canal Kick no campo "Canal Kick"
   - Digite o nome do canal Twitch no campo "Canal Twitch"
   - Clique em "Conectar"

2. **Visualizar Chat**:
   - As mensagens aparecerão em tempo real
   - Cada plataforma tem uma cor diferente para identificação
   - O chat suporta até 100 mensagens simultâneas

3. **Desconectar**:
   - Clique em "Desconectar" para encerrar todas as conexões

## 🔧 Tecnologias Utilizadas

### Frontend
- **Vue.js 3**: Framework JavaScript progressivo
- **Vite**: Build tool rápida para desenvolvimento
- **Tailwind CSS**: Framework CSS utilitário
- **Pinia**: Gerenciamento de estado
- **Socket.IO Client**: Cliente para comunicação em tempo real

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web para Node.js
- **Socket.IO**: Biblioteca para aplicações em tempo real
- **TMI.js**: Cliente IRC para Twitch
- **WebSocket**: Protocolo para comunicação bidirecional
- **Axios**: Cliente HTTP
- **CORS**: Middleware para Cross-Origin Resource Sharing

## 📁 Estrutura do Projeto

```
multi-chat-eaj/
├── client/                 # Frontend Vue.js
│   ├── src/
│   │   ├── components/     # Componentes Vue
│   │   │   ├── ChatAggregator.vue
│   │   │   ├── ChatHeader.vue
│   │   │   ├── ChatInput.vue
│   │   │   ├── ChatMessage.vue
│   │   │   ├── ChatMessages.vue
│   │   │   ├── ChatStream.vue
│   │   │   └── KickCallback.vue
│   │   ├── App.vue         # Componente principal
│   │   └── main.js         # Ponto de entrada
│   ├── package.json
│   └── vite.config.js
├── server/                 # Backend Node.js
│   ├── server.js           # Servidor principal
│   ├── indexKick.js        # Lógica específica do Kick
│   └── package.json
└── README.md
```

## 🔌 APIs e Integrações

### Twitch
- **Cliente**: TMI.js (cliente IRC)
- **Autenticação**: OAuth Token
- **Funcionalidades**: Chat em tempo real, mensagens

### Kick
- **Cliente**: WebSocket nativo
- **API**: REST API oficial
- **Funcionalidades**: Chat em tempo real, mensagens

### YouTube (Implementação Futura)
- **Status**: Planejado para versões futuras
- **Funcionalidades**: Chat ao vivo (a ser implementado)

## 🚧 Desenvolvimento

### Scripts Disponíveis

**Servidor:**
```bash
npm run dev          # Executa com nodemon para desenvolvimento
```

**Cliente:**
```bash
npm run dev          # Executa servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build de produção
```

### Estrutura dos Componentes

- **ChatStream**: Componente principal que gerencia o fluxo de chat
- **ChatHeader**: Cabeçalho com informações de conexão
- **ChatMessages**: Lista de mensagens do chat
- **ChatMessage**: Mensagem individual do chat
- **ChatInput**: Campos de entrada para canais

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**EAJ** - Desenvolvedor do projeto Multi-Chat

## 🙏 Agradecimentos

- Comunidade Vue.js
- Comunidade Node.js
- Plataformas de streaming (Twitch, Kick)
- Contribuidores e testadores

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Certifique-se de que as portas 3000 e 5173 estão disponíveis
3. Verifique os logs do console para mensagens de erro
4. Abra uma issue no repositório

---

**⭐ Se este projeto foi útil para você, considere dar uma estrela!** 