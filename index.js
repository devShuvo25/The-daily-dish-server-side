const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { connectDB } = require('./config/database');
const app = express();
const {run }= require('./lib/apiResponse')
const { stripeRoutes } = require('./stripe/stripe');
app.use(cors())
app.use(express.json());
const port = 3000;
connectDB();
run(app).catch(console.dir);
stripeRoutes(app);
app.listen(port,() => {
    console.log("Server is runnig on port:",port);;
})

module.exports = app;
