require('dotenv').config()
const express = require('express');
const logger = require('morgan')
require('./database/connect')

const app = express();

const corsOptions = {
  allRoutes: true,
  origin: '*',
  methods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  headers: 'Origin, X-Requested-With, Content-Type, Accept, Engaged-Auth-Token',
  credentials: true
};

server = app.listen(process.env.PORT);
console.log(`Your server is running on port ${process.env.PORT}.`);

// Setting up basic middleware for all Express requests
app.use(express.urlencoded({ extended: true, limit: '500mb' })); // Parses urlencoded bodies
app.use(express.json({ limit: '500mb' })); // Send JSON responses
app.use(logger('dev')); // Log requests to API using morgan

// Enable CORS from client-side
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use("/", require('./routes'))

module.exports = app