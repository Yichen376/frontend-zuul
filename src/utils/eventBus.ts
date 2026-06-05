// src/utils/eventBus.ts

import mitt from 'mitt'

/**
 * 定义事件总线支持的事件类型
 * 只约定这一类事情
 * 限制事件类型以提升类型安全性
 */
type Events = {
    /**
     * 切换场景显示事件
     * true 表示显示场景，false 表示隐藏
     */
    'toggle-scene': boolean
}

/**
 * 事件总线实例，使用 mitt 构建
 * 提供全局组件通信能力
 */
export const bus = mitt<Events>()
