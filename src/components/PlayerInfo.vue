<template>
    <div class="container">
        <div class="hud-top">
            <!-- ---------- Player Panel (左上) ---------- -->
            <div class="player-panel glass-card">
                <div class="panel-top">
                    <!-- 头像 + 数据 -->
                    <div class="player-info">
                        <div class="player-avatar">
                            <img
                                :src="player.avatarUrl || defaultAvatar"
                                alt="Avatar"
                                class="avatar-img"
                                @error="(e) => (e.target as HTMLImageElement).src = defaultAvatar"
                            />
                        </div>
                        <div class="player-details">
                            <h2 class="player-name">
                                {{ player.name || 'Adventurer' }}
                            </h2>
                            <div class="score-section">
                                <span class="score-label">Score</span>
                                <span class="score-value">{{
                                    player.score
                                }}</span>
                            </div>
                            <div class="health-wrapper">
                                <span class="health-label">HP</span>
                                <div class="health-bar">
                                    <div
                                        class="health-fill"
                                        :style="{
                                            width:
                                                (player.health /
                                                    player.maxHealth) *
                                                    100 +
                                                '%'
                                        }"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 操作按钮 -->
                    <div class="player-actions">
                        <button
                            class="exit-btn"
                            title="Exit Game"
                            @click="exitGame"
                        >
                            退出
                        </button>
                        <button
                            class="backpack-btn"
                            title="Backpack (B)"
                            @click="toggleBackpack"
                        >
                            <span class="backpack-btn-icon">🎒</span>
                            <span class="backpack-counter">
                                {{ getCurrentWeight() }}/{{
                                    backpackInfo.backpackSize
                                }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- ---------- Leaderboard (右上，可收起；按钮在底部) ---------- -->
            <div
                :class="[
                    'leaderboard-card glass-card',
                    { collapsed: !showLeaderboard }
                ]"
            >
                <h3 class="leaderboard-title">在线用户</h3>

                <!-- 在线用户列表 -->
                <transition name="lb">
                    <ul v-show="showLeaderboard" class="leaderboard-list">
                        <li
                            v-for="(p, idx) in sortedPlayers"
                            :key="p.id"
                            class="leaderboard-item"
                        >
                            <span class="lb-rank">#{{ idx + 1 }}</span>
                            <img
                                :src="p.avatarUrl || defaultAvatar"
                                alt="avatar"
                                class="lb-avatar"
                                @error="(e) => (e.target as HTMLImageElement).src = defaultAvatar"
                            />
                            <span class="lb-name">{{ p.name }}</span>
                            <span class="lb-score">{{ p.score }}</span>
                        </li>
                    </ul>
                </transition>
                <!-- 底部折叠按钮 -->
                <button
                    class="toggle-btn"
                    aria-label="切换在线用户列表"
                    @click="toggleLeaderboard"
                >
                    <span v-if="showLeaderboard">收起</span>
                    <span v-else>展开</span>
                </button>
            </div>
        </div>

        <!-- 保存存档按钮（固定在右下角） -->
        <button class="save-btn" title="保存存档" @click="saveGame">
            保存存档
        </button>

        <!-- ---------- Backpack Modal ---------- -->
        <teleport to="body">
            <div v-if="showBackpack" class="backpack-modal">
                <div class="backpack-header">
                    <h3>背包</h3>
                    <button class="close-btn" @click="showBackpack = false">
                        ✕
                    </button>
                </div>
                <div class="backpack-content">
                    <div class="backpack-info">
                        <span class="backpack-capacity"
                            >当前重量：{{ getCurrentWeight() }}/{{
                                backpackInfo.backpackSize
                            }}</span
                        >
                        <span class="backpack-value"
                            >总价值：{{ getTotalValue() }}</span
                        >
                    </div>
                    <div
                        v-if="backpackInfo.itemList.length === 0"
                        class="empty-backpack"
                    >
                        背包是空的，快去收集物品吧！
                    </div>
                    <div v-else class="backpack-items-grid">
                        <div
                            v-for="item in backpackInfo.itemList"
                            :key="item.itemId"
                            class="backpack-item-card"
                        >
                            <div class="backpack-item-icon">
                                {{ iconMap[item.itemName] || '🎒' }}
                            </div>
                            <div class="backpack-item-details">
                                <div class="backpack-item-name">
                                    {{ item.itemName }}
                                </div>
                                <div class="backpack-item-meta">
                                    <span class="item-size"
                                        >重量: {{ item.itemSize }}</span
                                    ><span class="item-value"
                                        >价值: {{ item.itemValue }}</span
                                    >
                                </div>
                            </div>
                            <!-- 新增：如果是“魔法饼干”或“体力药水”，则显示“使用”按钮 -->
                            <button
                                v-if="
                                    item.itemName === '魔法饼干' ||
                                    item.itemName === '体力药水'
                                "
                                class="use-item-btn"
                                @click="useItem(item)"
                            >
                                使用
                            </button>
                            <button
                                class="drop-item-btn"
                                @click="dropItem(item)"
                                title="丢弃"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path
                                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                    />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import {
    ref,
    reactive,
    computed,
    onMounted,
    onBeforeUnmount,
    inject
} from 'vue'
import { backpackApi, playerApi, gameApi } from '@/api'
import { bus } from '@/utils/eventBus'
import defaultAvatar from '@/icons/avatar.png'
import { useRouter } from 'vue-router'

