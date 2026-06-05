import axios from 'axios'

const api = axios.create({
    baseURL: 'https://41f8dad2-2a97-4d0a-a806-f3510003b242-00-2dfbyc5q7h1yc.kirk.replit.dev',
    withCredentials: true
})

// 2. 全局请求拦截器：自动添加 Token（如果有的话）
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            // 假设后端用 Bearer Token 的方式认证
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 玩家相关接口
export const playerApi = {
    // 登录
    login: data => api.post('/player/login', data),
    // 注册
    register: data => api.post('/player/register', data),
    // 获取玩家信息
    getInfo: () => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/player/info', { playerId })
    },
    // 移动
    move: direction => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/player/move', { playerId, direction })
    },
    // 获取玩家列表
    getList: () => api.get('/player/list'),
    // 传送
    trans: () => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/player/trans', { playerId })
    },
    // 返回上一个房间
    back: () => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/player/back', { playerId })
    },
    // 回到初始房间
    home: () => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/player/home', { playerId })
    }
}

// 房间相关接口
export const roomApi = {
    // 获取房间信息
    getInfo: roomId => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/room/info', { playerId, roomId })
    }
}

// 背包相关接口
export const backpackApi = {
    // 获取背包列表
    getList: () => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/backpack/list', { playerId })
    },
    // 拾取物品
    pickItem: itemId => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/backpack/pick', { playerId, itemId })
    },
    // 丢弃物品
    dropItem: itemId => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/backpack/throw', { playerId, itemId })
    },
    // 使用物品
    useItem: itemId => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/backpack/use', { playerId, itemId })
    }
}

export const gameApi = {
    /**
     * 拉取当前玩家的存档列表
     * 后端接口：POST /game/list  Body: { player_id: <number> }
     */
    getList: () => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/game/list', {
            playerId // 如果后端接口要求驼峰写法则改成 playerId
        })
    },

    /**
     * 新建或保存当前玩家的存档
     * 后端接口：POST /game/save  Body: { player_id: <number> }
     */
    save: () => {
        const playerId = localStorage.getItem('playerId')
        return api.post('/game/save', {
            playerId // 如果后端接口要求驼峰写法则改成 playerId
        })
    },

    /**
     * 读取指定存档
     * 后端接口：POST /game/read  Body: { save_id: <number> }
     * @param {Object} params  必须包含 save_id 字段，例如 { save_id: 1 }
     */
    read: params => {
        // 不再从 localStorage 里取，而是直接以 params 作为 body 发给后端
        // 举例：调用时传入 gameApi.read({ save_id: 1 })
        return api.post('/game/read', params)
    },

    /**
     * 删除指定存档
     * 后端接口：POST /game/delete  Body: { save_id: <number> }
     * @param {Object} params  必须包含 save_id 字段，例如 { save_id: 1 }
     */
    delete: params => {
        // 直接以 params 作为 body 发给后端
        return api.post('/game/delete', params)
    },
    new: () => {
        const playerId = localStorage.getItem('playerId') // ★★★
        return api.post('/game/new', { playerId }) // ★★★
    }
}
export default api
