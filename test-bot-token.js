const { Telegraf } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN || '8567828129:AAFui0C1xcHj0LmDwKgmnhf9lAWMGheyajY';

console.log('Testing bot token...');
console.log('Token format:', BOT_TOKEN.substring(0, 20) + '...');
console.log('Bot ID (before colon):', BOT_TOKEN.split(':')[0]);
console.log('Token part (after colon):', BOT_TOKEN.split(':')[1]?.substring(0, 20) + '...');
console.log('\n');

const bot = new Telegraf(BOT_TOKEN);

// Test 1: Get bot info
bot.telegram.getMe()
  .then((botInfo) => {
    console.log('✅ Token is VALID!');
    console.log('Bot Info:');
    console.log('  - Username:', botInfo.username);
    console.log('  - First Name:', botInfo.first_name);
    console.log('  - Bot ID:', botInfo.id);
    console.log('  - Can Join Groups:', botInfo.can_join_groups);
    console.log('  - Can Read All Group Messages:', botInfo.can_read_all_group_messages);
    console.log('\n✅ Your bot token is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Token is INVALID or has an error!');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Error Code:', error.response.error_code);
      console.log('Description:', error.response.description);
    }
    console.log('\n❌ Please check your bot token.');
    process.exit(1);
  });

