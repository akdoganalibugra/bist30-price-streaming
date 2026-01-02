import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const customersCreated = new Counter('customers_created');
const customersRetrieved = new Counter('customers_retrieved');
const customersUpdated = new Counter('customers_updated');
const customersDeleted = new Counter('customers_deleted');
const apiLatency = new Trend('api_latency_ms');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 VUs
    { duration: '1m', target: 50 },    // Ramp up to 50 VUs
    { duration: '1m', target: 100 },   // Ramp up to 100 VUs
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'], // 95% < 200ms, 99% < 500ms
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const vuId = __VU;
  const iterationId = __ITER;

  // 1. Create Customer (POST /customers)
  const createPayload = JSON.stringify({
    firstName: `FirstName_${vuId}_${iterationId}`,
    lastName: `LastName_${vuId}_${iterationId}`,
    email: `user_${vuId}_${iterationId}_${Date.now()}@example.com`,
    phone: `+905${String(vuId).padStart(9, '0')}`,
  });

  const createRes = http.post(`${BASE_URL}/customers`, createPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(createRes, {
    'create status is 201': (r) => r.status === 201,
    'create has uuid': (r) => JSON.parse(r.body).uuid !== undefined,
  });

  apiLatency.add(createRes.timings.duration);
  
  if (createRes.status === 201) {
    customersCreated.add(1);
    const customer = JSON.parse(createRes.body);
    const uuid = customer.uuid;

    sleep(0.5);

    // 2. Get All Customers (GET /customers)
    const getAllRes = http.get(`${BASE_URL}/customers`);
    
    check(getAllRes, {
      'getAll status is 200': (r) => r.status === 200,
      'getAll returns array': (r) => Array.isArray(JSON.parse(r.body)),
    });

    apiLatency.add(getAllRes.timings.duration);
    if (getAllRes.status === 200) {
      customersRetrieved.add(1);
    }

    sleep(0.5);

    // 3. Get Single Customer (GET /customers/:uuid)
    const getOneRes = http.get(`${BASE_URL}/customers/${uuid}`);
    
    check(getOneRes, {
      'getOne status is 200': (r) => r.status === 200,
      'getOne has correct uuid': (r) => JSON.parse(r.body).uuid === uuid,
    });

    apiLatency.add(getOneRes.timings.duration);
    if (getOneRes.status === 200) {
      customersRetrieved.add(1);
    }

    sleep(0.5);

    // 4. Update Customer (PATCH /customers/:uuid)
    const updatePayload = JSON.stringify({
      firstName: `Updated_${vuId}_${iterationId}`,
      phone: `+905${String(vuId + 1000).padStart(9, '0')}`,
    });

    const updateRes = http.patch(`${BASE_URL}/customers/${uuid}`, updatePayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(updateRes, {
      'update status is 200': (r) => r.status === 200,
      'update firstName changed': (r) => JSON.parse(r.body).firstName === `Updated_${vuId}_${iterationId}`,
    });

    apiLatency.add(updateRes.timings.duration);
    if (updateRes.status === 200) {
      customersUpdated.add(1);
    }

    sleep(0.5);

    // 5. Delete Customer (DELETE /customers/:uuid)
    const deleteRes = http.del(`${BASE_URL}/customers/${uuid}`);
    
    check(deleteRes, {
      'delete status is 204': (r) => r.status === 204,
    });

    apiLatency.add(deleteRes.timings.duration);
    if (deleteRes.status === 204) {
      customersDeleted.add(1);
    }

    sleep(0.5);

    // 6. Verify Deletion (GET /customers/:uuid should return 404)
    const verifyDeleteRes = http.get(`${BASE_URL}/customers/${uuid}`);
    
    check(verifyDeleteRes, {
      'deleted customer returns 404': (r) => r.status === 404,
    });

    apiLatency.add(verifyDeleteRes.timings.duration);
  }

  sleep(1);
}
