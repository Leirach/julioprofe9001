var Discord = require('discord.js');
var { token } = require('./auth.json');
var bot_js = require('./bot');

//init bot
bot = new Discord.Client();
authToken = token || process.env.TOKEN;

if(!authToken){
    console.log("Bot authentication token not found!");
    console.log("Exiting now.");
    return 1;
}

bot.login(token);

bot.on('ready', (evt) => {
    console.log('Connected!');
    console.log(`${bot.user.username} - ${bot.user.id}`);
});

bot.on('message', (discord_message) => {
    bot_js.replyTo(discord_message);
});
