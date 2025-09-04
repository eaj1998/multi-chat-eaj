export class EmoteParser {
  constructor(fetcher) {
    this.fetcher = fetcher;
  }

  parse(message) {
    return this.manualParse(message, this.fetcher);
  }

  manualParse(message, fetcherInstance) {
    const words = message.split(' ');

    const parsedWords = words.map(word => {
      const cleanWord = word.trim().replace(/[.,!?;:]/g, '');

      if (fetcherInstance.emotes.has(cleanWord)) {
        const emote = fetcherInstance.emotes.get(cleanWord);
        const link = emote.toLink();
        return `<img alt="${emote.code}" title="${emote.code}" class="emote" src="${link.replace('undefined', '1x.avif')}">`;
      }

      return word;
    });

    return parsedWords.join(' ');
  }
}