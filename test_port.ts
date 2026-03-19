import express from 'express';
const app = express();
const port = 3005;
try {
  const server = app.listen(port, () => {
    console.log(`Minimal server running on http://localhost:${port}`);
  });
  server.on('error', (err) => {
    console.error('SERVER ERROR:', err);
  });
} catch (err) {
  console.error('CATCH ERROR:', err);
}
