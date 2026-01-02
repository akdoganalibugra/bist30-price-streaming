import ws from 'k6/ws';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const messagesReceived = new Counter('messages_received');
const broadcastLatency = new Trend('broadcast_latency_ms');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 clients
    { duration: '1m', target: 200 },   // Ramp up to 200 clients
    { duration: '1m', target: 500 },   // Ramp up to 500 clients
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'broadcast_latency_ms': ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
    'messages_received': ['count>0'],
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:3001';

export default function () {
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;

  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      console.log(`VU ${__VU}: Connected to WebSocket`);
      
      // Send Socket.io handshake
      socket.send('40'); // Socket.io connection message
    });

    socket.on('message', (data) => {
      // Socket.io protocol: messages starting with '42' are event messages
      if (typeof data === 'string' && data.startsWith('42')) {
        try {
          // Parse Socket.io message format: 42["event_name", payload]
          const jsonStr = data.substring(2);
          const [eventName, payload] = JSON.parse(jsonStr);
          
          if (eventName === 'prices') {
            messagesReceived.add(1);
            
            // Calculate latency: current time - broadcast timestamp
            const broadcastTime = new Date(payload.timestamp).getTime();
            const receiveTime = Date.now();
            const latency = receiveTime - broadcastTime;
            
            broadcastLatency.add(latency);
            
            // Validate message structure
            check(payload, {
              'has timestamp': (p) => p.timestamp !== undefined,
              'has data array': (p) => Array.isArray(p.data),
              'data not empty': (p) => p.data.length > 0,
              'price has required fields': (p) => {
                const firstPrice = p.data[0];
                return firstPrice.symbol && 
                       typeof firstPrice.open === 'number' &&
                       typeof firstPrice.close === 'number' &&
                       typeof firstPrice.high === 'number' &&
                       typeof firstPrice.low === 'number';
              },
            });
          }
        } catch (e) {
          console.error(`VU ${__VU}: Failed to parse message:`, e.message);
        }
      }
    });

    socket.on('close', () => {
      console.log(`VU ${__VU}: Disconnected from WebSocket`);
    });

    socket.on('error', (e) => {
      console.error(`VU ${__VU}: WebSocket error:`, e);
    });

    // Keep connection open for 60 seconds
    socket.setTimeout(() => {
      socket.close();
    }, 60000);
  });

  check(response, {
    'status is 101': (r) => r && r.status === 101,
  });
}
