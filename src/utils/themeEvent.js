// src/utils/themeEvent.js

/**
 * 简易事件总线实现，用于主题切换、UI 通信等场景
 * 提供 on / emit / off 接口，管理事件监听器
 */
export const themeEventBus = {
    listeners: {},

    /**
     * 注册事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event].push(callback)
    },

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 传递的数据
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                callback(data)
            })
        }
    },

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} [callback] - 指定回调函数（可选）
     *                                若不传则移除该事件的所有监听器
     */
    off(event, callback) {
        if (this.listeners[event]) {
            if (callback) {
                this.listeners[event] = this.listeners[event].filter(
                    cb => cb !== callback
                )
            } else {
                delete this.listeners[event]
            }
        }
    }
}
