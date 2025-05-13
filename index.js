import express from 'express';
import cors from 'cors';
import jayson from 'jayson';
import fetch from 'node-fetch';
import dotenv from 'dotenv'; // Import dotenv
import { postAsCharacter } from './ai-agent.js';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// FileMaker Data API configuration
const PAGE_ID = process.env.PAGE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Enable CORS for your frontend's origin
app.use(cors({ origin: 'https://wizardy-ai-mcp.vercel.app:443' }));

// Middleware to parse JSON bodies
app.use(express.json());

// Health-check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/ai-post', async (req, res) => {
  const { topicId, charId } = req.body;

  try {
    const draft = await postAsCharacter(topicId, charId);
    res.json({ message: draft });
  } catch (error) {
    console.error('Error posting as character:', error);
    res.status(500).json({ message: 'Failed to post as character' });
  }
});

// JSON-RPC server
const rpc = new jayson.Server({
  'tools/list': () => [
    { name: 'postToPage', params: { message: 'string' } }
  ],

  postToPage: async ({ message }) => {
    const url = new URL(`https://graph.facebook.com/v22.0/${PAGE_ID}/feed`);
    url.searchParams.set('message', message);
    url.searchParams.set('access_token', ACCESS_TOKEN);

    const response = await fetch(url, { method: 'POST' });
    const result   = await response.json();

    if (result.error) {
      // any thrown error becomes a JSON-RPC error
      throw new Error(result.error.message);
    }
    return { postId: result.id };
  }
});

// Mount the JSON-RPC endpoint
app.post('/jsonrpc', (req, res) => {
  rpc.call(req.body, (err, response) => {
    if (err) {
      return res.json({
        jsonrpc: '2.0',
        error: { code: -32000, message: err.message },
        id: req.body.id || null
      });
    }
    res.json(response);
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello, World! Express + jayson JSON-RPC with FileMaker integration.');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