const router = useRouter()

const fetchRoom = inject<(roomId: number) => Promise<void>>('fetchRoom')
if (!fetchRoom) {
    throw new Error('PlayerInfo.vue: inject("fetchRoom") 失败')
}

const refreshIntervalId = ref<number | null>(null)

// 更新后的背包图标映射（与后端 ITEM_POOL 保持一致）
const iconMap: Record<string, string> = {
    火把: '🔥',
    '古书（密码书）': '📖',
    '炼金药水（小）': '🧪',
    炼金试剂包: '🧬',
    钥匙: '🔑',
    '武器（短剑）': '🗡️',
    盾牌: '🛡️',
    '金币（堆）': '💰',
    宝石: '💎',
    魔法饼干: '🍪',
    体力药水: '⚡'
}
// ⬇️ 把是否移动端缓存下来，避免每次都读 window
const isMobile = window.matchMedia('(max-width: 768px)').matches

/* —— 在线用户列表折叠状态 —— */
const showLeaderboard = ref(false)

const mq = window.matchMedia('(max-width: 768px)')
const isMob = ref(mq.matches)

// 2️⃣  监听窗口宽度变化：一旦变成小屏就收起
mq.addEventListener?.('change', e => {
    isMob.value = e.matches // 可选
    if (e.matches) showLeaderboard.value = false
})

function toggleLeaderboard() {
    showLeaderboard.value = !showLeaderboard.value

    bus.emit('toggle-scene', !showLeaderboard.value)
}
/* ---------- 基础状态 ---------- */
const showBackpack = ref(false)

const player = reactive({
    id: 0, // 新增：用来保存 playerId
    name: '', // 对应后台的 playerName
    avatarUrl: '', // 对应后台的 playerAvatarUrl
    score: 0, // 对应后台的 playerScore
    health: 0, // 如果后台返回生命值，可以映射过来，否则给个默认
    maxHealth: 100, // 最大生命值
    room_id: 1
})

const backpackInfo = reactive({
    backpackId: null as number | null,
    backpackSize: 0,
    itemList: [] as {
        itemId: number
        itemName: string
        itemSize: number
        itemValue: number
    }[]
})

const players = ref<any[]>([])

/* ---------- 计算属性 ---------- */
const sortedPlayers = computed(() =>
    [...players.value].sort((a, b) => b.score - a.score)
)

const getCurrentWeight = () =>
    backpackInfo.itemList.reduce((s, i) => s + i.itemSize, 0)

const getTotalValue = () =>
    backpackInfo.itemList.reduce((s, i) => s + i.itemValue, 0)

/* ---------- 方法 ---------- */
function exitGame() {
    // 如果组件不在 <router-view> 内，useRouter() 可能拿不到实例
    if (router && typeof router.push === 'function') {
        router.push('/') // 常规方式
    } else {
        window.location.href = '/' // 兜底：强制跳转首页
    }
}

async function toggleBackpack() {
    if (!showBackpack.value) await fetchBackpack()
    showBackpack.value = !showBackpack.value
}

