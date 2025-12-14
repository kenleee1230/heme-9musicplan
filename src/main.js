import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './config/firebase'
import App from './App.vue'
import './styles/main.css'
import { initVersionCheck, registerServiceWorkerUpdate } from './utils/version'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()]
})

app.mount('#app')

// 初始化版本检查和更新机制
initVersionCheck()
registerServiceWorkerUpdate()

