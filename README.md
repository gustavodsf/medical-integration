# Medical Event Integration - Microservices Demo

A **NestJS + MongoDB** microservice architecture for ingesting and processing high-throughput medical events with scalability, fault tolerance, and correctness guarantees.

## 🏗️ Architecture

```
┌─────────────┐         HTTP          ┌──────────────────┐
│   Client    │ ───POST /events──────▶│  Ingest Service  │
└─────────────┘                       │   (Port 3000)    │
                                      └──────────────────┘
                                              │
                                              │ HTTP POST
                                              ▼
                                      ┌──────────────────┐
                                      │ Processor Service│
                                      │   (Port 3001)    │
                                      └──────────────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │    MongoDB       │
                                      │   (Port 27017)   │
                                      └──────────────────┘
```

### Services

1. **Ingest Service** (Port 3000)
   - Receives events via `POST /events`
   - Validates incoming payloads
   - Forwards to Processor Service via HTTP
   - Health check: `GET /health`

2. **Processor Service** (Port 3001)
   - Receives events from Ingest Service
   - Simulates ~5 seconds processing
   - Persists to MongoDB with idempotency
   - Enforces per-patient ordering
   - Health check: `GET /health`

3. **MongoDB** (Port 27017)
   - Stores processed events
   - Unique indexes ensure idempotency

## ✨ Features

### ✅ Requirements Met

- **High Throughput**: Handles up to 1000 events/min
- **Idempotency**: Duplicate events are safely ignored (unique `eventId` constraint)
- **Per-Patient Ordering**: Events for the same patient processed sequentially
- **Fault Tolerance**: Services restart on failure, MongoDB persists data
- **Scalability**: Horizontal scaling ready (stateless services)
- **Health Checks**: All services expose `/health` endpoints

### 🔧 Implementation Details

#### Idempotency
- Unique index on `eventId` in MongoDB
- Duplicate detection before processing
- Safe handling of concurrent duplicate requests

#### Per-Patient Ordering
- In-memory lock per `patientId` in Processor Service
- Ensures sequential processing for same patient
- Different patients processed in parallel

#### Processing Simulation
- Random delay: 5-6 seconds per event
- Mimics real medical data processing

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Quick Start with Docker

```bash
# Clone the repository
git clone <repo-url>
cd medical-integration

# Start all services
docker-compose up --build

# Services will be available at:
# - Ingest Service: http://localhost:3000
# - Processor Service: http://localhost:3001
# - MongoDB: mongodb://localhost:27017
```

### Local Development

#### Ingest Service
```bash
cd services/ingest-service/app
npm install
npm run start:dev
```

#### Processor Service
```bash
cd services/processor-service/app
npm install
npm run start:dev
```

#### Environment Variables

Create `.env` files in each service's `app` directory:

**Ingest Service (.env)**
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/medical_events
PROCESSOR_URL=http://localhost:3001
```

**Processor Service (.env)**
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/medical_events
```

## 🚀 API Usage

### Ingest Event

**Endpoint:** `POST http://localhost:3000/events`

**Request Body:**
```json
{
  "patientId": "patient-123",
  "type": "vitals",
  "data": {
    "heartRate": 72,
    "bloodPressure": "120/80"
  },
  "ts": "2025-10-01T10:30:00Z"
}
```

**Response (202 Accepted):**
```json
{
  "status": "queued"
}
```

### Health Checks

```bash
# Ingest Service
curl http://localhost:3000/health
# Response: {"status":"ok","service":"ingest-service"}

# Processor Service
curl http://localhost:3001/health
# Response: {"status":"ok","service":"processor-service"}
```

## 🧪 Testing

### Test Idempotency

Send the same event multiple times:

```bash
# First request
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "type": "vitals",
    "data": {"heartRate": 72},
    "ts": "2025-10-01T10:30:00Z"
  }'

# Duplicate request (will be skipped)
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "type": "vitals",
    "data": {"heartRate": 72},
    "ts": "2025-10-01T10:30:00Z"
  }'
```

