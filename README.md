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

## � Performans & Yük Testi Sonuçları

### WebSocket Streaming Performansı (500 Eşzamanlı Client)

**Test Konfigürasyonu:**

- **Yük Profili**: 50 → 200 → 500 eşzamanlı client
- **Test Süresi**: 3 dakika (207.3 saniye)
- **Test Aracı**: k6
- **Eşik Değerler**: Broadcast latency p95 < 1000ms, p99 < 2000ms

#### Gecikme Metrikleri

| Metrik                      | Ortalama | Min   | Median | Max   | p90   | p95    | p99    | Hedef                      | Sonuç       |
| --------------------------- | -------- | ----- | ------ | ----- | ----- | ------ | ------ | -------------------------- | ----------- |
| **Broadcast Latency (ms)**  | 17.29    | 0     | 15     | 130   | 32    | **38** | **77** | p95 < 1000ms, p99 < 2000ms | ✅ **PASS** |
| **WebSocket Bağlantı (ms)** | 1.31     | 0.24  | 0.96   | 62.77 | 2.00  | 2.72   | -      | -                          | ✅          |
| **Session Duration (s)**    | 45.00    | 44.99 | 45.00  | 45.15 | 45.00 | 45.00  | -      | -                          | ✅          |

#### Throughput ve İşlem Metrikleri

| Metrik                      | Değer        | Detay                            |
| --------------------------- | ------------ | -------------------------------- |
| **Alınan Mesaj Sayısı**     | 94,062       | Test boyunca toplam mesaj        |
| **Mesaj Alma Hızı**         | 453.74 msg/s | Saniye başına mesaj              |
| **WebSocket Mesajları**     | 97,293       | Ham WebSocket mesaj sayısı       |
| **WebSocket Oturum Sayısı** | 1,077        | Toplam bağlantı/yeniden bağlanma |
| **Tamamlanan İterasyon**    | 897          | 180 kesintili                    |
| **Check Başarı Oranı**      | %100         | 377,145/377,145 check başarılı   |

#### Network İstatistikleri

| Metrik              | Değer             |
| ------------------- | ----------------- |
| **Alınan Veri**     | 328 MB (1.6 MB/s) |
| **Gönderilen Veri** | 251 KB (1.2 KB/s) |

#### 💡 Test Sonuçları Değerlendirmesi

WebSocket streaming platformu, **500 eşzamanlı client** ile 3 dakikalık yük testi altında **mükemmel performans** sergilemiştir. Broadcast latency p95 değeri **38ms** ile hedef değerin (1000ms) **26 kat altında**, p99 değeri **77ms** ile hedefin (2000ms) yine **26 kat altında** gerçekleşmiştir. Ortalama **17.29ms** gecikme süresi, gerçek zamanlı finansal veri streaming için ideal sub-second latency gereksinimini fazlasıyla karşılamaktadır.

Sistem **dakikada 27,224 mesaj** (453.74 msg/s) işleme kapasitesi göstermiş, **%100 check başarı oranı** ile hiçbir veri bütünlüğü sorunu yaşanmamıştır. WebSocket bağlantı kurma süresi ortalama **1.31ms** gibi minimal bir değerde kalırken, maksimum gecikme bile **130ms** ile kabul edilebilir sınırlar içindedir. 30 BIST30 sembolü için her 500ms'de yayınlanan fiyat güncellemelerinin, yüksek eşzamanlı kullanıcı yükü altında bile tutarlı ve güvenilir bir şekilde iletildiği gözlemlenmiştir.

**Sonuç**: NestJS mikroservis mimarisi, RabbitMQ mesajlaşma altyapısı, Redis önbellekleme ve Socket.io WebSocket implementasyonu kombinasyonu, production ortamında yüksek throughput ve düşük latency gereksinimleri için yeterli ölçeklenebilirliği ve güvenilirliği sağlamıştır.

#### Yük Testini Çalıştırma

```bash
# WebSocket yük testi
k6 run tests/k6/websocket-load.js

# Detaylı talimatlar için
cat tests/README.md
```

---

## �🔧 Servisler

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

**Başlatma**:`npm run start:customer-api`

```
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=prices
RABBITMQ_QUEUE=price_updates
RABBITMQ_ROUTING_KEY=price.update`

```

**Redis**:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_HASH_KEY=prices:latest
```

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
