# Performance Testing with k6

This directory contains k6 load test scripts for the BIST30 Streaming Platform.

## Prerequisites

Install k6 following the [official documentation](https://k6.io/docs/get-started/installation/):

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Test Scripts

### 1. WebSocket Load Test (`websocket-load.js`)

Tests the WebSocket broadcasting performance with multiple concurrent clients.

**Load Profile:**
- Stage 1: Ramp up to 50 clients (30s)
- Stage 2: Ramp up to 200 clients (1m)
- Stage 3: Ramp up to 500 clients (1m)
- Stage 4: Ramp down to 0 (30s)

**Thresholds:**
- `broadcast_latency_ms`: p95 < 1000ms, p99 < 2000ms
- `messages_received`: count > 0

**Run:**
```bash
# Default (localhost:3001)
k6 run tests/k6/websocket-load.js

# Custom WebSocket URL
WS_URL=ws://your-server:3001 k6 run tests/k6/websocket-load.js

# With results export
k6 run --out json=results.json tests/k6/websocket-load.js
```

### 2. Customer API Load Test (`customer-api-load.js`)

Tests the REST API performance with CRUD operations.

**Load Profile:**
- Stage 1: Ramp up to 20 VUs (30s)
- Stage 2: Ramp up to 50 VUs (1m)
- Stage 3: Ramp up to 100 VUs (1m)
- Stage 4: Ramp down to 0 (30s)

**Thresholds:**
- `http_req_duration`: p95 < 200ms, p99 < 500ms
- `http_req_failed`: rate < 1%

**Operations Tested:**
1. POST /customers (Create)
2. GET /customers (Get All)
3. GET /customers/:uuid (Get One)
4. PATCH /customers/:uuid (Update)
5. DELETE /customers/:uuid (Delete)
6. GET /customers/:uuid (Verify Deletion - 404)

**Run:**
```bash
# Default (localhost:3000)
k6 run tests/k6/customer-api-load.js

# Custom API URL
API_URL=http://your-server:3000 k6 run tests/k6/customer-api-load.js

# With results export
k6 run --out json=results.json tests/k6/customer-api-load.js
```

## Running All Tests

Ensure all services are running before executing tests:

```bash
# Start infrastructure
docker compose up -d

# Start services
npm run start:data-source &
npm run start:socket-server &
npm run start:customer-api &

# Wait for services to be healthy
./scripts/verify-startup.sh

# Run WebSocket load test
k6 run tests/k6/websocket-load.js

# Run API load test
k6 run tests/k6/customer-api-load.js
```

## Interpreting Results

### WebSocket Test Metrics

- **messages_received**: Total number of price broadcast messages received by all clients
- **broadcast_latency_ms**: Time difference between broadcast timestamp and client receive time
  - p95: 95th percentile latency (should be < 1000ms)
  - p99: 99th percentile latency (should be < 2000ms)

### API Test Metrics

- **http_req_duration**: Time taken for HTTP requests
  - p95: 95th percentile response time (should be < 200ms)
  - p99: 99th percentile response time (should be < 500ms)
- **http_req_failed**: Percentage of failed requests (should be < 1%)
- **customers_created/retrieved/updated/deleted**: Counter for each operation type

## Troubleshooting

### WebSocket Connection Issues

- Verify socket-server is running: `curl http://localhost:3001/health`
- Check RabbitMQ and Redis are healthy in Docker Compose
- Ensure firewall allows WebSocket connections

### API Performance Issues

- Verify customer-api is running: `curl http://localhost:3000/health`
- Check MySQL is healthy in Docker Compose
- Run Prisma migrations: `cd apps/customer-api && npx prisma migrate dev`
- Monitor database connection pool

### High Latency

- Check Docker resource limits
- Monitor CPU/memory usage with `docker stats`
- Verify network latency with `ping`
- Consider scaling horizontally if single instance is saturated

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Run k6 Load Tests
  run: |
    docker compose up -d
    npm run start:data-source &
    npm run start:socket-server &
    npm run start:customer-api &
    sleep 10
    k6 run --out json=websocket-results.json tests/k6/websocket-load.js
    k6 run --out json=api-results.json tests/k6/customer-api-load.js
```
