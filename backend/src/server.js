import app from './app.js';
import { db } from '#@/core/database';
import { initSocket } from '#@/core/socket.js';

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production' && !process.env.CLOUDINARY_URL) {
  console.warn('[Cloudinary Warning] Running in production but CLOUDINARY_URL is not configured in .env. Uploaded documents will be stored on the ephemeral local filesystem and will vanish on redeploys.');
}

const server = app.listen(PORT, () => {
  console.log(`Syncra Enterprise backend server running on http://localhost:${PORT}`);
});

// Initialize Socket.IO real-time server wrapper
initSocket(server);

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
