const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const redisClient = createClient(); // defaults to localhost:6379

redisClient.connect().catch(console.error);

// Endpoint to list all keys and values
app.get('/redis-data', async (req, res) => {
  try {
    const keys = await redisClient.keys('*');
    const result = {};

    for (const key of keys) {
      const type = await redisClient.type(key);

      if (type === 'string') {
        const value = await redisClient.get(key);
        result[key] = value;
      } else if (type === 'hash') {
        const value = await redisClient.hGetAll(key);
        result[key] = value;
      } else {
        result[key] = `[unsupported type: ${type}]`;
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to Redis');
  }
});


// Optional: set a new key
app.post('/redis-data', async (req, res) => {
  try {
    const { key, value } = req.body;
    await redisClient.set(key, value);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error setting Redis key');
  }
});

// Optional: delete a key
app.delete('/redis-data/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await redisClient.del(key);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting Redis key');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
