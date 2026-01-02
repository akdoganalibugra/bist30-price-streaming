import { io, Socket } from 'socket.io-client';

interface PriceUpdate {
  symbol: string;
  open: number;
  close: number;
  high: number;
  low: number;
  dataTimestamp: string;
}

interface BroadcastMessage {
  timestamp: string;
  data: PriceUpdate[];
}

const WS_URL = process.env.SOCKET_CLIENT_WS_URL || 'ws://localhost:3001';

let socket: Socket;
let messageCount = 0;

function connect(): void {
  console.log(`\n🔌 Connecting to Socket Server: ${WS_URL}\n`);

  socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('✅ Connected to Socket Server\n');
    console.log('Waiting for price updates...\n');
  });

  socket.on('prices', (message: BroadcastMessage) => {
    messageCount++;
    displayPrices(message);
  });

  socket.on('disconnect', (reason: string) => {
    console.log(`\n❌ Disconnected from Socket Server: ${reason}\n`);
  });

  socket.on('connect_error', (err: Error) => {
    console.error(`\n⚠️  Connection error: ${err.message}`);
    console.log('Retrying...\n');
  });

  socket.on('reconnect', (attemptNumber: number) => {
    console.log(`\n🔄 Reconnected after ${attemptNumber} attempts\n`);
  });
}

function displayPrices(message: BroadcastMessage): void {
  // Clear console for clean display
  console.clear();

  // Header
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('   📊 BIST30 Real-Time Price Streaming Platform');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`   Broadcast Time: ${new Date(message.timestamp).toLocaleString()}`);
  console.log(`   Messages Received: ${messageCount}`);
  console.log(`   Symbols: ${message.data.length}`);
  console.log('───────────────────────────────────────────────────────────────────────\n');

  // Prepare table data
  const tableData = message.data
    .map((price) => {
      const changePercent = ((price.close - price.open) / price.open) * 100;
      const changeSymbol = changePercent >= 0 ? '📈' : '📉';

      return {
        Symbol: price.symbol,
        Open: price.open.toFixed(2),
        Close: price.close.toFixed(2),
        High: price.high.toFixed(2),
        Low: price.low.toFixed(2),
        'Change %': `${changeSymbol} ${changePercent.toFixed(2)}%`,
        Time: new Date(price.dataTimestamp).toLocaleTimeString(),
      };
    })
    .sort((a, b) => a.Symbol.localeCompare(b.Symbol)); // Sort by symbol

  // Display table
  console.table(tableData);

  // Footer
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log('   Press Ctrl+C to exit');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Disconnecting...\n');
  if (socket) {
    socket.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down...\n');
  if (socket) {
    socket.disconnect();
  }
  process.exit(0);
});

// Start connection
connect();
