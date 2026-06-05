import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayerInfo from '@/components/PlayerInfo.vue'

// mock API 模块
vi.mock('@/api', () => ({
    playerApi: {
        getInfo: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                data: {
                    playerId: 1,
                    playerName: 'Tester',
                    playerAvatarUrl: 'url',
                    playerScore: 120,
                    playerStamina: 50,
                    playerMaxStamina: 100,
                    playerRoomId: 1
                }
            }
        }),
        getList: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                data: [
                    {
                        playerId: 2,
                        playerName: 'Alice',
                        playerAvatarUrl: '',
                        playerScore: 300
                    }
                ]
            }
        })
    },
    backpackApi: {
        getList: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                data: {
                    backpackId: 1,
                    backpackSize: 10,
                    itemList: []
                }
            }
        }),
        dropItem: vi.fn().mockResolvedValue({ data: { code: 200 } }),
        useItem: vi.fn().mockResolvedValue({ data: { code: 200 } })
    },
    gameApi: {
        new: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                data: { playerScore: 0, playerStamina: 20, playerRoomId: 1 }
            }
        }),
        save: vi.fn().mockResolvedValue({ data: { code: 200 } })
    }
}))

// mock event bus
vi.mock('@/utils/eventBus', () => ({
    bus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
    }
}))

// 通用挂载函数，注入 fetchRoom
function mountPlayerInfo() {
    const fetchRoomMock = vi.fn().mockResolvedValue(1)
    return mount(PlayerInfo, {
        global: {
            provide: {
                fetchRoom: fetchRoomMock
            }
        }
    })
}

describe('PlayerInfo - 单元测试', () => {
    beforeEach(() => {
        localStorage.setItem('playerId', '1')
    })

    it('should load player info correctly', async () => {
        const wrapper = mountPlayerInfo()
        await wrapper.vm.initPlayer()
        expect(wrapper.vm.player.name).toBe('Tester')
        expect(wrapper.vm.player.score).toBe(120)
    })

    it('should update score when using cookie', async () => {
        const wrapper = mountPlayerInfo()
        await wrapper.vm.useItem({
            itemId: 1,
            itemName: '魔法饼干',
            itemSize: 1,
            itemValue: 100
        })
        expect(wrapper.vm.player.score).toBeGreaterThan(0)
    })

    it('should toggle backpack visibility', async () => {
        const wrapper = mountPlayerInfo()
        expect(wrapper.vm.showBackpack).toBe(false)
        await wrapper.vm.toggleBackpack()
        expect(wrapper.vm.showBackpack).toBe(true)
    })
})