function handleKeydown(e: KeyboardEvent) {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    switch (e.key.toLowerCase()) {
        case 'e':
            toggleBackpack()
            break
    }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

async function fetchBackpack() {
    if (!player.id) {
        console.warn('[fetchBackpack] player.id 还没拿到，跳过')
        return
    }
    try {
        const res = await backpackApi.getList({ playerId: player.id })
        // —— 1. 打印完整返回，看看接口到底给了什么
        console.log('[fetchBackpack] raw res.data:', res.data)

        // 假设接口返回格式是 { code, msg, data: {...} }
        const { code, msg, data } = res.data
        // —— 2. 根据实际 code 值来判断成功，比如有的后端用 200，有的用 0
        if (code !== 0 && code !== 200) {
            console.warn('[fetchBackpack] 接口失败，code=', code, 'msg=', msg)
            return
        }

        // —— 3. 解包 data，部分后端字段可能下划线命名
        const payload = data ?? res.data
        const backpackSize = payload.backpackSize ?? payload.backpack_size
        const itemList = payload.itemList ?? payload.items ?? []

        // —— 4. 赋值给响应式对象
        backpackInfo.backpackId = payload.backpackId ?? payload.backpack_id
        backpackInfo.backpackSize = backpackSize
        backpackInfo.itemList = itemList

        console.log('[fetchBackpack] 更新后 backpackInfo:', backpackInfo)
    } catch (err) {
        console.error('[fetchBackpack] 网络或其他错误：', err)
    }
}

/**
 * 使用 playerApi.getList() 从后端拉取在线玩家列表
 */
async function fetchPlayers() {
    try {
        // 1. 调用后端接口：GET /player/list
        const res = await playerApi.getList()

        // 2. 假定后端响应格式为：
        //    {
        //      code: 200,
        //      message: "success",
        //      data: [
        //        { playerId: 12345, playerName: "张三", playerAvatarUrl: "...", playerScore: 980, ... },
        //        { playerId: 67890, playerName: "李四", playerAvatarUrl: "...", playerScore: 850, ... },
        //        ...
        //      ]
        //    }
        const { code, data, message } = res.data

        if (code === 200) {
            // 3. 将后端返回的 data 数组映射成前端需要的格式：
            //    { id, name, avatarUrl, score }
            players.value = data.map((p: any) => ({
                id: p.playerId,
                name: p.playerName,
                avatarUrl: p.playerAvatarUrl,
                score: p.playerScore
            }))
        } else {
            // 4. 如果 code 不是 200，则打印警告，方便调试
            console.warn(
                '[fetchPlayers] 后端返回异常，code:',
                code,
                'message:',
                message
            )
        }
    } catch (err) {
        // 5. 捕获网络或其它错误
        console.error('获取玩家列表失败:', err)
    }
}

/** 丢弃物品 → 通知后端，拉取最新背包和玩家信息 → 更新前端状态（已加日志） */
async function dropItem(item: {
    itemId: number
    itemName: string
    itemSize: number
    itemValue: number
}) {
    try {
        // 1. 调接口真正丢弃（后端会在数据库里删除该 item 并做体力、分数扣减等所有计算）
        console.log(
            '[dropItem] 开始调用 backpackApi.dropItem，itemId =',
            item.itemId
        )
        const resDrop = await backpackApi.dropItem(item.itemId)
        console.log('[dropItem] backpackApi.dropItem 返回：', resDrop.data)

        // 2. 重新拉取背包列表，让背包面板中移除这件物品
        console.log('[dropItem] 调用 fetchBackpack() 刷新背包')
        await fetchBackpack()
        bus.emit('backpack-updated')
        console.log('[dropItem] 已刷新背包列表')

        // 3. 【改动点】丢弃物品后，不要手动扣分/扣体力，而是去后端拉最新玩家信息
        console.log(
            '[dropItem] 触发事件 bus.emit("item-dropped")，通知房间更新'
        )
        bus.emit('item-dropped', {
            itemId: item.itemId,
            itemName: item.itemName,
            itemSize: item.itemSize,
            itemValue: item.itemValue
        })
        console.log('[dropItem] 准备调用 initPlayer() 同步玩家信息')
        await initPlayer()
        console.log('[dropItem] initPlayer() 执行完毕，玩家信息已更新')

        // 4. 弹框提示（后端已经在数据库里完成扣分/扣体力）
        actionMessage.value = `丢弃了 ${item.itemName}，后端已更新玩家状态`
        setTimeout(() => (actionMessage.value = ''), 3000)
        console.log('[dropItem] 操作完成，提示已显示')
    } catch (err: any) {
        console.error('[dropItem] 出错：', err.response || err)
        actionMessage.value = '丢弃失败，请查看控制台'
        setTimeout(() => (actionMessage.value = ''), 3000)
    }
}

async function handlePlayerRevival(playerId: number) {
    try {
        const res = await gameApi.new({ playerId })
        const { code, msg, data } = res.data
        if (code === 200 || code === 0) {
            Object.assign(player, {
                score: data.playerScore,
                health: data.playerStamina,
                room_id: data.playerRoomId
            })
            if (fetchRoom) {
                await fetchRoom(player.room_id)
            }
            actionMessage.value = '体力值耗尽，你已复活，分数重新计算！'
            setTimeout(() => (actionMessage.value = ''), 3000)
        } else {
            console.warn('[handlePlayerRevival] 复活失败：', msg)
        }
    } catch (err) {
        console.error('[handlePlayerRevival] 网络或其他错误：', err)
    }
}

async function initPlayer() {
    const stored = localStorage.getItem('playerId')
    if (!stored) {
        console.warn('[initPlayer] localStorage 中没找到 playerId，请先登录')
        return
    }
    const playerId = Number(stored)
    try {
        const res = await playerApi.getInfo({ playerId })
        const { code, msg, data } = res.data
        if (code !== 0 && code !== 200) {
            console.warn('[initPlayer] 接口返回失败：', msg)
            return
        }

        Object.assign(player, {
            id: data.playerId,
            name: data.playerName,
            avatarUrl: data.playerAvatarUrl,
            score: data.playerScore,
            health: data.playerStamina,
            maxHealth: data.playerMaxStamina ?? 200,
            room_id: data.playerRoomId
        })

        if (player.health <= 0) {
            // 修改处
            await handlePlayerRevival(playerId)
            alert('体力值耗尽，你已复活，分数重新计算！')
        }

        if (fetchRoom) {
            await fetchRoom(player.room_id)
        }
    } catch (err) {
        console.error('[initPlayer] 网络或其它错误：', err)
    }
}

async function saveGame() {
    try {
        const res = await gameApi.save({ playerId: player.id })
        console.log('>> saveGame 返回', res.data)
        if (res.data.code === 200) alert('存档成功！')
        else alert('存档失败：' + (res.data.message || '未知错误'))
    } catch (err) {
        console.error(err)
        alert('保存存档出错')
    }
}

/* ---------- 键盘监听 ---------- */
function handleKey(e: KeyboardEvent) {
    if (e.key === 'b' || e.key === 'B') toggleBackpack()
    if (e.key === 'Escape' && showBackpack.value) showBackpack.value = false
}

// —— 新增：定义 actionMessage 用于显示操作提示 ——
const actionMessage = ref('')

/**
 * 新增：使用物品 —— 只针对于“魔法饼干”和“体力药水”
 */
async function useItem(item: {
    itemId: number
    itemName: string
    itemSize: number
    itemValue: number
}) {
    try {
        // 1. 调用后端：POST /backpack/use
        //    假设在 backpackApi 中，对应的方法名为 useItem，入参格式为 { playerId, itemId }
        const res = await backpackApi.useItem(item.itemId)
        console.log('[useItem] 后端返回 res.data =', res.data)

        const { code, msg } = res.data
        // 2. 判断后端返回
        if (code === 0 || code === 200) {
            // 使用成功 —— 根据 itemName 做不同处理
            if (item.itemName === '魔法饼干') {
                // 假设魔法饼干的效果为：+50 分
                player.score += 50
                bus.emit('player-score-updated', player.score)
                actionMessage.value = `使用了 魔法饼干，获得 50 分！`
            } else if (item.itemName === '体力药水') {
                // 假设体力药水的效果为：+20 点体力，但不超过 maxHealth
                const recover = 20
                const newHealth = Math.min(
                    player.maxHealth,
                    player.health + recover
                )
                player.health = newHealth
                bus.emit('player-health-updated', player.health)
                actionMessage.value = `使用了 体力药水，恢复 ${
                    newHealth - (player.health - recover)
                } 点体力！`
            }

            // 3. 重新拉取背包列表，使已使用的物品从背包中移除
            await fetchBackpack()
            bus.emit('backpack-updated')

            // 4. 短暂显示提示后自动清空
            setTimeout(() => {
                actionMessage.value = ''
            }, 3000)
        } else {
            // 后端返回 code 非预期，视为使用失败
            console.warn('[useItem] 使用失败，code=', code, 'msg=', msg)
            actionMessage.value = `使用失败：${msg || '未知错误'}`
            setTimeout(() => {
                actionMessage.value = ''
            }, 3000)
        }
    } catch (err) {
        console.error('[useItem] 网络或其他错误：', err)
        actionMessage.value = '使用失败，请稍后重试'
        setTimeout(() => {
            actionMessage.value = ''
        }, 3000)
    }
}

// —— 新增：定义一个命名的 handler ——
function onPlayerScoreUpdated(newScore: number) {
    player.score = newScore
}
// —— 新增：监听体力变化
function onPlayerHealthUpdated(newHealth: number) {
    player.health = newHealth
}

/* ---------- 生命周期 ---------- */
onMounted(async () => {
    await initPlayer()
    await fetchBackpack()
    // 监听背包更新事件
    bus.on('backpack-updated', fetchBackpack)
    // —— 新增：监听分数更新 ——
    bus.on('player-score-updated', onPlayerScoreUpdated)
    bus.on('player-health-updated', onPlayerHealthUpdated)

    // 先立即拉一次在线用户列表
    await fetchPlayers()
    // 然后每隔 2 秒刷新一次
    refreshIntervalId.value = window.setInterval(() => {
        fetchPlayers()
        initPlayer()
    }, 2000)
    // players.value = mockPlayers
    window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
    bus.off('backpack-updated', fetchBackpack)
    window.removeEventListener('keydown', handleKey)
    bus.off('player-score-updated', onPlayerScoreUpdated)
    // —— 清除刚才设置的定时器
    if (refreshIntervalId.value !== null) {
        clearInterval(refreshIntervalId.value)
        refreshIntervalId.value = null
    }
})

// 4. 把 initPlayer 暴露给父组件
defineExpose({ initPlayer })
</script>

<style scoped>
:root {
    /* 主题色变量，方便整体调色 */
    --card-bg: rgba(62, 39, 35, 0.82);
    --card-border: rgba(180, 160, 140, 0.14);
    --primary-500: #8d6e63;
    --primary-600: #6d4c41;
    --accent-500: #8d6e63;
    --accent-600: #6d4c41;
    --text-muted: #bcaaa4;
}

/* ========== 通用玻璃卡片基类 ========== */
.glass-card {
    position: absolute;
    background: var(--card-bg);
    border-radius: 18px;
    padding: 18px 22px;
    backdrop-filter: blur(14px);
    overflow: hidden;
}
.glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px; /* 描边粗细 */
    background: linear-gradient(
        135deg,
        rgba(180, 160, 140, 0.18),
        rgba(180, 160, 140, 0.04)
    );
    -webkit-mask: linear-gradient(#0000 0 0) content-box,
        linear-gradient(#000 0 0);
    -webkit-mask-clip: content-box, border-box;
    -webkit-mask-composite: xor; /* 镂空描边 */
    pointer-events: none;
}

/* ========== 玩家信息面板（左上） ========== */
.player-panel {
    top: 20px;
    left: 20px;
    min-width: 300px;
}
.panel-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
}
.player-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* 头像 */
.player-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 3px solid rgba(180, 160, 140, 0.4);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.35);
}
.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 文本信息 */
.player-details {
    min-width: 140px;
}
.player-name {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
}

