const express = require('express');
const app = express();
const port = 3000;

// Version
const version = process.env.APP_VERSION || 'v1';

app.get('/', (req, res) => {
  res.send(`Hello from Blue-Green app! Version: ${version}`);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}, version: ${version}`);
});
