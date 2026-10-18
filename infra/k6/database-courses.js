import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

export const options = {
  vus: 2,
  duration: '10s',
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

const naiveLatency = new Trend('courses_naive_duration_ms');
const fetchLatency = new Trend('courses_fetch_duration_ms');

export default function () {
  // Test naive N+1
  const naiveRes = http.get(`${BASE_URL}/lab/db/courses?mode=naive`);
  check(naiveRes, {
    'naive status is 200': (r) => r.status === 200,
    'naive query count is 51': (r) => r.headers['X-Query-Count'] === '51',
  });
  if (naiveRes.status === 200) {
    naiveLatency.add(JSON.parse(naiveRes.body).durationMs);
  }

  sleep(0.2);

  // Test JOIN FETCH
  const fetchRes = http.get(`${BASE_URL}/lab/db/courses?mode=fetch`);
  check(fetchRes, {
    'fetch status is 200': (r) => r.status === 200,
    'fetch query count is 1': (r) => r.headers['X-Query-Count'] === '1',
  });
  if (fetchRes.status === 200) {
    fetchLatency.add(JSON.parse(fetchRes.body).durationMs);
  }

  sleep(0.5);
}