.score-section {
    display: flex;
    gap: 6px;
    align-items: baseline;
    margin-bottom: 6px;
}
.score-label {
    font-size: 14px;
    color: var(--text-muted);
}
.score-value {
    font-size: 18px;
    font-weight: 700;
    color: #e8d5a0;
}

/* 血量 */
.health-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
}
.health-label {
    font-size: 13px;
    color: var(--text-muted);
}
.health-bar {
    flex: 1;
    height: 8px;
    background: rgba(62, 39, 35, 0.15);
    border-radius: 6px;
    overflow: hidden;
}
.health-fill {
    height: 100%;
    background: linear-gradient(90deg, #e53935, #c62828);
    transition: width 0.3s ease;
}

/* 操作按钮组 */
.player-actions {
    display: flex;
    gap: 14px;
}

/* 退出按钮 */
.exit-btn {
    padding: 6px 18px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: transform 0.25s, filter 0.25s;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
}
.exit-btn:hover {
    transform: translateY(-2px) scale(1.04);
    filter: brightness(1.05);
}

/* 背包按钮 */
.backpack-btn {
    position: relative;
    width: 56px;
    height: 56px;
    border: none;
    border-radius: 50%;
    font-size: 28px;
    color: #fff;
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    cursor: pointer;
    transition: transform 0.25s, filter 0.25s;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}
.backpack-btn:hover {
    transform: translateY(-2px) scale(1.08);
    filter: brightness(1.08);
}
.backpack-counter {
    position: absolute;
    right: -6px;
    bottom: -6px;
    padding: 2px 6px;
    min-width: 22px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 10px;
    line-height: 1.1;
}

/* ========== 排行榜卡片（右上） ========== */
.leaderboard-card {
    top: calc(20vh - 20px);
    right: 20px;
    width: 260px;
    z-index: 100;
}
.leaderboard-title {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    text-align: center;
    letter-spacing: 0.5px;
}
.leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 280px;
    overflow-y: auto;
}
.leaderboard-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(215, 204, 200, 0.3);
    border-radius: 10px;
}
.lb-rank {
    width: 28px;
    text-align: center;
    font-weight: 700;
    color: #5d4037;
}
.lb-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(180, 160, 140, 0.35);
}
.lb-name {
    flex: 1;
    font-size: 14px;
    color: #4e342e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.lb-score {
    font-size: 15px;
    font-weight: 700;
    color: #5d4037;
}

