import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import {initBot} from './bot'

dotenv.config();

// static webpage
const app = express();
let port = process.env.PORT || 8080;
app.listen(port);
let client = path.join(__dirname, '..', 'client');
app.use(express.static(client));

let authToken = process.env.TOKEN;

if (!authToken) {
    console.error("Bot authentication token not found!");
    console.error("Exiting now.");
    process.exit(1);
}

// init discord bot
initBot(authToken);
