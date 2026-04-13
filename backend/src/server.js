const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Telecom Churn Backend server running on port ${config.PORT}`);
});
