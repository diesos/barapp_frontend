import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugin/vuetify'
import { createPinia } from 'pinia'
import router from './router'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import 'vue3-toastify/dist/index.css'
import  Vue3Toastify  from 'vue3-toastify'



const app = createApp(App)
app.use(vuetify)
app.use(Vue3Toastify, {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
})
app.use(createPinia())
app.use(router)
app.mount('#app')
