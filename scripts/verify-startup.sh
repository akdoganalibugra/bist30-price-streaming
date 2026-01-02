#!/usr/bin/env bash

# =============================================================================
# BIST30 Platform - Startup Verification Script
# =============================================================================
# Checks health endpoints of all services to verify successful startup
#
# Usage: ./scripts/verify-startup.sh
# Exit codes: 0 (success), 1 (failure)
#
# Reference: specs/001-bist30-streaming-platform/spec.md (User Story 3)

set -e

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service health endpoints (from .env.example defaults)
DATA_SOURCE_URL="${DATA_SOURCE_URL:-http://localhost:3002/health}"
SOCKET_SERVER_URL="${SOCKET_SERVER_URL:-http://localhost:3001/health}"
CUSTOMER_API_URL="${CUSTOMER_API_URL:-http://localhost:3000/health}"

# Retry configuration
MAX_RETRIES=5
RETRY_DELAY=2

echo "======================================"
echo " BIST30 Platform Startup Verification"
echo "======================================"
echo ""

# Function to check health endpoint with retries
check_health() {
    local service_name=$1
    local url=$2
    local attempt=1

    echo -n "Checking $service_name... "

    while [ $attempt -le $MAX_RETRIES ]; do
        if curl -s -f -m 2 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            echo -n "."
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done

    echo -e "${RED}✗ FAILED${NC}"
    echo "  URL: $url"
    echo "  Max retries ($MAX_RETRIES) exceeded"
    return 1
}

# Check Docker infrastructure services
echo "1. Checking Infrastructure Services..."
echo ""

if ! docker ps | grep -q "bist30-rabbitmq"; then
    echo -e "${RED}✗ RabbitMQ container not running${NC}"
    echo "  Run: docker compose up -d rabbitmq"
    exit 1
fi
echo -e "  RabbitMQ: ${GREEN}✓ Running${NC}"

if ! docker ps | grep -q "bist30-redis"; then
    echo -e "${RED}✗ Redis container not running${NC}"
    echo "  Run: docker compose up -d redis"
    exit 1
fi
echo -e "  Redis: ${GREEN}✓ Running${NC}"

if ! docker ps | grep -q "bist30-mysql"; then
    echo -e "${RED}✗ MySQL container not running${NC}"
    echo "  Run: docker compose up -d mysql"
    exit 1
fi
echo -e "  MySQL: ${GREEN}✓ Running${NC}"

echo ""
echo "2. Checking Application Services..."
echo ""

# Check application health endpoints
FAILED=0

check_health "Data Source" "$DATA_SOURCE_URL" || FAILED=1
check_health "Socket Server" "$SOCKET_SERVER_URL" || FAILED=1
check_health "Customer API" "$CUSTOMER_API_URL" || FAILED=1

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}======================================"
    echo "  All services are healthy!"
    echo "======================================${NC}"
    exit 0
else
    echo -e "${RED}======================================"
    echo "  Some services failed health checks"
    echo "======================================${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check service logs: npm run start:<service-name>"
    echo "  2. Verify .env file exists and has correct values"
    echo "  3. Check Docker logs: docker compose logs <service-name>"
    echo "  4. Ensure dependencies are installed: npm install"
    exit 1
fi
