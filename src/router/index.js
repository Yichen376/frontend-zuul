/**
 * Vue Router 配置入口文件
 * 使用 Hash 模式构建 SPA 路由结构
 * 包含主路径 /welcome、/game 等模块页面路由
 */

import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 路由表定义
 * 包括重定向规则、嵌套路由、懒加载组件等
 */
const routes = [
    // 根路径重定向至登录页
    { path: '/', redirect: '/welcome/login' },

    {
        path: '/welcome',
        component: () => import('@/views/Welcome.vue'),
        children: [
            // 访问 /welcome 默认跳转至 login 页面
            { path: '', redirect: 'login' },

            {
                path: 'login',
                name: 'Login',
                component: () => import('@/views/login.vue') // 登录页
            },
            {
                path: 'archive',
                name: 'Archive',
                component: () => import('@/views/Archive.vue') // 档案页
            }
        ]
    },

    {
        path: '/game',
        name: 'Game',
        component: () => import('@/views/Game.vue') // 游戏主页面
    }
]

/**
 * 创建并导出 Vue Router 实例
 */
export default createRouter({
    history: createWebHashHistory(), // 使用 hash 路由
    routes
})
