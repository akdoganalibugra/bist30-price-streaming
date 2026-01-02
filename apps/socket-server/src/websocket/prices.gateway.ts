import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, BroadcastMessage } from '@app/common';
import { ConfigService } from '@app/config';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({ cors: true })
export class PricesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('PricesGateway');
  private broadcastInterval: NodeJS.Timeout;
  private readonly intervalMs: number;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.intervalMs = configService.getNumber('BROADCAST_INTERVAL_MS', 500);
  }

  afterInit(server: Server) {
    this.logger.info('WebSocket Gateway initialized', { broadcastInterval: `${this.intervalMs}ms` });

    // Start fixed 500ms broadcast interval
    this.broadcastInterval = setInterval(async () => {
      await this.broadcastPrices();
    }, this.intervalMs);
  }

  handleConnection(client: Socket) {
    this.logger.info('Client connected', { clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.info('Client disconnected', { clientId: client.id });
  }

  private async broadcastPrices(): Promise<void> {
    try {
      const prices = await this.redisService.getAllPrices();

      if (prices.length === 0) {
        this.logger.debug('No prices available to broadcast');
        return;
      }

      const message: BroadcastMessage = {
        timestamp: new Date().toISOString(),
        data: prices,
      };

      // Emit to all connected clients
      this.server.emit('prices', message);

      this.logger.debug('Broadcasted prices', {
        symbolCount: prices.length,
        clientCount: this.server.sockets.sockets.size,
      });
    } catch (error) {
      this.logger.error('Failed to broadcast prices', error);
    }
  }

  onModuleDestroy() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
  }
}
