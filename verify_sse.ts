import EventSource from 'eventsource';
const url = 'http://localhost:3005/api/events';
console.log('Connecting to SSE:', url);
const es = new EventSource(url);
es.onmessage = (e) => {
  console.log('RECEIVED EVENT:', e.data);
  process.exit(0);
};
es.onerror = (err) => {
  console.error('SSE ERROR:', err);
  process.exit(1);
};
setTimeout(() => {
  console.log('Timed out waiting for SSE event');
  process.exit(1);
}, 45000);
