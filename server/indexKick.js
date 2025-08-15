const { KickAuthClient } = require('kick-auth');
const express = require('express');
const session = require('express-session');
const path = require('path');
const WebSocket = require('ws');

require('dotenv').config();

let chatSocket = null;

const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

const kickAuth = new KickAuthClient({
    clientId: process.env.KICK_CLIENT_ID,
    clientSecret: process.env.KICK_CLIENT_SECRET,
    redirectUri: process.env.KICK_REDIRECT_URI,
    scopes: ['user:read', 'channel:read']
});

const tokenNeedsRefresh = () => {
    return true;
}

async function refreshTokenMiddleware(req, res, next) {
    try {
        if (!req.session.refreshToken) {
            return res.redirect('/auth/login');
        }

        if (tokenNeedsRefresh()) {
            const tokens = await kickAuth.refreshToken(req.session.refreshToken);

            req.session.accessToken = tokens.access_token;
            req.session.refreshToken = tokens.refresh_token;
        }

        next();
    } catch (error) {
        req.session.destroy(() => {
            res.redirect('/auth/login');
        });
    }
}
// Login route
app.get('/auth/login', async (req, res) => {
    try {
        const { url, state, codeVerifier } = await kickAuth.getAuthorizationUrl();

        req.session.state = state;
        req.session.codeVerifier = codeVerifier;

        res.redirect(url);
    } catch (error) {
        res.status(500).send('Failed to initialize auth flow');
    }
});

app.get('/auth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (state !== req.session.state) {
            return res.status(400).send('Invalid state parameter');
        }

        const tokens = await kickAuth.getAccessToken(
            code,
            req.session.codeVerifier
        );

        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token;

        res.redirect('/chat');
    } catch (error) {
        console.log(error);
        res.status(500).send('Authentication failed');
    }
});

app.get('/auth/logout', async (req, res) => {
    try {
        if (req.session.accessToken) {
            await kickAuth.revokeToken(req.session.accessToken);
        }

        req.session.destroy(() => {
            res.redirect('/');
        });
    } catch (error) {
        res.status(500).send('Logout failed');
    }
});

app.get('/chat', async (req, res) => {
    console.log('Sesssion TOKEN', req.session.accessToken);

    if (!req.session.accessToken) {
        return res.redirect('/auth/login');
    }

    try {
        console.log('--- /chat route handler initiated ---');
        console.log("TOKEN", req.session.accessToken)
        const userResponse = await fetch('https://kick.com/api/v1/users/coringa', {
            headers: {
                'Authorization': `Bearer ${req.session.accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!userResponse.ok) throw new Error(`Step 1 Failed. Status: ${userResponse.status}`);

        const userData = await userResponse.json();

        const userSlug = userData.username;

        const chatroomResponse = await fetch(`https://kick.com/api/v2/channels/coringa/chatroom`);
        
        if (!chatroomResponse.ok) throw new Error(`Step 2 Failed. Status: ${chatroomResponse.status}`);
        const chatroomData = await chatroomResponse.json();
        console.log('RoomDATA', chatroomData)
        const channelId = chatroomData.id;
        const chatAuthToken = chatroomData.token;

        connectToKickChat(channelId, chatAuthToken);

        res.send(`<h1>Connection process initiated for ${userSlug}.</h1><p>The bot is now running in the background. Check your Node.js console.</p>`);

    } catch (error) {
        console.error('Error in /chat route:', error);
        res.status(500).send('Failed to get credentials to connect to chat. See console for details.');
    }
});

function connectToKickChat(channelId, authToken) {
    if (chatSocket) {
        console.log('Closing existing WebSocket connection...');
        chatSocket.close();
    }

    console.log(`Attempting to connect to WebSocket for channel ID: ${channelId}...`);
    const ws = new WebSocket('wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false');

    console.log('chatroom_', channelId);

    ws.on('open', () => {
        console.log('WebSocket connection established! Subscribing to channel...');
        ws.send(JSON.stringify({
            event: 'pusher:subscribe',
            data: {
                // channel: `chatroom_${channelId}`,
                channel: `chatrooms.${channelId}.v2`,
                auth: ''
            }
        }));
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.event === 'pusher:ping') {
                ws.send(JSON.stringify({ event: 'pusher:pong' }));
                return;
            }

            if (message.event === 'pusher:subscription_succeeded') {
                console.log(`Successfully subscribed to channel ${message.channel}!`);
                return;
            }

            if (message.event === 'App\\Events\\ChatMessageEvent') {
                const chatData = JSON.parse(message.data);

                console.log(`[${chatData.sender.username}]: ${chatData.content}`);
            }
        } catch (e) {
            console.error('Failed to parse incoming WebSocket message:', e);
        }
    });

    ws.on('close', (code, reason) => {
        const reasonString = reason ? reason.toString() : 'No reason given';
        console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reasonString}`);
        chatSocket = null; // Clear the socket variable
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });

    // Store the new connection globally
    chatSocket = ws;
}


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});