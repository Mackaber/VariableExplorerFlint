const { WebSocketServer } = require('ws');
const { createClient } = require('redis');

const wsPort = 3001;

const redisClient = createClient();
const redisSubscriber = createClient(); // separate client for pub/sub

redisClient.connect();
redisSubscriber.connect();

const wss = new WebSocketServer({ port: wsPort });

console.log(`WebSocket server running at ws://localhost:${wsPort}`);

// When a client connects
wss.on('connection', (ws) => {
  console.log('WebSocket client connected.');

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === 'set') {
        await redisClient.set(parsed.key, JSON.stringify(parsed.value));
        await redisClient.publish('redis_changes', JSON.stringify({ type: 'update', key: parsed.key, value: parsed.value }));
      }
      else if (parsed.type === 'delete') {
        await redisClient.del(parsed.key);
        await redisClient.publish('redis_changes', JSON.stringify({ type: 'delete', key: parsed.key }));
      }
      else if (parsed.type === 'request_full_state') {
        const keys = await redisClient.keys('state:*');
        const result = {};

        for (const key of keys) {
          const cleanKey = key.split(':', 2)[1];  // remove "state:" prefix
          const type = await redisClient.type(key);
        
          if (type === 'string') {
            const value = await redisClient.get(key);
            try {
              result[cleanKey] = JSON.parse(value);
            } catch {
              result[cleanKey] = value;
            }
          } else if (type === 'hash') {
            const value = await redisClient.hGetAll(key);
            result[cleanKey] = value;
          } else {
            result[cleanKey] = `[unsupported type: ${type}]`;
          }
        }

        ws.send(JSON.stringify({
          type: 'full_state',
          data: result
        }));
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });
});

// Redis pub/sub: broadcast updates
(async () => {
  await redisSubscriber.subscribe('redis_changes', async (message) => {
    console.log(`Received Redis pub/sub message: ${message}`);
  
    let parsed;
  
    try {
      parsed = JSON.parse(message);
    } catch (err) {
      parsed = message;
    }
  
    let updateMessage;
  
    if (typeof parsed === 'object') {
      // Already structured correctly
      updateMessage = parsed;
    } else if (typeof parsed === 'string') {
      if (parsed.startsWith('set:')) {
        const key = parsed.slice(4);
        const value = await redisClient.get(`state:${key}`);
        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }
        updateMessage = {
          type: 'update',
          key: key,
          value: parsedValue
        };
      } else if (parsed.startsWith('delete:')) {
        const key = parsed.slice(7);
        updateMessage = {
          type: 'delete',
          key: key
        };
      } else {
        console.warn('Unknown raw pubsub message:', parsed);
        return; // Ignore
      }
    }
  
    const data = JSON.stringify(updateMessage);
  
    // Now broadcast the full update to WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    });
  });
})();
