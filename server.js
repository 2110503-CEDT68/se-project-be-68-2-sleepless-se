const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const dotenv = require('dotenv');
const cookieParser=require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize=require('@exortek/express-mongo-sanitize');
const helmet=require('helmet');
const {xss} = require('express-xss-sanitizer');

const hpp = require('hpp');
const cors=require('cors');



dotenv.config({path:'./config/config.env'});

connectDB();

const app=express();
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(cors());

app.use(cookieParser());
app.set('query parser', 'extended');




const hotels = require('./routes/hotels');
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');
const admin = require('./routes/admin');
const reviews = require('./routes/reviews');

app.use('/api/v1/hotels', hotels);
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/admin', admin);
app.use('/api/v1/hotels/:hotelId/reviews', reviews);
app.use('/api/v1/reviews', reviews);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running...'));

