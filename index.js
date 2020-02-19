var Discord = require('discord.js');
var bot_js = require('./bot');
var dotenv = require('dotenv');
const http = require('http');
const express = require('express');

const app = express();
dotenv.config();

//ping self
let port = process.env.PORT || 8080;
let url;
if (process.env.PROJECT_DOMAIN) {
    url = `http://${process.env.PROJECT_DOMAIN}.glitch.me/`;
} else {
    url = `http://localhost:8080`;
}
app.listen(port);
app.use(express.static('client'));
setInterval(() => { http.get(url); }, 295000);

//init bot
bot = new Discord.Client();
authToken = process.env.TOKEN;

if(!authToken){
    console.log("Bot authentication token not found!");
    console.log("Exiting now.");
    return 1;
}

bot.login(authToken);

bot.on('ready', (evt) => {
    console.log('Connected!');
    console.log(`${bot.user.username} - ${bot.user.id}`);
});

bot.on('message', (discord_message) => {
    bot_js.replyTo(discord_message);
});
