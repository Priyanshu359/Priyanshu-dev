import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

export const options = {
  vus: 2,
  duration: '10s',
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

const compositeLatency = new Trend('explain_composite_ms');
const singleLatency = new Trend('explain_single_ms');
const noneLatency = new Trend('explain_none_ms');

export default function () {
  const strategies = ['composite', 'single', 'none'];
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];

  const res = http.post(
    `${BASE_URL}/lab/db/explain`,
    JSON.stringify({ strategy }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has executionTimeMs': (r) => JSON.parse(r.body).executionTimeMs !== undefined,
  });

  if (res.status === 200) {
    const data = JSON.parse(res.body);
    if (strategy === 'composite') compositeLatency.add(data.executionTimeMs);
    else if (strategy === 'single') singleLatency.add(data.executionTimeMs);
    else noneLatency.add(data.executionTimeMs);
  }

  sleep(0.5);
}
