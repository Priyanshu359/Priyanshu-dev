import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export const options = {
  vus: 2,
  duration: '10s',
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

const lostUpdatesCounter = new Counter('lost_updates_detected');
const safeRacesCounter = new Counter('safe_concurrency_preserved');

export default function () {
  const strategies = ['naive', 'lock', 'optimistic'];
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];

  const res = http.post(
    `${BASE_URL}/lab/db/withdraw-race`,
    JSON.stringify({ strategy }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has timeline': (r) => JSON.parse(r.body).timeline.length > 0,
  });

  if (res.status === 200) {
    const data = JSON.parse(res.body);
    if (data.lostUpdate) {
      lostUpdatesCounter.add(1);
    } else {
      safeRacesCounter.add(1);
    }
  }

  sleep(0.5);
}
