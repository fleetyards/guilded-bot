require('dotenv').config();
const { Client, Embed } = require('guilded.ts');
const fetch = require('node-fetch');
const { resourceLimits } = require('worker_threads');
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://7e4646568cd64fda9de2746219a8fa54@o58249.ingest.sentry.io/6455239',

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

setTimeout(() => {
  try {
    run();
  } catch (e) {
    Sentry.captureException(e);
  }
}, 99);

const client = new Client();

const guilded_token = process.env.GUILDED_API_TOKEN;

const fleetyardsHost = 'https://api.fleetyards.net/v1';
const primaryColor = '#428bca';
const validTopics = ['ship', 'station', 'item', 'help'];
const validQuestions = {
  help: [],
  ship: [
    'options',
    'info',
    'cargo',
    'length',
    'beam',
    'height',
    'crew',
    'weapons',
  ],
  station: ['options', 'info', 'docking', 'habs'],
  item: ['options', 'info', 'price', 'where'],
};

const resolveShipQuestion = async (subject, question) => {
  const shipName = subject.toLowerCase().trim().replace(' ', '-');
  const ship = await fetchShip(shipName);

  if (!ship) {
    return { content: 'Could not load requested Information' };
  }

  if (question == 'info') {
    const embed = new Embed()
      .setTitle(ship.name)
      .setURL(ship.links.frontend)
      .setDescription(ship.description)
      .setThumbnail(ship.storeImageMedium)
      .addField('Length', ship.lengthLabel, true)
      .addField('Beam', ship.beamLabel, true)
      .addField('Height', ship.heightLabel, true)
      .addField('Cargo', ship.cargoLabel, true)
      .addField('Min. Crew', ship.minCrewLabel, true)
      .addField('Max. Crew', ship.maxCrewLabel, true)
      .setColor(primaryColor);

    return { embeds: [embed] };
  } else {
    if (question === 'weapons') {
      const embed = new Embed()
        .setTitle(`${ship.name} Weapons`)
        .setURL(ship.links.frontend)
        .setColor(primaryColor);

      return { embeds: [embed] };
    } else if (question === 'crew') {
      const embed = new Embed()
        .setTitle(`${ship.name} Crew`)
        .setURL(ship.links.frontend)
        .addField('Min. Crew', ship.minCrewLabel, true)
        .addField('Max. Crew', ship.maxCrewLabel, true)
        .setColor(primaryColor);

      return { embeds: [embed] };
    } else {
      return { content: ship[`${question}Label`] };
    }
  }
};

const fetchShip = async (searchTerm) => {
  const response = await fetch(`${fleetyardsHost}/models/${searchTerm}`);

  if (response.status === 200) {
    return response.json();
  } else {
    console.error(response.statusText, searchTerm);
  }

  return null;
};

const resolveStationQuestion = (subject, question) => {
  return { content: 'Not yet ready' };
};

const resolveItemQuestion = (subject, question) => {
  return { content: 'Not yet ready' };
};

const helpContent = () => {
  return {
    content: 'Available Commands are:',
    embeds: [
      new Embed()
        .addField('help', 'Display this help message')
        .addField(
          'ship [question] <subject>',
          'Get Information about a specific Ship',
        )
        .addField(
          'station [question] <subject>',
          'Get Information about a specific Station',
        )
        .addField(
          'item [question] <subject>',
          'Get Information about a specific Item (Weapon, Armor etc.)',
        )
        .setColor(primaryColor),
    ],
  };
};

const resolveByTopic = (topic, subject, question) => {
  if (question == 'options') {
    return {
      content: `Valid questions for ${topic} are: ${validQuestions[topic].join(
        ', ',
      )}`,
    };
  }

  if (!subject || !subject.length) {
    return { content: 'Please provide a valid Subject' };
  }

  switch (topic) {
    case 'help':
      return helpContent();
      break;
    case 'ship':
      return resolveShipQuestion(subject, question);
      break;
    case 'station':
      return resolveStationQuestion(subject, question);
      break;
    case 'item':
      return resolveItemQuestion(subject, question);
      break;
    default:
      return { content: 'Something wrong!' };
      break;
  }
};

const resolveQuestion = async (args) => {
  const searchTerm = args.join(' ');

  const results = await search(searchTerm);

  console.log(results);

  if (!results || !results.length) {
    return { content: 'Could not find any results' };
  }

  item = results[0];

  return { content: item.name };
};

const search = async (searchTerm) => {
  const searchUrl = `${fleetyardsHost}/search/?q[search]=${searchTerm}`;

  console.info('Making request to', searchUrl);

  const response = await fetch(searchUrl);

  if (response.status === 200) {
    return response.json();
  } else {
    console.error(response.statusText, searchTerm);
  }

  return null;
};

// This event is emitted when your bot is connected to Guilded's Gateway API.
client.once('ready', () =>
  console.info(`[READY] Logged in as ${client.user.name}.`),
);

// This event is emitted when a message is sent on Guilded.
client.on('messageCreate', async (message) => {
  if (message.createdBy === client.user.id) return;

  const [botName, ...args] = message.content.split(' ');

  if (botName !== '@F3-Y4') return;

  console.info('[MESSAGE]', message.content);

  console.log(args);

  const result = await resolveQuestion(args);

  message.reply(result);

  // const questionArgs = message.content
  //   .replace(/@Yards Bot/g, '')
  //   .trim()
  //   .split(' ');

  // let topic = questionArgs.shift();
  // if (!validTopics.includes(topic)) {
  //   questionArgs.unshift(topic);
  //   topic = 'ship';
  // }

  // let question = questionArgs.shift();
  // let subject = questionArgs.join(' ');
  // if (!validQuestions[topic].includes(question)) {
  //   if (question !== undefined) {
  //     subject = `${question} ${subject}`;
  //   }
  //   question = 'info';
  // }

  // const result = await resolveByTopic(topic, subject, question);

  // message.reply(result);
});

// Log into guilded
client.login(guilded_token);
