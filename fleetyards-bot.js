const fetch = require('node-fetch');

module.exports = class FleetyardsBot {
  constructor(embedComponent) {
    this.embedComponent = embedComponent;
  }

  fleetyardsHost = 'https://api.fleetyards.net/v1';
  primaryColor = '#428bca';

  async resolve(args) {
    const searchTerm = args.join(' ');

    const results = await this.search(searchTerm);

    if (!results || !results.length) {
      return { content: 'Could not find any results' };
    }

    const item = results[0];

    const embed = this.embedComponent
      .setTitle(item.name)
      .setDescription(item.description)
      .setThumbnail(item.storeImageMedium)
      .setColor(this.primaryColor);

    if (item.links && item.links.frontend) {
      embed.setURL(item.links.frontend);
    }

    if (item.resultType == 'model') {
      embed
        .addField('Length', item.lengthLabel, true)
        .addField('Beam', item.beamLabel, true)
        .addField('Height', item.heightLabel, true)
        .addField('Cargo', item.cargoLabel, true)
        .addField('Min. Crew', item.minCrewLabel, true)
        .addField('Max. Crew', item.maxCrewLabel, true);
    }

    return { embeds: [embed] };
  }

  async search(searchTerm) {
    const searchUrl = `${this.fleetyardsHost}/search/?q[search]=${searchTerm}`;

    // console.info('Making request to', searchUrl);

    const response = await fetch(searchUrl);

    if (response.status === 200) {
      return response.json();
    } else {
      console.error(response.statusText, searchTerm);
    }

    return null;
  }
};
