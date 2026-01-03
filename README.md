# 📊 BIST30 Gerçek Zamanlı Fiyat Streaming Platformu

NestJS ile geliştirilmiş, yüksek performanslı gerçek zamanlı BIST30 hisse senedi fiyat streaming platformu. WebSocket üzerinden sub-second gecikme ile veri akışı, RESTful Customer API, RabbitMQ mesajlaşma, Redis önbellekleme ve MySQL veritabanı entegrasyonu içerir.

## 🚀 Hızlı Başlangıç (<5 dakika)

### Gereksinimler

- **Node.js** 20.x LTS ([İndir](https://nodejs.org/))
- **Docker** 24.x+ & **Docker Compose** ([İndir](https://www.docker.com/products/docker-desktop/))
- **npm** 10.x+ (Node.js ile birlikte gelir)

### Kurulum

```bash
# 1. Repository'yi klonla
git clone https://github.com/akdoganalibugra/bist30-price-streaming.git
cd bist30-price-streaming

# 2. Bağımlılıkları yükle
npm install

# 3. Environment dosyasını ayarla
cp .env.example .env

# 4. Altyapı servislerini başlat (RabbitMQ, Redis, MySQL)
docker compose up -d

# 5. Veritabanı migration'larını çalıştır
cd apps/customer-api && npx prisma migrate dev --name init && cd ../..

# 6. Tüm servisleri derle
npm run build

# 7. Servisleri başlat (ayrı terminallerde)
npm run start:data-source    # Terminal 1 - Port 3002
npm run start:socket-server  # Terminal 2 - Port 3001
npm run start:customer-api   # Terminal 3 - Port 3000

# 8. Tüm servislerin sağlıklı olduğunu doğrula
./scripts/verify-startup.sh
```

### Gerçek Zamanlı Streaming Testi

```bash
# Terminal 4 - WebSocket istemcisini başlat
npm run start:socket-client

# Her 500ms'de güncellenen BIST30 fiyat tablosunu göreceksiniz! 📈
```

---

## 📐 Mimari

### Sistem Genel Bakış

```
┌─────────────────┐       ┌──────────────┐       ┌─────────────────┐
│  Data Source    │──────▶│  RabbitMQ    │──────▶│ Socket Server   │
│  (Price Gen)    │       │  (Queue)     │       │ (WS Broadcast)  │
│  Port: 3002     │       │  Port: 5672  │       │  Port: 3001     │
└─────────────────┘       └──────────────┘       └────────┬────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │     Redis       │
                                                   │   (Cache)       │
                                                   │   Port: 6379    │
                                                   └─────────────────┘
                                                            │
                                                            ▼
                                              ┌──────────────────────────┐
                                              │   Socket Clients (N)     │
                                              │  (Console / Browser)     │
                                              └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         Customer API (REST)                              │
│                            Port: 3000                                    │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │      MySQL      │
              │   (Customer DB) │
              │   Port: 3306    │
              └─────────────────┘
```

### Veri Akışı

1. **Fiyat Üretimi**: `data-source` servisi 30 BIST30 sembolü için OHLC (Açılış/Yüksek/Düşük/Kapanış) fiyatları üretir (±%1.0 sınırlı rastgele yürüyüş)
2. **Mesaj Yayınlama**: Fiyatlar RabbitMQ direct exchange'e `prices` exchange'ine `price.update` routing key ile yayınlanır
3. **Tüketim & Önbellekleme**: `socket-server` servisi `price_updates` kuyruğundan mesajları tüketir ve Redis'te `prices:latest` hash'ine kaydeder
4. **Yayınlama**: WebSocket gateway her 500ms'de tüm önbelleklenmiş fiyatları bağlı istemcilere yayınlar
5. **İstemci Görüntüleme**: Socket istemcileri gerçek zamanlı fiyatları alır ve formatlı konsol tablolarında görüntüler

### Teknoloji Stack

| Katman               | Teknoloji               | Versiyon | Amaç                               |
| -------------------- | ----------------------- | -------- | ---------------------------------- |
| **Framework**        | NestJS                  | 10.x     | Backend microservices framework    |
| **Dil**              | TypeScript              | 5.x      | Tip-güvenli geliştirme             |
| **Runtime**          | Node.js                 | 20 LTS   | JavaScript çalışma ortamı          |
| **Mesaj Kuyruğu**    | RabbitMQ                | 3.12     | Güvenilir mesaj iletimi            |
| **Önbellek**         | Redis                   | 7.x      | Düşük gecikmeli fiyat depolama     |
| **Veritabanı**       | MySQL                   | 8.x      | Müşteri veri saklama               |
| **ORM**              | Prisma                  | 5.x      | Tip-güvenli veritabanı erişimi     |
| **WebSocket**        | Socket.io               | 4.x      | Gerçek zamanlı çift yönlü iletişim |
| **Yük Testi**        | k6                      | 0.48+    | Performans ve yük testi            |
| **Konteynerizasyon** | Docker + Docker Compose | 24.x     | Servis orkestasyonu                |

---

## 📦 Proje Yapısı

```
bist30-price-streaming/
├── apps/
│   ├── data-source/              # Fiyat üretim servisi (Port 3002)
│   │   ├── src/
│   │   │   ├── price-generator/  # OHLC üretici (sınırlı rastgele yürüyüş)
│   │   │   ├── rabbitmq/         # Publisher servisi
│   │   │   └── health/           # Health check endpoint
│   │   └── Dockerfile
│   ├── socket-server/            # WebSocket yayın servisi (Port 3001)
│   │   ├── src/
│   │   │   ├── rabbitmq-consumer/ # Kuyruk tüketici
│   │   │   ├── redis/            # Cache servisi (HSET/HGETALL)
│   │   │   ├── websocket/        # Socket.io gateway (500ms yayın)
│   │   │   └── health/           # Health check endpoint
│   │   └── Dockerfile
│   ├── socket-client/            # CLI WebSocket istemcisi
│   │   └── src/
│   │       └── index.ts          # Console.table görüntüleme
│   └── customer-api/             # REST API servisi (Port 3000)
│       ├── src/
│       │   ├── prisma/           # PrismaService wrapper
│       │   ├── customers/        # CRUD controller + service + DTOs
│       │   └── health/           # Health check endpoint
│       ├── prisma/
│       │   └── schema.prisma     # Customer modeli
│       └── Dockerfile
├── libs/
│   ├── common/                   # Paylaşılan utility'ler ve interface'ler
│   │   └── src/
│   │       ├── interfaces/       # PriceUpdate, BroadcastMessage
│   │       ├── constants/        # BIST30_SYMBOLS (30 hisse)
│   │       ├── utils/            # randomBetween, connectWithRetry, Logger
│   │       └── health/           # BaseHealthController
│   └── config/                   # Environment konfigürasyon
│       └── src/
│           └── config.service.ts # ConfigService wrapper
├── tests/
│   └── k6/
│       ├── websocket-load.js     # WebSocket yük testi (50→200→500 client)
│       └── customer-api-load.js  # API CRUD yük testi (20→50→100 VU)
├── scripts/
│   └── verify-startup.sh         # Health check doğrulama scripti
├── docker-compose.yml            # Altyapı servisleri
└── .env.example                  # Environment değişkenleri şablonu
```

---

## 🔧 Services

### 1. Data Source (Price Generator)

**Port**: 3002  
**Purpose**: Generate realistic OHLC price data for 30 BIST30 symbols and publish to RabbitMQ

**Features**:

- Bounded random walk (±1.0% per tick) for realistic price movement
- Staggered generation: each symbol updates every 50-500ms (random intervals)
- Exponential backoff retry for RabbitMQ connection
- Persistent message delivery to exchange `prices`
  sler

### 1. Data Source (Fiyat Üretici)

**Port**: 3002  
**Amaç**: 30 BIST30 sembolü için gerçekçi OHLC fiyat verisi üretir ve RabbitMQ'ya yayınlar

**Özellikler**:

- Sınırlı rastgele yürüyüş (tick başına ±%1.0) ile gerçekçi fiyat hareketi
- Her sembol 50-500ms aralıklarla güncellenir
- RabbitMQ bağlantısı için exponential backoff retry
- `prices` exchange'ine kalıcı mesaj iletimi

**Başlatma**: `npm run start:data-source`

### 2. Socket Server (WebSocket Yayıncı)

**Port**: 3001  
**Amaç**: RabbitMQ'dan fiyatları tüketir, Redis'te önbelleğe alır, her 500ms'de WebSocket ile yayınlar

**Özellikler**:

- RabbitMQ consumer (prefetch 10, ack/nack işleme)
- Redis HSET/HGETALL işlemleri
- Sabit 500ms yayın aralığı
- Socket.io gateway (CORS desteği ve otomatik yeniden bağlanma)

**Endpoint'ler**:

- `GET /health` - Servis sağlık durumu (RabbitMQ + Redis)
- `ws://localhost:3001` - WebSocket bağlantı endpoint'i

**Başlatma**: `npm run start:socket-server`

### 3. Socket Client (CLI)

**Amaç**: WebSocket sunucusuna bağlanır ve konsolda gerçek zamanlı fiyatları görüntüler

**Özellikler**:

- Otomatik yeniden bağlanma
- Console.table ile Sembol/Açılış/Kapanış/Yüksek/Düşük/Değişim%/Zaman kolonları
- Her 500ms'de canlı güncelleme

**Başlatma**: `npm run start:socket-client`

### 4. Customer API (REST)

**Port**: 3000  
**Amaç**: MySQL ile müşteri yönetimi için CRUD operasyonları

**Özellikler**:

- Prisma ORM
- Global ValidationPipe
- Otomatik UUID üretimi
- Email uniqueness kontrolü

**Endpoint'ler**:
| Method | Path | Açıklama | Status Kodları |
|--------|---------------------|--------------------------|---------------------|
| POST | /customers | Müşteri oluştur | 201, 409 |
| GET | /customers | Tüm müşterileri getir | 200 |
| GET | /customers/:uuid | Tek müşteri getir | 200, 404 |
| PATCH | /customers/:uuid | Müşteri güncelle | 200, 404, 409 |
| DELETE | /customers/:uuid | Müşteri sil | 204, 404 |
| GET | /health | Health check | 200, 503 |

**Örnek İstek**:

```bash
# Müşteri oluştur
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Ali", "lastName": "Akdoğan", "email": "ali@example.com"}'
```

**Başlatma**: `npm run start:customer-apiBBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=prices
RABBITMQ_QUEUE=price_updates
RABBITMQ_ROUTING_KEY=price.update

````

**Redis**:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_HASH_KEY=prices:latest
````

**MySQL** (Prisma format):

```env
DATABASE_URL=mysql://bist30_user:bist30_pass@localhost:3306/bist30_customers
```

**Service Ports**:

```env
DATA_SOURCE_PORT=3002
SOCKET_SERVER_PORT=3001
CUSTOMER_API_PORT=3000
```

**Streaming Config**:

```env
BROADCAST_INTERVAL_MS=500
PRICE_BOUNDED_DELTA_PERCENT=1.0
PRICE_UPDATE_MIN_INTERVAL_MS=50
PRICE_UPDATE_MAX_INTERVAL_MS=500
```

**Retry Configuration**:

```env
RETRY_MAX_ATTEMPTS=5
RETRY_INITIAL_DELAY_MS=1000
RETRY_MAX_DELAY_MS=10000
```

### Docker Compose Services

Infrastructure services (RabbitMQ, Redis, MySQL) are defined in [docker-compose.yml](docker-compose.yml):

````yaml
services:
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports:
      - "5672:5672" # AMQP
      - "15672:15672" # Management UI
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 10s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    heKonfigürasyon

### Environment Değişkenleri

Tüm konfigürasyon için [.env.example](.env.example) dosyasına bakın. Ana değişkenler:

```env
# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=prices
RABBITMQ_QUEUE=price_updates

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_HASH_KEY=prices:latest

# MySQL (Prisma format)
DATABASE_URL=mysql://bist30_user:bist30_pass@localhost:3306/bist30_customers

# Servis Portları
DATA_SOURCE_PORT=3002
SOCKET_SERVER_PORT=3001
CUSTOMER_API_PORT=3000

# Streaming Ayarları
BROADCAST_INTERVAL_MS=500
PRICE_BOUNDED_DELTA_PERCENT=1.0
````

### Docker Compose Servisleri

Altyapı servisleri [docker-compose.yml](docker-compose.yml) dosyasında tanımlıdır:

- **RabbitMQ**: Port 5672 (AMQP), 15672 (Management UI - guest/guest)
- **Redis**: Port 6379
- **MySQL**: Port 3306 (bist30_user/bist30_pass)
  # Kill any conflicting processes
  ```

  ```

3. **Check logs**:

   ```bash
   # Docker logs
   docker compose logs rabbitmq
   docker compose logs redis
   docker compose logs mysql

   # Service logs (if running locally)
   # Logs are in JSON format with timestamps
   ```

4. **Reset infrastructure**:
   ```bash
   docker compose down -v  # WARNING: Deletes all data
   docker compose up -d
   ```

### RabbitMQ Connection Errors

**Symptom**: `ECONNREFUSED` or `Channel closed` errors

**Solutions**:

1. Verify RabbitMQ is running: `docker compose ps rabbitmq`
2. Check management UI: http://localhost:15672
3. Verify credentials in `.env` match `docker-compose.yml`
4. Ensure exchange `prices` and queue `price_updates` exist (auto-created by data-source)
5. Check RabbitMQ logs: `docker compose logs rabbitmq`

### Redis Connection Errors

**Symptom**: `ECONNREFUSED` or `Connection timeout` errors

**Solutions**:

1. Verify Redis is running: `docker compose ps redis`
2. Test connection: `redis-cli -h localhost -p 6379 ping` (should return PONG)
3. Check if hash key exists: `redis-cli hgetall prices:latest`
4. Verify Redis host/port in `.env`
5. Check Redis logs: `docker compose logs redis`

### MySQL Connection Errors

**Symptom**: `P1001: Can't reach database server` or `Access denied` errors

**Solutions**:

1. Verify MySQL is running: `docker compose ps mysql`
2. Test connection: `mysql -h localhost -P 3306 -u bist30_user -pbist30_pass bist30_customers`
3. Verify `DATABASE_URL` in `.env` is correct
4. Run migrations: `cd apps/customer-api && npx prisma migrate dev`
5. Check M

### k6 ile Yük Testi

Detaylı talimatlar için [tests/README.md](tests/README.md) dosyasına bakın.

#### WebSocket Yük Testi

```bash
k6 run tests/k6/websocket-load.js
```

**Yük Profili**: 50 → 200 → 500 eşzamanlı client  
**Eşik Değerler**: Broadcast latency p95 < 1000ms, p99 < 2000ms

#### Customer API Yük Testi

```bash
k6 run tests/k6/customer-api-load.js
```

**Yük Profili**: 20 → 50 → 100 sanal kullanıcı (VU)  
**Eşik Değerler**: HTTP request duration p95 < 200ms, p99 < 500ms

### Performans Sonuçları

| Test Tipi     | Metrik                  | Hedef    | Gerçek (500 client) |
| ------------- | ----------------------- | -------- | ------------------- |
| **WebSocket** | Broadcast Latency (p95) | < 1000ms | ~800ms              |
|               | Broadcast Latency (p99) | < 2000ms | ~1500ms             |
| **REST API**  | Request Duration (p95)  | < 200ms  | ~150ms              |
|               | Request Duration (p99)  | < 500ms  | ~350ms              |
|               | Hata Oranı              | < %1     | %0.02               |

redis-cli --latency-history

# Latency should be < 5ms

````

5. **Database connection pool**:
- Check Prisma connection pool settings in `apps/customer-api/src/prisma/prisma.service.ts`
- Default pool size: 10 connections

6. **Scale horizontally**: Run multiple socket-server instances behind a load balancer

### Database Migration Errors

**Symptom**: Prisma migration fails or schema drift detected

**Solutions**:

1. **Reset database** (development only):

```bash
cd apps/customer-api
npx Sorun Giderme

### Servis Başlamıyor

**Çözümler**:
1. Altyapı servislerini kontrol edin: `docker compose ps`
2. Portların kullanımda olmadığını doğrulayın: `lsof -i :3000 -i :3001 -i :3002`
3. Logları kontrol edin: `docker compose logs rabbitmq redis mysql`
4. Altyapıyı sıfırlayın: `docker compose down -v && docker compose up -d`

### RabbitMQ Bağlantı Hataları

1. RabbitMQ çalışıyor mu: `docker compose ps rabbitmq`
2. Management UI kontrol: http://localhost:15672
3. `.env` dosyasındaki credential'ları doğrulayın
4. Logları kontrol edin: `docker compose logs rabbitmq`

### Redis Bağlantı Hataları

1. Redis çalışıyor mu: `docker compose ps redis`
2. Bağlantı testi: `redis-cli -h localhost -p 6379 ping`
3. Önbelleği kontrol: `redis-cli hgetall prices:latest`

### MySQL Bağlantı Hataları

1. MySQL çalışıyor mu: `docker compose ps mysql`
2. Bağlantı testi: `mysql -h localhost -P 3306 -u bist30_user -pbist30_pass`
3. Migration'ları çalıştırın: `cd apps/customer-api && npx prisma migrate dev`

### WebSocket Client Mesaj Almıyor

1. Tüm servislerin sağlığını kontrol edin: `./scripts/verify-startup.sh`
2. RabbitMQ'da mesajların yayınlandığını kontrol edin: http://localhost:15672
3. Redis'te önbelleği kontrol edin: `redis-cli hgetall prices:latest`
4. Socket-server loglarını kontrol edin

### Yüksek Gecikme

1. Docker kaynaklarını izleyin: `docker stats`
2. Sistem kaynaklarını kontrol edin: `top -o cpu`
3. Network gecikmesini test edin: `ping localhost`
4. Redis performansı: `redis-cli --latency-history`

---

## 🔒 Güvenlik Notları

### Environment Değişkenleri

- `.env` dosyalarını **ASLA** version control'e commit etmeyin
- `.env.example` dosyasını şablon olarak kullanın
- Production ve development için farklı credential'lar kullanın
- Secret'ları düzenli olarak rotate edin

### Production Checklist

- [ ] `docker-compose.yml` dosyasındaki default şifreleri değiştirin
- [ ] TLS/SSL bağlantılarını aktif edin
- [ ] WebSocket gateway'e authentication middleware ekleyin
- [ ] REST API için rate limiting uygulayın
- [ ] CORS whitelist'ini yapılandırın
- [ ] Docker image'larını güvenlik açıklarına karşı tarayın

---

## 📊 Health Check'ler

Tüm servisler `/health` endpoint'lerini expose eder:

```bash
# Data Source
curl http://localhost:3002/health

# Socket Server
curl http://localhost:3001/health

# Customer API
curl http://localhost:3000/health
````

---

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.

---

## 👤 Yazar

**Ali Buğra Akdoğan**

- GitHub: [@akdoganalibugra](https://github.com/akdoganalibugra)

---

\*\*Gerçek zamanlı streaming mükemmelliği için ❤️ ile geliştirildi
