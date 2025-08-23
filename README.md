# Multi-Chat EAJ 🚀

Um agregador de chat em tempo real para múltiplas plataformas de streaming (Twitch e Kick) desenvolvido com Vue.js 3 e Node.js.

## ✨ Funcionalidades

- **Chat em Tempo Real**: Receba mensagens de chat de múltiplas plataformas simultaneamente
- **Multiplataforma**: Suporte para Twitch e Kick
- **Interface Moderna**: Interface limpa e responsiva construída com Vue.js 3 e Tailwind CSS
- **WebSocket**: Comunicação em tempo real via Socket.IO
- **Persistência de Conexões**: Mantém conexões ativas e gerencia reconexões automaticamente
- **Sistema de Alertas**: Notificações visuais para eventos importantes
- **Modal de Configurações**: Troca entre tema dark e light
- **Gerenciamento de Estado**: Estado centralizado com Pinia

## 🏗️ Arquitetura

O projeto é dividido em duas partes principais:

### Frontend (Client)
- **Framework**: Vue.js 3 com Composition API
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **State Management**: Pinia 3
- **Real-time**: Socket.IO Client 4
- **Estrutura**: Componentes modulares e reutilizáveis

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js 4
- **Real-time**: Socket.IO 4
- **APIs**: Integração com Twitch (TMI.js) e Kick
- **WebSocket**: Gerenciamento de conexões WebSocket
- **Autenticação**: Suporte para OpenID Connect e sessões

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
   KICK_CLIENT_ID=seu_client_id_kick
   KICK_CLIENT_SECRET=seu_client_secret_kick
   SESSION_SECRET=chave_secreta_para_sessoes
   ```

   > **Nota**: Para obter o token OAuth da Twitch, visite: https://twitchapps.com/tmi/
   > Para Kick, você precisará criar uma aplicação na plataforma de desenvolvedores

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

3. **Configurações**:
   - Use o modal de configurações para alternar entre tema dark e light

4. **Desconectar**:
   - Clique em "Desconectar" para encerrar todas as conexões

## 🔧 Tecnologias Utilizadas

### Frontend
- **Vue.js 3.5**: Framework JavaScript progressivo com Composition API
- **Vite 7**: Build tool rápida para desenvolvimento
- **Tailwind CSS 3.4**: Framework CSS utilitário
- **Pinia 3**: Gerenciamento de estado moderno para Vue
- **Socket.IO Client 4**: Cliente para comunicação em tempo real

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js 4**: Framework web para Node.js
- **Socket.IO 4**: Biblioteca para aplicações em tempo real
- **TMI.js**: Cliente IRC para Twitch
- **WebSocket**: Protocolo para comunicação bidirecional
- **Axios**: Cliente HTTP
- **CORS**: Middleware para Cross-Origin Resource Sharing
- **Express Session**: Gerenciamento de sessões
- **OpenID Connect**: Autenticação moderna
- **Crypto-js**: Criptografia para segurança

## 📁 Estrutura do Projeto

```
multi-chat-eaj/
├── client/                 # Frontend Vue.js
│   ├── src/
│   │   ├── components/     # Componentes Vue
│   │   │   ├── AppHeader.vue      # Cabeçalho principal da aplicação
│   │   │   ├── ChatHeader.vue     # Cabeçalho do chat
│   │   │   ├── ChatStream.vue     # Componente principal do chat
│   │   │   ├── ChatContainer.vue  # Container das mensagens
│   │   │   ├── ChatMessages.vue   # Lista de mensagens
│   │   │   ├── ChatMessage.vue    # Mensagem individual
│   │   │   ├── AlertMessage.vue   # Sistema de alertas
│   │   │   └── SettingsModal.vue  # Modal de configurações
│   │   ├── stores/         # Gerenciamento de estado
│   │   │   └── chatStore.js       # Store do chat com Pinia
│   │   ├── App.vue         # Componente principal
│   │   ├── main.js         # Ponto de entrada
│   │   └── style.css       # Estilos globais
│   ├── package.json
│   ├── tailwind.config.js  # Configuração do Tailwind
│   └── vite.config.js      # Configuração do Vite
├── server/                 # Backend Node.js
│   ├── server.js           # Servidor principal
│   ├── indexKick.js        # Lógica específica do Kick
│   └── package.json
├── public/                 # Arquivos estáticos
└── README.md
```

## 🔌 APIs e Integrações

### Twitch
- **Cliente**: TMI.js (cliente IRC)
- **Autenticação**: OAuth Token
- **Funcionalidades**: Chat em tempo real, mensagens, emotes
- **Dependências**: @mkody/twitch-emoticons

### Kick
- **Cliente**: WebSocket nativo (ws)
- **API**: REST API oficial via axios
- **Autenticação**: OAuth 2.0 com kick-auth
- **Funcionalidades**: Chat em tempo real, mensagens



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

- **AppHeader**: Cabeçalho principal com navegação e configurações
- **ChatStream**: Componente principal que gerencia o fluxo de chat
- **ChatHeader**: Cabeçalho com informações de conexão
- **ChatContainer**: Container responsivo para as mensagens
- **ChatMessages**: Lista de mensagens do chat com scroll virtual
- **ChatMessage**: Mensagem individual do chat com formatação
- **AlertMessage**: Sistema de notificações e alertas
- **SettingsModal**: Modal para alternar entre tema dark e light

### Gerenciamento de Estado

O projeto utiliza **Pinia** para gerenciamento de estado centralizado:
- **chatStore**: Gerencia estado do chat, conexões e mensagens
- Estado reativo para todas as funcionalidades em tempo real
- Ações para conectar/desconectar de canais
- Getters para filtrar e processar mensagens

## 🔒 Segurança

- **Sessões**: Gerenciamento seguro de sessões com express-session
- **Criptografia**: Uso de crypto-js para operações criptográficas
- **CORS**: Configuração adequada para Cross-Origin Resource Sharing
- **Autenticação**: Suporte para OpenID Connect
- **Variáveis de Ambiente**: Configurações sensíveis em arquivos .env

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use Vue.js 3 Composition API
- Siga as convenções do ESLint e Prettier
- Mantenha componentes pequenos e focados
- Use TypeScript para novos arquivos (quando possível)
- Documente funções complexas

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**EAJ** - Desenvolvedor do projeto Multi-Chat

## 🙏 Agradecimentos

- Comunidade Vue.js
- Comunidade Node.js
- Plataformas de streaming (Twitch, Kick)
- Contribuidores e testadores
- Bibliotecas open-source utilizadas

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. **Verificação de Ambiente**:
   - Certifique-se de que todas as variáveis de ambiente estão configuradas
   - Verifique se as portas 3000 e 5173 estão disponíveis
   - Confirme que Node.js 18+ está instalado

2. **Logs e Debugging**:
   - Verifique os logs do console para mensagens de erro
   - Use as ferramentas de desenvolvedor do navegador
   - Monitore o terminal do servidor para erros de backend

3. **Problemas Comuns**:
   - **Conexão falha**: Verifique tokens OAuth e credenciais
   - **Chat não carrega**: Confirme se os canais existem e estão online
   - **Erro de CORS**: Verifique configurações do servidor

4. **Ajuda Adicional**:
   - Abra uma issue no repositório
   - Consulte a documentação das APIs (Twitch, Kick)
   - Verifique se há atualizações das dependências

## 🚀 Roadmap

### Versões Futuras

- [ ] Sistema de notificações push
- [x] Temas personalizáveis (dark/light)
- [ ] Histórico de mensagens
- [ ] Exportação de dados
- [ ] Integração com mais plataformas
- [ ] Modo offline com cache
- [ ] PWA (Progressive Web App)

---

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**

**🔗 Links Úteis:**
- [Vue.js Documentation](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.IO](https://socket.io/)
- [Twitch Developer Portal](https://dev.twitch.tv/)
- [Kick Developer Documentation](https://docs.kick.com/) 