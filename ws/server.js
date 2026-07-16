const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL;
const client = redis.createClient({ url: REDIS_URL });
client.connect();

const server = http.createServer();
const io = socketIo(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('Client connected');
});

// Listen to Redis alerts
client.subscribe('alerts', (message) => {
    console.log('Alert received:', message);
    io.emit('emergency_broadcast', { alert: message });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`WebSocket running on ${PORT}`);
});
