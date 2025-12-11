const cors = require('cors');

const envOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
];

const allowedOrigins = new Set([
  ...envOrigins.filter(Boolean),
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:5173',
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const requestOrigin = origin.toLowerCase();
    const matchesAllowed = Array.from(allowedOrigins)
      .some((allowed) => requestOrigin === allowed.toLowerCase());

    if (matchesAllowed) {
      return callback(null, true);
    }

    console.warn('Blocked CORS origin:', origin);
    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-requested-with',
    'Accept',
    'Origin',
    'Upgrade',
    'Connection',
    'Sec-WebSocket-Key',
    'Sec-WebSocket-Version',
    'Sec-WebSocket-Protocol',
  ],
};

module.exports = cors(corsOptions);
