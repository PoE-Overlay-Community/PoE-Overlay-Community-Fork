export const environment = {
  production: true,
  poe: {
    baseUrl: 'https://www.pathofexile.com/',
    countryUrl: 'https://{country}.pathofexile.com/',
    koreanUrl: 'https://poe.game.daum.net/',
    simplifiedChineseUrl: 'https://poe.game.qq.com/',
    traditionalChineseUrl: 'https://pathofexile.tw/',
  },
  wiki: {
    baseUrl: 'https://www.poewiki.net',
  },
  poedb: {
    baseUrl: 'https://poedb.tw/{country}',
  },
  poeNinja: {
    baseUrl: 'https://poe.ninja',
  },
  poePrices: {
    baseUrl: 'https://www.poeprices.info',
  },
  cookieSharingUrls: [
    'https://*.pathofexile.com/*',
    'https://poe.game.daum.net/*',
    'https://poe.game.qq.com/*',
    'https://pathofexile.tw/*',
  ],
}
