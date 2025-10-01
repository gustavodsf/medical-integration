#!/bin/bash

# Test script for Medical Event Integration System

BASE_URL="http://localhost:3000"

echo "🏥 Medical Event Integration - Test Script"
echo "=========================================="
echo ""

# Check if services are running
echo "1️⃣  Checking service health..."
echo ""

if curl -s "${BASE_URL}/health" > /dev/null; then
    echo "✅ Ingest Service: $(curl -s ${BASE_URL}/health | jq -r '.service')"
else
    echo "❌ Ingest Service is not running"
    exit 1
fi

if curl -s "http://localhost:3001/health" > /dev/null; then
    echo "✅ Processor Service: $(curl -s http://localhost:3001/health | jq -r '.service')"
else
    echo "❌ Processor Service is not running"
    exit 1
fi

echo ""
echo "2️⃣  Testing event ingestion..."
echo ""

# Test 1: Single event
echo "📨 Sending single event..."
curl -X POST "${BASE_URL}/events" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-001",
    "type": "vitals",
    "data": {"heartRate": 72, "bloodPressure": "120/80"},
    "ts": "2025-10-01T10:00:00Z"
  }' \
  -s | jq '.'

echo ""
echo "3️⃣  Testing idempotency (duplicate event)..."
echo ""

# Test 2: Duplicate event
echo "📨 Sending duplicate event (should be deduplicated)..."
curl -X POST "${BASE_URL}/events" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-001",
    "type": "vitals",
    "data": {"heartRate": 72, "bloodPressure": "120/80"},
    "ts": "2025-10-01T10:00:00Z"
  }' \
  -s | jq '.'

echo ""
echo "4️⃣  Testing per-patient ordering..."
echo ""

# Test 3: Multiple events for same patient
echo "📨 Sending 3 events for patient-002 (should process sequentially)..."

for i in {1..3}; do
  curl -X POST "${BASE_URL}/events" \
    -H "Content-Type: application/json" \
    -d "{
      \"patientId\": \"patient-002\",
      \"type\": \"vitals\",
      \"data\": {\"sequence\": $i},
      \"ts\": \"2025-10-01T10:0${i}:00Z\"
    }" \
    -s | jq -c '.'
done

echo ""
echo "5️⃣  Testing concurrent different patients..."
echo ""

# Test 4: Different patients (should process in parallel)
echo "📨 Sending events for 5 different patients (should process in parallel)..."

for i in {1..5}; do
  curl -X POST "${BASE_URL}/events" \
    -H "Content-Type: application/json" \
    -d "{
      \"patientId\": \"patient-10${i}\",
      \"type\": \"lab-result\",
      \"data\": {\"test\": \"blood\", \"value\": $((RANDOM % 100))},
      \"ts\": \"2025-10-01T11:00:00Z\"
    }" \
    -s | jq -c '.'
done

echo ""
echo "6️⃣  Testing validation (invalid payload)..."
echo ""

# Test 5: Invalid payload
echo "📨 Sending invalid event (missing required field)..."
curl -X POST "${BASE_URL}/events" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-003",
    "data": {"heartRate": 72}
  }' \
  -s -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Testing complete!"
echo ""
echo "📊 To view processed events in MongoDB:"
echo "   docker exec -it medical-mongodb mongosh"
echo "   use medical_events"
echo "   db.processed_events.find().pretty()"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"

