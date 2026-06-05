<!-- components/GameKeyHints.vue -->
<template>
    <div :class="['key-hint-wrapper', { collapsed: !showHints }]">
        <!-- 提示内容 -->
        <transition name="hint">
            <div v-show="showHints" class="hint-content">
                <!-- 分组：导航操作 -->
                <div class="hint-group">
                    <div class="group-title">导航</div>
                    <div class="hint-item">
                        <span class="hint-label">返回上一房间</span>
                        <div class="key key-sm">R</div>
                    </div>
                    <div class="hint-item">
                        <span class="hint-label">返回初始房间</span>
                        <div class="key key-sm">H</div>
                    </div>
                </div>

                <!-- 分组：交互操作 -->
                <div class="hint-group">
                    <div class="group-title">交互</div>
                    <div class="hint-item">
                        <span class="hint-label">查看房间物品</span>
                        <div class="key key-sm">Q</div>
                    </div>
                    <div class="hint-item">
                        <span class="hint-label">打开背包</span>
                        <div class="key key-sm">E</div>
                    </div>
                </div>

                <!-- 分组：移动 -->
                <div class="hint-group">
                    <div class="group-title">移动</div>
                    <div class="dir-pad">
                        <div class="key key-dir key-up">W</div>
                        <div class="key key-dir key-left">A</div>
                        <div class="key key-dir key-down">S</div>
                        <div class="key key-dir key-right">D</div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 收起状态下显示"提示"标签 -->
        <span v-if="!showHints" class="collapsed-label">提示</span>

        <!-- 底部折叠按钮 -->
        <button
            class="toggle-btn"
            aria-label="切换按键提示"
            @click="toggleHints"
        >
            <span v-if="showHints">收起</span>
            <span v-else>展开</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

/* —— 折叠状态 —— */
const isMobile = window.matchMedia('(max-width: 768px)').matches
const showHints = ref(false)

const mq = window.matchMedia('(max-width: 768px)')

function onMediaChange(e: MediaQueryListEvent) {
    if (e.matches) showHints.value = false
}

onMounted(() => {
    mq.addEventListener('change', onMediaChange)
})

onBeforeUnmount(() => {
    mq.removeEventListener('change', onMediaChange)
})

function toggleHints() {
    showHints.value = !showHints.value
}
</script>

<style scoped>
/* —— 整体容器 —— */
.key-hint-wrapper {
    position: absolute;
    left: 1.5rem;
    top: 20%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    user-select: none;
    z-index: 999;
    background: rgba(30, 20, 18, 0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(180, 160, 140, 0.25);
    border-radius: 16px;
    padding: 1.25rem 1rem;
    transition: padding 0.3s ease;
}

/* 折叠状态 */
.key-hint-wrapper.collapsed {
    padding: 0.75rem 1rem;
}

/* —— 内容区域 —— */
.hint-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* —— 折叠动画 —— */
.hint-enter-active,
.hint-leave-active {
    transition: all 0.3s ease;
}
.hint-enter-from,
.hint-leave-to {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
}
.hint-enter-to,
.hint-leave-from {
    opacity: 1;
    max-height: 500px;
}

/* —— 分组 —— */
.hint-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.group-title {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: rgba(188, 170, 164, 0.7);
    padding-left: 0.25rem;
    margin-bottom: 0.15rem;
}

/* —— 单条提示项 —— */
.hint-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.35rem 0.5rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    transition: background 0.3s ease;
}

.hint-label {
    font-size: 0.85rem;
    color: #c7b8b0;
    white-space: nowrap;
    font-weight: 500;
}

/* —— 小号按键（R/H/Q/E） —— */
.key-sm {
    width: 36px;
    height: 36px;
    border: 1.5px solid rgba(180, 160, 140, 0.55);
    background: linear-gradient(145deg, rgba(100, 75, 65, 0.7), rgba(62, 39, 35, 0.8));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: #d7ccc8;
    box-sizing: border-box;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
}

/* —— 方向键面板 —— */
.dir-pad {
    display: grid;
    grid-template-columns: 48px 48px 48px;
    grid-template-rows: 48px 48px 48px;
    gap: 4px;
    align-self: center;
}

/* —— 方向键通用 —— */
.key-dir {
    width: 48px;
    height: 48px;
    border: 1.5px solid rgba(180, 160, 140, 0.55);
    background: linear-gradient(145deg, rgba(100, 75, 65, 0.7), rgba(62, 39, 35, 0.8));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: #d7ccc8;
    box-sizing: border-box;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    position: relative;
}

/* 方向键上的小箭头装饰 */
.key-dir::after {
    content: '';
    position: absolute;
    font-size: 0.55rem;
    color: rgba(188, 170, 164, 0.6);
    pointer-events: none;
}

.key-up {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
}
.key-up::after {
    content: '▲';
    bottom: 3px;
}

.key-left {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
}
.key-left::after {
    content: '◀';
    right: 3px;
}

.key-down {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
}
.key-down::after {
    content: '▼';
    top: 3px;
}

.key-right {
    grid-column: 3 / 4;
    grid-row: 2 / 3;
}
.key-right::after {
    content: '▶';
    left: 3px;
}

/* —— 收起状态标签 —— */
.collapsed-label {
    align-self: center;
    font-size: 13px;
    font-weight: 600;
    color: #d7ccc8;
    letter-spacing: 0.08em;
}

/* —— 折叠按钮 —— */
.toggle-btn {
    align-self: center;
    padding: 4px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #d7ccc8;
    background: rgba(180, 160, 140, 0.15);
    border: 1px solid rgba(180, 160, 140, 0.3);
    border-radius: 12px;
    cursor: pointer;
    pointer-events: auto;
    transition: background 0.25s, color 0.25s;
}
.toggle-btn:hover {
    background: rgba(180, 160, 140, 0.3);
    color: #fff;
}

/* —— 响应式：小屏缩放 —— */
@media (max-width: 800px) {
    .key-hint-wrapper {
        display: none;
    }
}
</style>