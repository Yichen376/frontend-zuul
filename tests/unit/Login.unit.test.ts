import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Login from '@/views/login.vue'

vi.mock('@/api', () => ({
    playerApi: {
        login: vi.fn().mockResolvedValue({
            data: { data: { playerId: 99 } }
        }),
        register: vi.fn().mockResolvedValue({})
    }
}))

describe('Login.vue - 单元测试', () => {
    it('should login and store playerId', async () => {
        const wrapper = mount(Login)
        wrapper.vm.loginData.username = 'user'
        wrapper.vm.loginData.password = '123456'
        await wrapper.vm.handleLogin()
        expect(localStorage.getItem('playerId')).toBe('99')
    })

    it('should show alert on empty login fields', async () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
        const wrapper = mount(Login)
        wrapper.vm.loginData.username = ''
        wrapper.vm.loginData.password = ''
        await wrapper.vm.handleLogin()
        expect(alertMock).toHaveBeenCalledWith('请完整填写表单')
        alertMock.mockRestore()
    })
})
