import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import http from 'http';

import { MainRoutes } from './routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
// Use CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'].includes(origin)) {
            callback(null, true);
        } else {
            console.log(chalk.bgRed(`Request from origin ${origin} blocked by CORS`));
            // Continue processing the request without setting headers
            callback(null, false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Content-Type',
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());


// Middleware for logging request time
app.use((req, res, next) => {
    console.log(chalk.red("Request [" + req.url + "] :"), chalk.yellow(new Date()));
    console.log(chalk.red('User Agent:'), chalk.yellow(req.get('user-agent')));
    next();
});


app.use(express.static('public'));
app.get('/', function (req, res) {
    res.send("Wellcome ");
});
// Middleware to attach `io` to `req`
app.use((req, res, next) => {
    req.io = io;
    next();
  });
app.use("/", MainRoutes);
// Start the server
server.listen(PORT, () => {
    console.log(chalk.blue(`Server is running on http://localhost:${PORT}`));
});
