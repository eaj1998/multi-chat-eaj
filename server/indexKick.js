// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const http = require('http');
const axios = require('axios');
const WebSocket = require('ws');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

// --- CONFIGURATION ---
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const KICK_SCOPES = process.env.KICK_SCOPES || 'user:read chat:read';
const SESSION_SECRET = process.env.SESSION_SECRET;
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

// --- MIDDLEWARE ---
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- HELPER FUNCTIONS for PKCE ---
function base64URLEncode(str) {
    return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

// --- AUTHENTICATION ROUTES ---

// 1. Login Route
app.get('/auth/login', (req, res) => {
    if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET || !REDIRECT_URI || !SESSION_SECRET) {
        return res.status(500).send('<h1>Configuration Error</h1><p>Server is missing required environment variables.</p>');
    }
    const state = base64URLEncode(crypto.randomBytes(16));
    const code_verifier = base64URLEncode(crypto.randomBytes(32));
    req.session.state = state;
    req.session.code_verifier = code_verifier;
    const code_challenge = base64URLEncode(sha256(Buffer.from(code_verifier)));
    const authUrl = new URL('https://api.kick.com/public/v1/oauth/authorize');
    authUrl.searchParams.append('client_id', KICK_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', KICK_SCOPES);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', code_challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    res.redirect(authUrl.toString());
});

// 2. Callback Route
app.get('/auth/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!state || state !== req.session.state) {
        return res.status(400).send('Invalid state parameter. Aborting for security.');
    }
    const code_verifier = req.session.code_verifier;

    try {
        // *** THIS IS THE UPDATED PART ***
        // We are now sending the data as 'application/x-www-form-urlencoded'
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('client_id', KICK_CLIENT_ID);
        params.append('client_secret', KICK_CLIENT_SECRET);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('code_verifier', code_verifier);

        const tokenResponse = await axios.post('https://api.kick.com/public/v1/oauth/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });
        // *** END OF UPDATED PART ***

        req.session.access_token = tokenResponse.data.access_token;
        req.session.refresh_token = tokenResponse.data.refresh_token;
        req.session.expires_in = tokenResponse.data.expires_in;
        res.send(`<h1>Login Successful!</h1><p>You can now make authenticated API requests.</p><pre>${JSON.stringify(tokenResponse.data, null, 2)}</pre>`);

    } catch (error) {
        // This log is very important for debugging on Render
        console.error('Error exchanging token:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to get access token from Kick. Check the server logs on Render for more details.');
    }
});

// --- ANONYMOUS CHAT VIEWER ROUTE (from before) ---
app.get('/chat/:channelName', async (req, res) => {
    // This code remains the same as before...
    const channelName = req.params.channelName;
    console.log(`[Server] Client connected for channel: ${channelName}`);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    let chatroomId;
    let ws;
    try {
        const browserHeaders = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Accept-Language': 'en-US' };
        const response = await axios.get(`https://kick.com/api/v2/channels/${channelName}`, { headers: browserHeaders });
        chatroomId = response.data.chatroom.id;
        console.log(`[Server] Found chatroom ID for ${channelName}: ${chatroomId}`);
    } catch (error) {
        const status = error.response ? error.response.status : 'N/A';
        console.error(`[Server] Error fetching channel ID for ${channelName}: Status ${status}`);
        res.write(`data: ${JSON.stringify({ type: 'error', message: `Channel not found or API error (Status: ${status}).` })}\n\n`);
        res.end();
        return;
    }
    ws = new WebSocket('wss://ws-us-1.pusher.com/app/E63515B324E26A17E68C?protocol=7&client=js&version=7.6.0&flash=false');
    ws.on('open', () => {
        console.log(`[WebSocket] Connection opened for chatroom ${chatroomId}`);
        ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth: '', channel: `chatroom.${chatroomId}` } }));
    });
    ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.event === 'App\\Events\\ChatMessageEvent') {
            const chatData = JSON.parse(message.data);
            const simplifiedMessage = { type: 'message', sender: { username: chatData.sender.username, identity: chatData.sender.identity }, content: chatData.content, timestamp: chatData.created_at };
            res.write(`data: ${JSON.stringify(simplifiedMessage)}\n\n`);
        } else if (message.event === 'pusher:subscription_succeeded') {
            console.log(`[WebSocket] Successfully subscribed to channel: ${message.channel}`);
            res.write(`data: ${JSON.stringify({ type: 'info', message: 'Successfully connected to chat.' })}\n\n`);
        }
    });
    ws.on('close', () => { console.log('[WebSocket] Connection closed.'); res.end(); });
    ws.on('error', (error) => { console.error('[WebSocket] Error:', error); res.write(`data: ${JSON.stringify({ type: 'error', message: 'WebSocket connection error.' })}\n\n`); res.end(); });
    req.on('close', () => { console.log(`[Server] Client disconnected from channel: ${channelName}`); if (ws) { ws.close(); } });
});

// --- START THE SERVER ---
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
