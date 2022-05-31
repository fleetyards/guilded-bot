require('dotenv').config();
const { Client, Embed } = require('guilded.ts');
const Sentry = require('@sentry/node');
const FleetyardsBot = require('./fleetyards-bot');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const run = () => {
  const client = new Client();

  const guilded_token = process.env.GUILDED_API_TOKEN;

  // This event is emitted when your bot is connected to Guilded's Gateway API.
  client.once('ready', () =>
    console.info(`[READY] Logged in as ${client.user.name}.`),
  );

  // This event is emitted when a message is sent on Guilded.
  client.on('messageCreate', async (message) => {
    if (message.createdBy === client.user.id) return;

    const [botName, ...args] = message.content.split(' ');

    if (botName !== `@${client.user.name}`) return;

    console.info('[MESSAGE]', message.content);

    fleetyardsBot = new FleetyardsBot(new Embed());
    const result = await fleetyardsBot.resolve(args);

    message.reply(result);
  });

  // Log into guilded
  client.login(guilded_token);
};

setTimeout(() => {
  try {
    run();
  } catch (e) {
    Sentry.captureException(e);
  }
}, 99);
