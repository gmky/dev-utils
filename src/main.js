import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'

import router from './router'
import App from './App.vue'
import './assets/main.css'
import { useSidebarStore } from './stores/sidebar'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.directive('tooltip', Tooltip)

// Apply persisted sidebar width before first render
useSidebarStore(pinia).apply()
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark-mode',
      cssLayer: false,
    },
  },
})

app.mount('#app')
