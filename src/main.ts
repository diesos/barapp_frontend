import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugin/vuetify'
import { createPinia } from 'pinia'
import router from './router'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const app = createApp(App)
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.mount('#app')
