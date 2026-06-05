// mockGameApi.js
// 用于在本地模拟 gameApi.getList 和 gameApi.delete 接口

// 1. 准备一份初始的“已有存档”数据
const mockSaves = [
    {
        saveId: 1,
        playerId: 0,
        saveTime: Date.now() - 1000 * 60 * 60 * 24, // 昨天
        playerScore: 1200,
        playerStamina: 80,
        playerRoomId: 'A1'
    },
    {
        saveId: 2,
        playerId: 1,
        saveTime: Date.now() - 1000 * 60 * 30, // 半小时前
        playerScore: 900,
        playerStamina: 65,
        playerRoomId: 'B2'
    },
    {
        saveId: 3,
        playerId: 2,
        saveTime: Date.now(),
        playerScore: 450,
        playerStamina: 40,
        playerRoomId: 'C3'
    }
]

// 2. 模拟的 gameApi 对象
export const gameApi = {
    // 获取存档列表
    getList() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    data: {
                        code: 200,
                        data: mockSaves
                    }
                })
            }, 200) // 模拟网络延迟
        })
    },

    // 删除指定 saveId 的存档
    delete(saveId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const idx = mockSaves.findIndex(s => s.saveId === saveId)
                if (idx >= 0) {
                    mockSaves.splice(idx, 1)
                    resolve({ data: { code: 200 } })
                } else {
                    resolve({ data: { code: 404, message: 'Save not found' } })
                }
            }, 200)
        })
    },

    // 读取指定 saveId 的存档
    read(saveId) {
        return new Promise(resolve => {
            setTimeout(() => {
                const id = typeof saveId === 'string' ? +saveId : saveId
                const save = mockSaves.find(s => s.saveId === id)
                if (save) {
                    resolve({
                        data: {
                            code: 200,
                            data: save
                        }
                    })
                } else {
                    resolve({
                        data: {
                            code: 404,
                            message: 'Save not found'
                        }
                    })
                }
            }, 200)
        })
    }
}
