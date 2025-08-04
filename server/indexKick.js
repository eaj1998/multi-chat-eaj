// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const http = require('http');
const axios = require('axios');
const WebSocket = require('ws');
const path = require('path');
const session = require('express-session'); // For storing session data
const crypto = require('crypto'); // For generating random strings

// --- CONFIGURATION ---
// All configuration is now loaded from the .env file
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const KICK_SCOPES = process.env.KICK_SCOPES || 'user:read chat:read';
const SESSION_SECRET = process.env.SESSION_SECRET;
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

// --- MIDDLEWARE ---
// Session middleware to store state and code_verifier
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- HELPER FUNCTIONS for PKCE ---
// Generates a secure random string
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Hashes the verifier to create the challenge
function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

// --- AUTHENTICATION ROUTES ---

// 1. Login Route: Starts the OAuth process
app.get('/auth/login', (req, res) => {
    // ** ADDED: Configuration check to prevent common errors **
    if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET || !REDIRECT_URI || !SESSION_SECRET) {
        return res.status(500).send('<h1>Configuration Error</h1><p>Server is missing required environment variables. Please check your .env file.</p>');
    }

    // Generate and store the security tokens
    const state = base64URLEncode(crypto.randomBytes(16));
    const code_verifier = base64URLEncode(crypto.randomBytes(32));
    
    req.session.state = state;
    req.session.code_verifier = code_verifier;

    const code_challenge = base64URLEncode(sha256(Buffer.from(code_verifier)));

    // Construct the authorization URL
    const authUrl = new URL('https://api.kick.com/public/v1/oauth/authorize');
    authUrl.searchParams.append('client_id', KICK_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', KICK_SCOPES);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', code_challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Redirect the user to Kick's login page
    res.redirect(authUrl.toString());
});

// 2. Callback Route: Handles the redirect from Kick
app.get('/auth/callback', async (req, res) => {
    const { code, state } = req.query;

    // Security check: ensure the state matches what we stored
    if (!state || state !== req.session.state) {
        return res.status(400).send('Invalid state parameter. Aborting for security.');
    }

    // Retrieve the verifier from the session
    const code_verifier = req.session.code_verifier;

    try {
        // 3. Exchange the authorization code for an access token
        const tokenResponse = await axios.post('https://api.kick.com/public/v1/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            client_id: KICK_CLIENT_ID,
            client_secret: KICK_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code_verifier: code_verifier,
        }, {
            // ** ADDED: User-Agent header to mimic a browser **
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
            }
        });

        // Store the tokens securely in the user's session
        req.session.access_token = tokenResponse.data.access_token;
        req.session.refresh_token = tokenResponse.data.refresh_token;
        req.session.expires_in = tokenResponse.data.expires_in;

        // For demonstration, show the tokens. In a real app, you'd redirect to a profile page.
        res.send(`<h1>Login Successful!</h1><p>You can now make authenticated API requests.</p><pre>${JSON.stringify(tokenResponse.data, null, 2)}</pre>`);

    } catch (error) {
        console.error('Error exchanging token:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to get access token from Kick.');
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
        const browserHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9'
        };
        const response = await axios.get(`https://kick.com/api/v2/channels/${channelName}`, { headers: browserHeaders });
        chatroomId = response.data.chatroom.id;
        console.log(`[Server] Found chatroom ID for ${channelName}: ${chatroomId}`);
    } catch (error) {
        if (error.response) {
             console.error(`[Server] Error fetching channel ID for ${channelName}: Request failed with status code ${error.response.status}`);
             res.write(`data: ${JSON.stringify({ type: 'error', message: `Channel not found or API error (Status: ${error.response.status}).` })}\n\n`);
        } else {
             console.error(`[Server] Error fetching channel ID for ${channelName}:`, error.message);
             res.write(`data: ${JSON.stringify({ type: 'error', message: 'Could not connect to Kick API.' })}\n\n`);
        }
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
    console.log(`Server is running on http://localhost:${PORT}`);
});
