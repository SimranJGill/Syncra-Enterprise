import app from './app.js';
import { db } from '#@/core/database';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Enterprise WFM backend server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  });
});
