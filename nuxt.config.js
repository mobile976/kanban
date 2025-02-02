export default {
  target: 'static',

  router: {
    base: '/kanban/'  // ✅ Corrected base path for GitHub Pages
  },

  render: {
    resourceHints: false  // ✅ Disables unnecessary preloading warnings
  },

  head: {
    title: 'kanban',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  css: [
    '@/assets/css/main.css',
    '@/assets/css/general.css',
    '@/assets/css/boarder.css',
  ],

  plugins: ['~/plugins/firebase.js'],

  components: true,

  buildModules: [],

  modules: [],

  build: {}
}