/* ========== 背包弹窗（居中） ========== */
.backpack-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(540px, 92vw);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 1200;
    background: rgba(239, 235, 233, 0.97);
    border: 2px solid rgba(180, 160, 140, 0.25);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(16px);
}
.backpack-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: rgba(180, 160, 140, 0.1);
    border-bottom: 1px solid rgba(180, 160, 140, 0.2);
}
.backpack-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #4e342e;
}
.close-btn {
    background: transparent;
    border: none;
    font-size: 22px;
    color: #6d4c41;
    cursor: pointer;
}

.backpack-content {
    flex: 1;
    padding: 18px 20px 24px;
    overflow-y: auto;
}
.backpack-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    color: #5d4037;
}
.empty-backpack {
    text-align: center;
    padding: 40px 0;
    color: #8d6e63;
    font-size: 15px;
}

/* 物品网格 */
.backpack-items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 14px;
}
.backpack-item-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    background: rgba(215, 204, 200, 0.5);
    border: 1px solid rgba(180, 160, 140, 0.2);
    border-radius: 10px;
}
.backpack-item-icon {
    font-size: 30px;
    margin-bottom: 6px;
}
.backpack-item-details {
    text-align: center;
}
.backpack-item-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #4e342e;
}
.backpack-item-meta {
    font-size: 12px;
    color: #6d4c41;
}
.drop-item-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 4px;
    font-size: 12px;
    color: #fff;
    background: rgba(255, 85, 85, 0.9);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}
