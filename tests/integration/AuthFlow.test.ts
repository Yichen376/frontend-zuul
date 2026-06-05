import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthPage from '@/views/login.vue' // 替换成你的组件路径
import { createRouter, createWebHistory } from 'vue-router'

// mock API
vi.mock('@/api/index.js', () => ({
    playerApi: {
        login: vi.fn().mockResolvedValue({
            data: { data: { playerId: '123' } }
        }),
        register: vi.fn().mockResolvedValue({})
    }
}))

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/archive',
            name: 'Archive',
            component: { template: '<div>archive</div>' }
        }
    ]
})

beforeEach(async () => {
    // 清理 localStorage，防止污染
    localStorage.clear()
})

describe('Auth Page Integration Test', () => {
    it('should successfully log in and redirect to /archive', async () => {
        const wrapper = mount(AuthPage, {
            global: {
                plugins: [router]
            }
        })

        // 进入 welcome 页再跳转 login 页（模拟点击）
        await wrapper.vm.enterWelcome()
        await wrapper.vm.startGame()
        await flushPromises()

        // 输入登录信息
        wrapper.vm.loginData.username = 'testuser'
        wrapper.vm.loginData.password = 'password'

        // 执行登录
        await wrapper.vm.handleLogin()
        await flushPromises()

        expect(localStorage.getItem('playerId')).toBe('123')
        expect(router.currentRoute.value.fullPath).toBe('/archive')
    })

    it('should validate registration and trigger error for mismatched passwords', async () => {
        const wrapper = mount(AuthPage, {
            global: {
                plugins: [router]
            }
        })

        await wrapper.vm.enterWelcome()
        await wrapper.vm.startGame()
        await flushPromises()

        wrapper.vm.isRegisterMode = true
        wrapper.vm.registerData.username = 'newuser'
        wrapper.vm.registerData.password = '123456'
        wrapper.vm.registerData.confirm = '654321'

        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
        await wrapper.vm.handleRegister()

        expect(alertMock).toHaveBeenCalledWith('两次输入的密码不一致')
        alertMock.mockRestore()
    })
})
