import { mount, flushPromises } from '@vue/test-utils'
import PlayerInfo from '@/components/PlayerInfo.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

// mock inject(fetchRoom)
vi.mock('vue', async () => {
    const vue = await vi.importActual('vue')
    return {
        ...vue,
        inject: () => vi.fn().mockResolvedValue(undefined)
    }
})

// mock API
vi.mock('@/api', () => ({
    playerApi: {
        getInfo: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                data: {
                    playerId: 1,
                    playerName: 'TestUser',
                    playerAvatarUrl: 'url',
                    playerScore: 100,
                    playerStamina: 80,
                    playerMaxStamina: 100,
                    playerRoomId: 101
                }
            }
        }),
        getList: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                data: [
                    {
                        playerId: 1,
                        playerName: 'TestUser',
                        playerAvatarUrl: 'url',
                        playerScore: 100
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
                    backpackSize: 5,
                    itemList: [
                        {
                            itemId: 1,
                            itemName: '体力药水',
                            itemSize: 1,
                            itemValue: 100
                        }
                    ]
                }
            }
        }),
        dropItem: vi.fn().mockResolvedValue({ data: { code: 200 } }),
        useItem: vi.fn().mockResolvedValue({ data: { code: 200 } })
    },
    gameApi: {
        save: vi.fn().mockResolvedValue({ data: { code: 200 } }),
        new: vi.fn().mockResolvedValue({
            data: {
                code: 200,
                data: {
                    playerScore: 0,
                    playerStamina: 20,
                    playerRoomId: 1
                }
            }
        })
    }
}))

vi.mock('@/utils/eventBus', () => ({
    bus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
    }
}))

describe('PlayerInfo.vue', () => {
    beforeEach(() => {
        localStorage.setItem('playerId', '1')
    })

    it('should load player info and backpack on mount', async () => {
        const wrapper = mount(PlayerInfo)
        await flushPromises()

        expect(wrapper.vm.player.name).toBe('TestUser')
        expect(wrapper.vm.backpackInfo.backpackSize).toBe(5)
        expect(wrapper.vm.players.length).toBeGreaterThan(0)
    })

    it('should toggle backpack and call fetchBackpack', async () => {
        const wrapper = mount(PlayerInfo)
        await flushPromises()

        // 初始是 false
        expect(wrapper.vm.showBackpack).toBe(false)

        // 调用 toggleBackpack
        await wrapper.vm.toggleBackpack()
        expect(wrapper.vm.showBackpack).toBe(true)
    })

    it('should use item and show action message', async () => {
        const wrapper = mount(PlayerInfo)
        await flushPromises()

        const item = {
            itemId: 1,
            itemName: '魔法饼干',
            itemSize: 1,
            itemValue: 100
        }

        await wrapper.vm.useItem(item)
        expect(wrapper.vm.actionMessage).toContain('魔法饼干')
    })

    it('should drop item and refresh state', async () => {
        const wrapper = mount(PlayerInfo)
        await flushPromises()

        const item = {
            itemId: 1,
            itemName: '体力药水',
            itemSize: 1,
            itemValue: 100
        }

        await wrapper.vm.dropItem(item)
        expect(wrapper.vm.actionMessage).toContain('丢弃了 体力药水')
    })
})
