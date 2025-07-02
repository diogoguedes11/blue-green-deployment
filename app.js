const express = require('express');
const winston = require('winston');
const LokiTransport = require('winston-loki');

const app = express();
const port = 3000;

// Version and service info
const version = process.env.APP_VERSION || 'v1';
const serviceName = process.env.SERVICE_NAME || 'blue-green-app';
const environment = process.env.ENVIRONMENT || 'development';

// Step 3: Configure Winston with Loki support
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: serviceName,
    version: version,
    environment: environment
  },
  transports: [
    // Console transport (always keep this for debugging)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Step 3: Add Loki transport only if Loki host is available
const lokiHost = process.env.LOKI_HOST;
if (lokiHost) {
  logger.add(new LokiTransport({
    host: lokiHost,
    labels: { 
      app: serviceName,
      version: version,
      environment: environment
    },
    json: true,
    format: winston.format.json(),
    replaceTimestamp: true,
    onConnectionError: (err) => {
      console.error('Loki connection error:', err.message);
    }
  }));
  
  logger.info('Loki transport enabled', { lokiHost: lokiHost });
} else {
  logger.info('Loki transport disabled - no LOKI_HOST provided');
}

// Step 2: Create a logging middleware function
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when request starts
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  // Important: Call next() to pass control to the next middleware
  next();
};

//Use the middleware for ALL routes
app.use(requestLogger);

app.get('/', (req, res) => {
  logger.info('Root endpoint accessed', { 
    version: version,
    endpoint: '/' 
  });
  
  res.send(`Hello from Blue-Green app! Version: ${version}`);
});

app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'healthy',
    version: version,
    timestamp: new Date().toISOString()
  });
});


app.listen(port, () => {
  logger.info('Application started', {
    port: port,
    version: version
  });
  
  console.log(`App listening on port ${port}, version: ${version}`);
});