.drop-item-btn:hover {
    background: rgba(255, 85, 85, 1);
}

/* ========== 响应式 ========== */
@media (max-width: 480px) {
    .player-panel {
        left: 10px;
        width: auto;
        padding: 16px 18px;
    }
    .leaderboard-card {
        right: 10px;
        width: 220px;
    }
    .panel-top {
        flex-direction: column;
        align-items: flex-start;
    }
    .player-actions {
        width: 100%;
        justify-content: space-between;
        margin-top: 12px;
    }
    .backpack-items-grid {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    }
}

/* —— 在线用户卡片折叠头部 —— */
.leaderboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.leaderboard-card {
    position: absolute;
    right: 20px;
    width: 260px;
    /* 新增：flex 布局 */
    display: flex;
    flex-direction: column;
    padding-bottom: 10px;
    z-index: 0;
}

.leaderboard-list {
    flex: 1; /* 列表自动占满中间所有空白 */
    overflow-y: auto; /* 超出时出现滚动条 */
    margin: 0; /* 视情况去掉默认的 ul margin/padding */
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: calc(46px * 5 + 10px * 4);

    overflow-y: auto; /* 超出就出现滚动条 */
    scroll-behavior: smooth; /* 上下滚动更顺滑，可选 */

    -ms-overflow-style: none; /* IE / 旧版 Edge */
    scrollbar-width: none; /* Firefox */
    z-index: 5;
}

