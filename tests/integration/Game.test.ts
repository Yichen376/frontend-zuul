import { mount, flushPromises } from '@vue/test-utils'
import Game from '@/views/Game.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

// 模拟 bus
vi.mock('@/utils/eventBus', () => ({
    bus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
    }
}))

// 模拟组件 PlayerInfo 的 initPlayer 方法
vi.mock('@/components/PlayerInfo.vue', () => ({
    default: {
        name: 'PlayerInfo',
        template: '<div></div>',
        methods: {
            initPlayer: vi.fn().mockResolvedValue(undefined)
        }
    }
}))

// mock API 模块
vi.mock('@/api', () => ({
    playerApi: {
        getInfo: vi.fn().mockResolvedValue({
            data: {
                data: {
                    playerId: 1,
                    playerName: 'TestPlayer',
                    playerAvatarUrl: 'url',
                    playerScore: 100,
                    playerRoomId: 123,
                    playerStamina: 80,
                    playerMaxStamina: 100
                }
            }
        }),
        move: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                message: 'success',
                data: {
                    roomId: 456
                }
            }
        }),
        trans: vi.fn().mockResolvedValue({
            data: { code: 200, message: 'ok' }
        }),
        back: vi.fn(),
        home: vi.fn()
    },
    roomApi: {
        getInfo: vi.fn().mockResolvedValue({
            data: {
                data: {
                    roomId: 456,
                    roomName: '传送房间',
                    itemList: []
                }
            }
        })
    },
    backpackApi: {
        getList: vi.fn().mockResolvedValue({
            data: {
                data: {
                    backpackId: 1,
                    backpackSize: 10,
                    itemList: []
                }
            }
        }),
        pickItem: vi.fn()
    }
}))

describe('Game.vue Integration Test', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('should mount and fetch player info, backpack, and room', async () => {
        const wrapper = mount(Game)
        await flushPromises()

        // 检查 actionMessage 提示
        expect(wrapper.vm.player.name).toBe('TestPlayer')
        expect(wrapper.vm.currentRoom.roomName).toBe('传送房间')
    })

    it('should move and trigger teleport when entering teleport room', async () => {
        const wrapper = mount(Game)
        await flushPromises()

        await wrapper.vm.move('up')
        await flushPromises()

        expect(wrapper.vm.currentRoom.roomName).toBe('传送房间')
        expect(wrapper.vm.actionMessage).toContain('传送倒计时：3 秒')
    })
})
