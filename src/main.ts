/**
 * 应用入口文件 main.ts
 * 初始化 Vue 应用，挂载插件、组件、路由等核心功能
 */

import { createApp } from 'vue'

// 引入 Element Plus 组件库及样式
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

// 引入根组件
import App from './App.vue'

// 引入路由配置
import router from './router'

// 引入 PrimeVue 组件库及部分组件
import PrimeVue from 'primevue/config'
import Calendar from 'primevue/calendar'

// 创建应用实例
const app = createApp(App)

// 设置全局属性，便于在组件中使用 $message（Element Plus 消息提示）
app.config.globalProperties.$message = ElMessage

// 安装插件、注册全局组件、启用路由
app.use(ElementPlus)
    .use(PrimeVue, { ripple: true }) // PrimeVue 使用水波纹效果
    .component('Calendar', Calendar) // 注册 PrimeVue 日历组件
    .use(router) // 启用 vue-router
    .mount('#app') // 挂载到 DOM 上

/**
 * 修复某些环境下 ResizeObserver 错误导致控制台污染的问题
 * 可选项：预防第三方组件触发的 ResizeObserver loop limit 报错
 */
window.addEventListener(
    'error',
    e => {
        if (e.message.toLowerCase().includes('resizeobserver'))
            e.preventDefault()
    },
    { capture: true }
)
