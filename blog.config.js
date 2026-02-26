const BLOG = {
  title: 'McFawwaz',
  author: 'Mochammad Fawwaz Islami',
  email: 'mailmcfawwaz@gmail.com',
  link: 'https://mcfawwaz.com',
  description: '',
  lang: 'en-US', // ['en-US', 'zh-CN', 'zh-HK', 'zh-TW', 'ja-JP', 'es-ES']
  timezone: 'Asia/Jakarta', // Your Notion posts' date will be interpreted as this timezone. See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for all options.
  appearance: 'auto', // ['light', 'dark', 'auto'],
  font: 'sans-serif', // ['sans-serif', 'serif']
  lightBackground: '#ffffff', // use hex value, don't forget '#' e.g #fffefc
  darkBackground: '#18181B', // use hex value, don't forget '#'
  path: '', // leave this empty unless you want to deploy Nobelium in a folder
  since: 2024, // If leave this empty, current year will be used.
  postsPerPage: 8,
  sortByDate: true,
  showAbout: true,
  showArchive: true,
  autoCollapsedNavBar: false, // The automatically collapsed navigation bar
  ogImageGenerateURL: 'https://og-image-craigary.vercel.app/McFawwaz.png?theme=light&md=1&fontSize=100px&images=https%3A%2F%2Fnobelium.vercel.app%2Flogo-for-light-bg.svg', // The link to generate OG image, don't end with a slash
  socialLink: 'https://gravatar.com/mailmcfawwaz',
  seo: {
    keywords: ['Mochammad Fawwaz Islami', 'Blog', 'Website', 'Notion'],
    googleSiteVerification: '' // Remove the value or replace it with your own google site verification code
  },
  notionPageId: '5f4b0ceba01342e388a8d07002dc191c', // DO NOT CHANGE THIS！！！
  notionAccessToken: 'vv03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..ElzCxR634GvNqqGUju4gsA.5EjbXizRYnyQQ8AX20P3h9HTfP5xPpEXNA2SBiPx0f3QEDTN_NboVFny9bx3PFy-Oh_c1AsDPg436-zRulrlUAtdNkcFsMbsnQUuuqQMTNlSkTmdcAOp2oPgNTC1HPrskxMc5p2sNpG-xut4qvB_YX1SJF2DLXYyyQPy_murSfDwY7R_KebZ0Ra1X5xyGpYZJRGd-G1QCS_VrxL-RIJS0dZ_EkGYABUFQmiUvdkmMjbDWKfKBeIkC6Ok_HMhA8M37VWHQrd3lEKB1y5g8xwpFtEiTDJsyDYm_SUHZgrN4PPywrp8FbLHZC0VpWW_d1XpWRgasqJ92gmxZwvJdwSLxLJS2X_3yKwwZ0f3JzKa3J2-QqRwFUVjE3j_JhHYg6QXQynJBAKRal1u8c-G_eUk-aGwSQL-rJWBJA90RxMw-OU.c2eVpW0VGrTYQzKza4FpcG3FS23jnNlF0Um_8MpdPpE', // Useful if you prefer not to make your database public
  analytics: {
    provider: '', // Currently we support Google Analytics and Ackee, please fill with 'ga' or 'ackee', leave it empty to disable it.
    ackeeConfig: {
      tracker: '', // e.g 'https://ackee.craigary.net/tracker.js'
      dataAckeeServer: '', // e.g https://ackee.craigary.net , don't end with a slash
      domainId: '' // e.g '0e2257a8-54d4-4847-91a1-0311ea48cc7b'
    },
    gaConfig: {
      measurementId: '' // e.g: G-XXXXXXXXXX
    }
  },
  comment: {
    // support provider: gitalk, utterances, cusdis
    provider: '', // leave it empty if you don't need any comment plugin
    gitalkConfig: {
      repo: '', // The repository of store comments
      owner: '',
      admin: [],
      clientID: '',
      clientSecret: '',
      distractionFreeMode: false
    },
    utterancesConfig: {
      repo: ''
    },
    cusdisConfig: {
      appId: '', // data-app-id
      host: 'https://cusdis.com', // data-host, change this if you're using self-hosted version
      scriptSrc: 'https://cusdis.com/js/cusdis.es.js' // change this if you're using self-hosted version
    }
  },
  isProd: process.env.VERCEL_ENV === 'production' // distinguish between development and production environment (ref: https://vercel.com/docs/environment-variables#system-environment-variables)
}
// export default BLOG
module.exports = BLOG
