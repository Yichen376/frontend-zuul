import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Game from '@/views/Game.vue'

vi.mock('@/api', () => ({
    playerApi: {
        move: vi.fn().mockResolvedValue({
            data: { code: 200, message: 'success', data: { roomId: 2 } }
        }),
        getInfo: vi.fn().mockResolvedValue({
            data: {
                data: {
                    playerId: 1,
                    playerName: 'TestPlayer',
                    playerAvatarUrl: '',
                    playerScore: 200,
                    playerRoomId: 2,
                    playerStamina: 80,
                    playerMaxStamina: 100
                }
            }
        }),
        trans: vi
            .fn()
            .mockResolvedValue({ data: { code: 200, message: 'ok' } }),
        back: vi.fn(),
        home: vi.fn()
    },
    roomApi: {
        getInfo: vi.fn().mockResolvedValue({
            data: { data: { roomId: 2, roomName: '传送房间', itemList: [] } }
        })
    },
    backpackApi: {
        getList: vi.fn().mockResolvedValue({
            data: { data: { backpackId: 1, backpackSize: 5, itemList: [] } }
        }),
        pickItem: vi.fn()
    }
}))

vi.mock('@/utils/eventBus', () => ({
    bus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
    }
}))

describe('Game.vue - 单元测试', () => {
    it('should trigger move and update room', async () => {
        const wrapper = mount(Game)
        await flushPromises()

        await wrapper.vm.move('up')
        await flushPromises()

        expect(wrapper.vm.currentRoom.roomName).toBe('传送房间')
        expect(wrapper.vm.actionMessage).toContain('传送')
    })
})
