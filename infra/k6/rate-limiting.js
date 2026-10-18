import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

export const options = {
  scenarios: {
    burst_test: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 15,
      maxDuration: '10s',
    },
    steady_state: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '2s',
      duration: '10s',
      preAllocatedVUs: 2,
      maxVUs: 5,
      startTime: '5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<150'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

const tokensRemaining = new Trend('tokens_remaining');
const rateLimitedCount = new Counter('rate_limited_429');
const allowedCount = new Counter('allowed_200');

export default function () {
  const res = http.get(`${BASE_URL}/lab/limited`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  const remaining = parseInt(res.headers['X-Ratelimit-Remaining'] || '-1', 10);
  if (remaining >= 0) {
    tokensRemaining.add(remaining);
  }

  if (res.status === 200) {
    allowedCount.add(1);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has remaining header': (r) => r.headers['X-Ratelimit-Remaining'] !== undefined,
    });
  } else if (res.status === 429) {
    rateLimitedCount.add(1);
    check(res, {
      'status is 429': (r) => r.status === 429,
      'has retry-after header': (r) => r.headers['Retry-After'] !== undefined,
    });
  }

  sleep(0.1);
}