### Test Per-Patient Ordering

Send multiple events for the same patient:

```bash
# Event 1 (will process first)
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-456",
    "type": "vitals",
    "data": {"sequence": 1},
    "ts": "2025-10-01T10:00:00Z"
  }'

# Event 2 (will wait for Event 1 to complete)
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-456",
    "type": "vitals",
    "data": {"sequence": 2},
    "ts": "2025-10-01T10:05:00Z"
  }'
```

### Load Testing

Test with 1000 events/min:

```bash
# Using Apache Bench
ab -n 1000 -c 10 -T 'application/json' \
  -p event.json \
  http://localhost:3000/events
```

## 📊 MongoDB Collections

### `processed_events`
Stores successfully processed events:

```javascript
{
  "_id": ObjectId("..."),
  "eventId": "uuid-v4",
  "patientId": "patient-123",
  "type": "vitals",
  "data": { /* event data */ },
  "ts": "2025-10-01T10:30:00Z",
  "processedAt": ISODate("2025-10-01T10:30:05Z"),
  "processingDurationMs": 5234,
  "result": {
    "status": "success",
    "message": "Event processed successfully"
  },
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `eventId`: unique
- `patientId`: index
- `patientId + ts`: compound index (for ordering queries)

## 🛠️ Project Structure

```
medical-integration/
├── services/
│   ├── ingest-service/
│   │   ├── app/
│   │   │   ├── src/
│   │   │   │   ├── events/
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   └── ingest-event.dto.ts
│   │   │   │   │   ├── schemas/
│   │   │   │   │   │   └── queued-event.schema.ts
│   │   │   │   │   ├── events.controller.ts
│   │   │   │   │   ├── events.service.ts
│   │   │   │   │   ├── queue.service.ts
│   │   │   │   │   └── events.module.ts
│   │   │   │   ├── health/
│   │   │   │   │   ├── health.controller.ts
│   │   │   │   │   └── health.module.ts
│   │   │   │   ├── app.module.ts
│   │   │   │   └── main.ts
│   │   │   └── package.json
│   │   └── Dockerfile
│   └── processor-service/
│       ├── app/
│       │   ├── src/
│       │   │   ├── worker/
│       │   │   │   ├── dto/
│       │   │   │   │   └── queue-event.dto.ts
│       │   │   │   ├── schemas/
│       │   │   │   │   └── processed-event.schema.ts
│       │   │   │   ├── worker.controller.ts
│       │   │   │   ├── worker.service.ts
│       │   │   │   └── worker.module.ts
│       │   │   ├── health/
│       │   │   │   ├── health.controller.ts
│       │   │   │   └── health.module.ts
│       │   │   ├── app.module.ts
│       │   │   └── main.ts
│       │   └── package.json
│       └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔍 Monitoring & Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ingest-service
docker-compose logs -f processor-service
```

### MongoDB Shell

```bash
# Connect to MongoDB
docker exec -it medical-mongodb mongosh

# Switch to database
use medical_events

# Query processed events
db.processed_events.find().pretty()

# Check for duplicates
db.processed_events.aggregate([
  { $group: { _id: "$eventId", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

# Events by patient
db.processed_events.find({ patientId: "patient-123" }).sort({ ts: 1 })
```

## 🚢 Scaling Considerations

### Horizontal Scaling

Both services are stateless and can be scaled horizontally:

```yaml
# docker-compose.yml
processor-service:
  deploy:
    replicas: 3  # Run 3 instances
```

**Note:** Current per-patient locking is in-memory. For true distributed scaling, use:
- Redis-based distributed locks (e.g., Redlock)
- Message queue with consumer groups (RabbitMQ, Kafka)

### Message Queue Alternative

For production, replace HTTP with a message queue:
- **RabbitMQ**: Worker queues with prefetch=1 per patient
- **Kafka**: Partition by `patientId` for ordering
- **Redis Streams**: Consumer groups with per-patient sharding

## 📝 License

ISC