.leaderboard-list::-webkit-scrollbar {
    /* Chrome / Safari */
    width: 0;
    height: 0; /* 兼容横向滚动条 */
}

.leaderboard-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;

    /* 固定行高，便于计算 5 行总高 */
    height: 46px; /* 你原来的内容 + 内边距正好 ≈ 46px */
    box-sizing: border-box;

    background: rgba(215, 204, 200, 0.3);
    border-radius: 10px;
}

/* Enhanced toggle button styling */
.toggle-btn {
    position: static;
    margin-top: 12px;
    align-self: center;

    /* Enhanced visual design */
    background: linear-gradient(
        135deg,
        rgba(180, 160, 140, 0.12),
        rgba(180, 160, 140, 0.06)
    );
    border: 1px solid rgba(180, 160, 140, 0.2);
    border-radius: 24px;
    padding: 8px 16px;
    min-width: 80px;
    width: 90%;

    /* Typography */
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    letter-spacing: 0.3px;

    /* Interactive states */
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* Glass effect enhancement */
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(180, 160, 140, 0.1);
    transform: translateY(-1px);
    z-index: 51;
}

.toggle-btn:hover {
    background: linear-gradient(
        135deg,
        rgba(180, 160, 140, 0.18),
        rgba(180, 160, 140, 0.1)
    );
    border-color: rgba(180, 160, 140, 0.3);

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(180, 160, 140, 0.15);
    color: #4e342e;
    z-index: 51;
}

.toggle-btn:active {
    /* transform: translateY(0); */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(180, 160, 140, 0.1);
}
/* ===== 展开 / 收起过渡 ===== */
.lb-enter-active,
.lb-leave-active {
    /* 高度 & 透明度同步动画 */
    transition: max-height 0.35s ease, opacity 0.35s ease;
    overflow: hidden; /* 防止收起时内容溢出 */
}
.lb-enter-from,
.lb-leave-to {
    max-height: 0; /* 收起态 */
    opacity: 0;
}
.lb-enter-to,
.lb-leave-from {
    max-height: 500px; /* 足够大的值即可 ≥ 列表最大高度 */
    opacity: 1;
}

/* ======= 新增：顶栏自适应布局 ======= */
.hud-top {
    position: absolute; /* 继续吸附到左上角 */
    top: 20px;
    left: 20px;
    right: 20px; /* 两边都贴 20px，让内部 flex 自排 */
    display: flex;
    gap: 20px;
    align-items: flex-start;
    z-index: 100; /* 保持在游戏画面上方 */
}

/* 在 style scoped 部分额外添加： */
.use-item-btn {
    position: absolute;
    top: 6px;
    left: 6px;
    padding: 2px 8px;
    font-size: 12px;
    color: #fff;
    background: rgba(141, 110, 99, 0.9);
    border: none;
    border-radius: 6px;
    cursor: pointer;
}
.use-item-btn:hover {
    background: rgba(141, 110, 99, 1);
}

/* ================= 480 px 以下：纵向堆叠 ================= */
@media (max-width: 768px) {
    .hud-top {
        position: static; /* 让整个顶栏回到文档流 */
        display: block; /* 垂直排布 */
        margin: 10px; /* 四周留点距离 */
    }

    /* 两张卡片都改成流式宽度 */
    .player-panel,
    .leaderboard-card {
        position: static !important; /* 取消绝对定位 */
        width: 100%;
        max-width: none;
        margin-bottom: 12px; /* 上下留白 */
    }

    /* 排行榜宽度别写死，按钮也跟着调 */
    .leaderboard-card {
        padding-bottom: 12px;
    }
    .toggle-btn {
        width: 100%;
    }
}

/* —— 保存存档按钮 —— */
.save-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 200;
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #8d6e63, #6d4c41);
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.2s, filter 0.2s;
}
.save-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
}
</style>
