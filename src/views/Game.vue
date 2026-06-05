<template>
    <div class="game-container" :style="backgroundStyle">
        <PlayerInfo ref="playerInfoRef" />
        <GameKeyHints />
        <!-- ---------- Game Scene ---------- -->
        <div v-show="showGameScene" class="game-scene">
            <!-- Scene Objects -->
            <div class="scene-objects">
                <!-- 木箱 -->
                <div
                    class="scene-object wooden-crate"
                    :class="{ highlighted: hoveredObject === 'crate' }"
                    :style="
                        getItemPositionStyle(
                            -1,
                            currentRoom.itemList.length + 1
                        )
                    "
                    @click="interactWith('crate')"
                    @mouseenter="hoveredObject = 'crate'"
                    @mouseleave="hoveredObject = null"
                >
                    <div class="object-icon">📦</div>
                </div>

                <!-- 动态渲染房间物品 -->
                <div
                    v-for="(item, idx) in currentRoom.itemList"
                    :key="item.itemId"
                    class="scene-object room-item"
                    :style="
                        getItemPositionStyle(
                            idx,
                            currentRoom.itemList.length + 1
                        )
                    "
                    :class="{
                        highlighted: hoveredObject === 'item-' + item.itemId
                    }"
                    @mouseenter="hoveredObject = 'item-' + item.itemId"
                    @mouseleave="hoveredObject = null"
                    @click.stop="pickupRoomItem(item)"
                >
                    <div class="object-icon">
                        {{ iconMap[item.itemName] || '🎒' }}
                    </div>
                    <div
                        v-if="hoveredObject === 'item-' + item.itemId"
                        class="item-tooltip"
                    >
                        {{ item.itemName }}<br />价值: {{ item.itemValue
                        }}<br />重量: {{ item.itemSize }}
                    </div>
                </div>
            </div>
        </div>

        <!-- ---------- Item Pickup Modal ---------- -->
        <div
            v-if="showItemPickup"
            class="item-pickup-overlay"
            @click="closeItemPickup"
        >
            <div class="item-pickup-modal" @click.stop>
                <div class="modal-header">
                    <h3>木箱中的物品</h3>
                    <button class="close-btn" @click="closeItemPickup">
                        ✕
                    </button>
                </div>
                <div class="items-grid">
                    <div
                        v-for="item in crateItems"
                        :key="item.id"
                        class="pickup-item"
                        :class="{
                            disabled: isItemTooHeavyForCrate(item)
                        }"
                        @click.stop="pickupItem(item)"
                    >
                        <div class="pickup-item-icon">{{ item.icon }}</div>
                        <div class="pickup-item-name">{{ item.name }}</div>
                        <div class="pickup-item-value">
                            价值: {{ item.value }}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <p
                        v-if="isBackpackFullForCrate"
                        class="inventory-full-warning"
                    >
                        背包空间不足！请先清理背包。
                    </p>
                </div>
            </div>
        </div>

        <!-- ---------- Scene Description ---------- -->
        <div class="scene-description">
            <p>{{ sceneDesc }}</p>
        </div>

        <!-- ---------- Action Messages ---------- -->
        <div v-if="actionMessage" class="action-message">
            {{ actionMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    ref,
    reactive,
    computed,
    onMounted,
    onBeforeUnmount,
    provide
} from 'vue'
import { playerApi, roomApi, backpackApi } from '@/api'
import { safeData } from '@/utils'
import { bus } from '@/utils/eventBus'

type FetchRoomFn = (roomId: number) => Promise<void>

import PlayerInfo from '../components/PlayerInfo.vue'
import GameKeyHints from '../components/GameKeyHints.vue'

// 在这里新增：用于存储"木箱"内物品的列表
const crateItems = ref<
    Array<{
        id: number
        name: string
        value: number
        size: number
        icon: string
    }>
>([]) // ← 新增

// 新增：点击木箱时的交互逻辑
async function interactWith(obj: string) {
    if (obj === 'crate') {
        // 直接使用已加载的 currentRoom.itemList，不再重复拉取房间数据
        crateItems.value = currentRoom.itemList.map(i => ({
            id: i.itemId,
            name: i.itemName,
            value: i.itemValue,
            size: i.itemSize,
            icon: iconMap[i.itemName] || '🎒'
        }))

        if (crateItems.value.length > 0) {
            showItemPickup.value = true
        } else {
            actionMessage.value = '箱子里什么都没有'
            setTimeout(() => (actionMessage.value = ''), 2000)
        }
    }
}

// 新增：监听"item-dropped"事件的回调
function handleItemDropped(payload: {
    itemId: number
    itemName: string
    itemSize: number
    itemValue: number
}) {
    console.log('[Game.vue] 收到 item-dropped 事件，payload =', payload)
    // 把这个物品对象加回 currentRoom.itemList
    currentRoom.itemList.push({
        itemId: payload.itemId,
        itemName: payload.itemName,
        itemSize: payload.itemSize,
        itemValue: payload.itemValue
    })
    // 可选：给个提示文字
    actionMessage.value = `已在房间内丢弃 ${payload.itemName}`
    setTimeout(() => (actionMessage.value = ''), 2000)
}

const playerInfoRef = ref<InstanceType<typeof PlayerInfo> | null>(null)

/* ---------- 当前房间名称对应的背景图映射 ---------- */
const roomBackgroundMap: Record<string, string> = {
    入口大厅: 'images/entrance_hall.png',
    古书图书馆: 'images/library.png',
    炼金实验室: 'images/alchemy_lab.png',
    兵器库: 'images/armory.png',
    机关走廊: 'images/mechanism_corridor.png',
    监狱牢房: 'images/prison_cell.png',
    秘密宝藏室: 'images/treasure_room.png',
    传送房间: 'images/teleport_room.png',
    最终祭坛: 'images/final_altar.png'
    // 如果出现新房间，请在这里继续补充对应图片
}

/**
 * 动态计算 backgroundStyle：
 * 1. 根据 currentRoom.roomName 从映射里找到对应的图片路径；
 * 2. 找不到时，使用默认背景 (/images/default_bg.png)；
 * 3. 最终返回一个包含 backgroundImage、no-repeat、cover、center 的 style 对象。
 */
const backgroundStyle = computed(() => {
    const imgPath =
        roomBackgroundMap[currentRoom.roomName] || 'images/entrance_hall.png'
    return {
        backgroundColor: '#1a1a2e',
        backgroundImage: `url('${imgPath}')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center center'
    }
})

/* ---------- 1. 新增：处理"传送房间"逻辑 ---------- */
/**
 * 修正后的 handleTeleport(): 进入传送房间后，
 * 1. 立即进入 3 秒倒计时（每秒更新 actionMessage）
 * 2. 倒计时结束后调用后端 trans 接口并刷新玩家、房间
 */
async function handleTeleport() {
    // 如果正在移动或倒计时中，就不再重复触发
    if (isMoving.value) return
    isMoving.value = true

    // 初始化倒计时秒数为 3
    let timeLeft = 3
    countdown.value = timeLeft
    actionMessage.value = `传送倒计时：${timeLeft} 秒` // ← 一定要用 .value 赋值，不要写成 actionMessage(...)
    setTimeout(() => (actionMessage.value = ''), 3000)
    // 每秒减少 1，更新倒计时文字
    const timerId = setInterval(() => {
        timeLeft--
        if (timeLeft > 0) {
            countdown.value = timeLeft
            actionMessage.value = `传送倒计时：${timeLeft} 秒`
        } else {
            // 倒计时结束
            clearInterval(timerId)
            countdown.value = null
            actionMessage.value = `传送中…`
            // ← 用 .value 赋值

            // 立刻执行真正的传送逻辑（不再二次延迟）
            ;(async () => {
                try {
                    console.log('[handleTeleport] 调用 playerApi.trans() 开始…')
                    const resTrans = await playerApi.trans()
                    console.log(
                        '[handleTeleport] playerApi.trans() 返回：',
                        resTrans.data
                    )

                    const { code, message } = resTrans.data
                    if (code !== 200) {
                        throw new Error(
                            `传送接口返回异常：code=${code}, message=${message}`
                        )
                    }

                    // 成功后用子组件的 initPlayer() 来刷新 player 和 room
                    if (playerInfoRef.value?.initPlayer) {
                        console.log(
                            '[handleTeleport] 传送成功，调用 playerInfoRef.initPlayer() 同步玩家信息…'
                        )
                        await playerInfoRef.value.initPlayer()
                        // 同步 Game.vue 自身的 player.roomId，避免后续操作（如 pickupRoomItem）使用旧值
                        if (currentRoom.roomId) {
                            player.roomId = currentRoom.roomId
                        }
                        console.log(
                            '[handleTeleport] initPlayer 完成，player.roomId 与 currentRoom 均已更新。'
                        )
                    } else {
                        console.warn(
                            '[handleTeleport] playerInfoRef.initPlayer 不存在，无法同步玩家信息。'
                        )
                    }

                    // currentRoom.roomName 已经被 initPlayer() 内部的 fetchRoom 刷新
                    actionMessage.value = `已传送到 ${currentRoom.roomName}`
                    setTimeout(() => {
                        actionMessage.value = ''
                    }, 2000)
                } catch (err: any) {
                    console.error('[handleTeleport] 传送过程中出错：', err)
                    actionMessage.value = '传送失败，请稍后重试'
                    setTimeout(() => {
                        actionMessage.value = ''
                    }, 2000)
                } finally {
                    isMoving.value = false
                    console.log(
                        '[handleTeleport] 传送结束，isMoving 重置为 false。'
                    )
                }
            })()
        }
    }, 1000)
}

const countdown = ref<number | null>(null) // 倒计时剩余秒数，null 表示未在倒计时中

/* ---------- 状态 ---------- */
/* -----------------  移动端判定 ----------------- */
const mobileQuery = window.matchMedia('(max-width: 768px)')
const isMobile = ref(mobileQuery.matches)

const showGameScene = ref(isMobile.value)

function handleToggleScene() {
    if (isMobile.value) showGameScene.value = isMobile.value // flag=true 显示；false 隐藏
}

function onMediaChange(e: MediaQueryListEvent) {
    isMobile.value = e.matches
    showGameScene.value = e.matches
}
mobileQuery.addEventListener('change', onMediaChange)

onMounted(() => {
    handleToggleScene()
    mobileQuery.addEventListener('change', e => {
        isMobile.value = e.matches
    })
    handleToggleScene()
    bus.on('toggle-scene', handleToggleScene)
})
onBeforeUnmount(() => {
    bus.off('toggle-scene', handleToggleScene)
    mobileQuery.removeEventListener('change', onMediaChange)
})

const player = reactive({
    id: 0,
    name: '',
    avatarUrl: '',
    score: 0,
    health: 0,
    maxHealth: 100,
    roomId: 1
})

interface BackpackItem {
    itemId: number
    itemName: string
    itemSize: number
    itemValue: number
}

interface BackpackState {
    backpackId: number | null
    backpackSize: number
    itemList: BackpackItem[]
}

const backpackInfo = reactive<BackpackState>({
    backpackId: null,
    backpackSize: 0,
    itemList: []
})

interface RoomItem {
    itemId: number
    itemName: string
    itemSize: number
    itemValue: number
}

interface RoomState {
    roomId: number | null
    roomName: string
    itemList: RoomItem[]
}

const currentRoom = reactive<RoomState>({
    roomId: null,
    roomName: '',
    itemList: []
})

const hoveredObject = ref<string | null>(null)
const actionMessage = ref('')
const showItemPickup = ref(false)

/** 箱子拾取：基于重量判断单件物品是否超重（灰显） */
const isItemTooHeavyForCrate = (item: { size: number }) => {
    const usedWeight = backpackInfo.itemList.reduce((sum, i) => sum + i.itemSize, 0)
    return usedWeight + item.size > backpackInfo.backpackSize
}

/** 箱子拾取：背包是否已满（所有物品都放不下） */
const isBackpackFullForCrate = computed(() => {
    const usedWeight = backpackInfo.itemList.reduce((sum, i) => sum + i.itemSize, 0)
    return crateItems.value.every(item => usedWeight + item.size > backpackInfo.backpackSize)
})

// 1. 定义一个对象，键名为房间名称，值为对应的故事化描述
const roomDescriptions: Record<string, string> = {
    入口大厅: `
    月光透过拱形的石窗，投射在古老的石砖地面上。你脚下的回声
    仿佛在提醒你，这里曾是昔日祭祀仪式的舞台。墙壁上斑驳的壁画
    隐约诉说着远古时代的秘密……`,
    古书图书馆: `
    书架高及天花，尘封的卷轴散发出陈旧的墨香。你听见微弱的风声
    从破裂的窗棂吹进，掀动一页页泛黄的页码。每一本古书都藏着
    解开遗迹谜题的蛛丝马迹。`,
    炼金实验室: `
    青铜试剂瓶在昏暗烛光下泛着幽绿光芒，各种符文刻印在石桌边缘。
    空气中充斥着硫磺与药草的气味，隐约能听见某个未完成实验的
    蒸汽嘶嘶作响。此处曾有人试图突破凡人之力的边界。`,
    兵器库: `
    冷光映照在整齐排列的长剑与战戟之上，刀刃似乎依旧寒冷。墙上
    钉着破碎的盾牌与战旗，似乎在诉说着一场惨烈的战斗曾在此处
    上演。当你拿起一把铁锤，能感受到它沉重的历史。`,
    机关走廊: `
    地砖上布满古老机关的暗格，偶尔有一块石板微微下沉，仿佛在
    试探你的脚步。远处传来机关齿轮咔嚓旋转的声响，每一步都可能
    触发未知陷阱。谨慎行走，否则下一秒就会掉进深渊。`,
    监狱牢房: `
    黯淡的烛火在铁栏之间摇曳，墙壁上还留有拷打时的铁链印痕。
    湿润的空气中弥漫着腐朽和绝望的气息。曾有多少羔羊在此低声
    哀嚎，如今只剩下孤寂的回音在诡异地回荡。`,
    秘密宝藏室: `
    一道机关墙缓缓移开，露出一个被金光笼罩的密室。宝箱上雕刻着
    奇异符号，箱内的珠玉映出你的倒影。每一件珠宝背后都藏着被
    遗忘的王朝传承，你能否从中找出开启下一个谜题的线索？`,
    传送房间: `
    圆形地面中央的符文阵依稀微亮，空气中弥漫着扭曲的时空气息。
    你踏上那空灵的符文，周围景象开始扭曲，仿佛下一刻就会被
    投射到未知的异域。做好迎接未知的准备。`,
    最终祭坛: `
    巨大的石柱将穹顶支撑在头顶，祭坛中央悬浮着一颗幽蓝色的古玉。
    四周壁画描绘着世界毁灭与重生的图景，当你走近，耳畔仿佛听到
    古老吟唱回荡。此刻，一切谜题的终极秘密都将显现……`
}

// 2. 修改 computed：优先取自定义故事化文本，否则回退到简单提示
const sceneDesc = computed(() => {
    const name = currentRoom.roomName
    const desc = roomDescriptions[name]
    if (desc) {
        return `你来到了「${name}」: ` + desc.trim().replace(/\n\s*/g, '')
    }
    return `你来到了「${name}」。`
})

/* ---------- 工具 ---------- */

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

/* ---------- 键盘控制 ---------- */
function handleKeydown(e: KeyboardEvent) {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    switch (e.key.toLowerCase()) {
        case 'w':
            move('up')
            break
        case 'a':
            move('left')
            break
        case 's':
            move('down')
            break
        case 'd':
            move('right')
            break
        case 'q':
            showGameScene.value = !showGameScene.value
            break
        case 'r': // ← 新增
            back()
            break
        case 'h': // 新增按键 h 回到初始房间
            goHome()
            break
    }
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

/* ---------- 拾取逻辑 ---------- */
function closeItemPickup() {
    showItemPickup.value = false
}

/* ---------- 重写 fetchBackpack，去掉参数，正确赋值 ---------- */
async function fetchBackpack() {
    try {
        const res = await backpackApi.getList()
        console.log('[fetchBackpack] raw res.data:', res.data)

        // 后端 data 结构可能是 { code, msg, data: {...} }
        const payload = (res.data.data ?? res.data) as {
            backpackId: number
            backpackSize: number
            itemList: Array<{
                itemId: number
                itemName: string
                itemSize: number
                itemValue: number
            }>
        }

        backpackInfo.backpackId = payload.backpackId
        backpackInfo.backpackSize = payload.backpackSize
        backpackInfo.itemList = payload.itemList || []
        console.log('[fetchBackpack] updated:', backpackInfo.itemList)
    } catch (e) {
        console.error('[fetchBackpack] error:', e)
    }
}

async function fetchRoom(roomId: number) {
    try {
        const res = await roomApi.getInfo(roomId)
        // —— 先把后端到底返回什么打印一下，帮助下一步调试 ——
        const d = safeData(res)
        console.log('[fetchRoom] raw data:', d)

        // —— 映射 roomId 和 roomName ——
        //    如果后端返回的是 snake_case，就用 d.room_id/d.room_name；
        //    如果是驼峰，就用 d.roomId/d.roomName。
        currentRoom.roomId = d.room_id ?? d.roomId ?? null
        currentRoom.roomName = d.room_name ?? d.roomName ?? ''

        // —— 映射物品列表 （兼容 item_list 或 itemList） ——
        const rawItems = d.item_list ?? d.itemList ?? d.items ?? []
        currentRoom.itemList = rawItems.map((i: any) => ({
            itemId: i.item_id ?? i.itemId,
            itemName: i.item_name ?? i.itemName,
            itemSize: i.item_size ?? i.itemSize,
            itemValue: i.item_value ?? i.itemValue
        }))
    } catch (e) {
        console.error('[fetchRoom] 请求或映射失败：', e)
    }
}
/* ---------- 移动 ---------- */
const isMoving = ref(false)

/**
 * 修改后的 move():
 *  在调用后端移动接口获取 newRoomId 并拉取房间信息后，
 *  如果"即将进入"的房间是"传送房间"，则直接触发传送逻辑；否则按原流程显示"移动到 XXX"。
 */
async function move(direction: 'up' | 'down' | 'left' | 'right') {
    if (isMoving.value) return
    isMoving.value = true
    console.log('[move] 准备移动，方向 =', direction)

    try {
        // 1. 调用后端移动接口，获取 newRoomId
        console.log('[move] 调用 playerApi.move() 开始')
        const resMove = await playerApi.move(direction)
        console.log('[move] playerApi.move() 返回 res.data =', resMove.data)

        const { code, message, data } = resMove.data
        if (code !== 200 || message !== 'success') {
            console.warn(
                '[move] 后端移动接口返回失败，code =',
                code,
                'message =',
                message
            )
            throw new Error(`后端返回失败，code=${code}, message=${message}`)
        }
        const newRoomId = (data as any).roomId
        console.log('[move] 服务器返回新的房间 ID =', newRoomId)

        // 2. 拉取最新玩家信息，更新 player 对象
        console.log('[move] 调用 playerApi.getInfo() 获取最新玩家信息')
        const resInfo = await playerApi.getInfo()
        console.log('[move] playerApi.getInfo() 返回 =', resInfo.data)
        const p = safeData(resInfo) as {
            playerId: number
            playerName: string
            playerAvatarUrl: string
            playerScore: number
            playerRoomId: number
            playerStamina?: number
            playerMaxStamina?: number
        }
        Object.assign(player, {
            id: p.playerId,
            name: p.playerName,
            avatarUrl: p.playerAvatarUrl,
            score: p.playerScore,
            health: p.playerStamina ?? player.health,
            maxHealth: p.playerMaxStamina ?? player.maxHealth
        })
        console.log('[move] 前端 player 更新后 =', { ...player })

        // 3. 更新 player.roomId 并拉取该房间详情
        player.roomId = newRoomId
        console.log('[move] 调用 fetchRoom(roomId =', newRoomId, ')')
        await fetchRoom(newRoomId)
        console.log('[move] fetchRoom 完成后 currentRoom =', { ...currentRoom })

        //显示"成功移动到 XXX"提示
        actionMessage.value = `成功移动到 ${currentRoom.roomName}`
        setTimeout(() => {
            actionMessage.value = ''
        }, 2000)
    } catch (err: any) {
        console.error('[move] 捕获到错误：', err)
        actionMessage.value = '这个方向没有门'
        setTimeout(() => {
            actionMessage.value = ''
        }, 2000)
    } finally {
        isMoving.value = false
        console.log('[move] 移动结束，isMoving 置为 false。')
    }
    // 在 move() 函数末尾，fetchRoom 后添加：
    if (currentRoom.roomName === '传送房间') {
        actionMessage.value = `你已进入了传送房间，稍后将会执行传送`
        setTimeout(() => (actionMessage.value = ''), 1000)
        console.log('[move] 移动后检测到进入"传送房间"，开始传送流程')
        handleTeleport()
    }
}

/* ---------- 回到上一个房间 ---------- */
async function back() {
    if (isMoving.value) return // 防抖
    isMoving.value = true
    console.log('[back] 调用 playerApi.back() …')

    try {
        // 1. 后端接口
        const resBack = await playerApi.back()
        const { code, msg, data } = resBack.data // ← 用 msg
        console.log('[back] 返回 data =', resBack.data)
        if (code !== 200) {
            throw new Error(`返回上一个房间失败：code=${code}, msg=${msg}`)
        }
        const newRoomId = data.newRoomId // 后端示例里字段叫 roomId
        console.log('[back] 新房间 ID =', newRoomId)

        // 2. 刷新玩家信息
        const resInfo = await playerApi.getInfo()
        const p = safeData(resInfo)
        Object.assign(player, {
            id: p.playerId,
            name: p.playerName,
            avatarUrl: p.playerAvatarUrl,
            score: p.playerScore,
            health: p.playerStamina ?? player.health,
            maxHealth: p.playerMaxStamina ?? player.maxHealth
        })
        player.roomId = newRoomId

        // 3. 拉取房间
        await fetchRoom(newRoomId)

        // 4. 提示
        actionMessage.value = `你回到了 ${currentRoom.roomName}`
        setTimeout(() => (actionMessage.value = ''), 2000)

        // 5. 如果上一个房间恰好是「传送房间」，继续触发传送
        if (currentRoom.roomName === '传送房间') {
            actionMessage.value = '进入传送房间，开始倒计时…'
            setTimeout(() => (actionMessage.value = ''), 1000)
            handleTeleport()
        }
    } catch (err) {
        console.error('[back] 出错：', err)
        actionMessage.value = '已在最初房间，无法再后退'
        setTimeout(() => (actionMessage.value = ''), 2000)
    } finally {
        isMoving.value = false
    }
}

async function goHome() {
    if (isMoving.value) return
    isMoving.value = true
    console.log('[goHome] 调用 playerApi.home() …')

    try {
        const res = await playerApi.home()
        const { code, message } = res.data
        if (code !== 200) {
            throw new Error(`回到初始房间失败：${message || '未知错误'}`)
        }

        // 然后调用 getInfo() 获取最新的 roomId
        const resInfo = await playerApi.getInfo()
        const p = safeData(resInfo)
        Object.assign(player, {
            id: p.playerId,
            name: p.playerName,
            avatarUrl: p.playerAvatarUrl,
            score: p.playerScore,
            health: p.playerStamina ?? player.health,
            maxHealth: p.playerMaxStamina ?? player.maxHealth,
            roomId: p.playerRoomId
        })

        await fetchRoom(player.roomId)

        actionMessage.value = `你已回到初始房间：${currentRoom.roomName}`
        setTimeout(() => (actionMessage.value = ''), 2000)

        if (currentRoom.roomName === '传送房间') {
            actionMessage.value = '进入传送房间，开始倒计时…'
            setTimeout(() => (actionMessage.value = ''), 1000)
            handleTeleport()
        }
    } catch (err) {
        console.error('[goHome] 出错：', err)
        actionMessage.value = '无法回到初始房间，请稍后重试'
        setTimeout(() => (actionMessage.value = ''), 2000)
    } finally {
        isMoving.value = false
    }
}

/* ---------- 场景工具 ---------- */
function getItemPositionStyle(idx: number, total: number) {
    // ─── 让木箱排在第 0 位 ───
    const realIdx = idx < 0 ? 0 : idx + 1

    /* ---------- 计算网格 ---------- */
    const cols = Math.ceil(Math.sqrt(total)) // 列数
    const rows = Math.ceil(total / cols) // 行数
    const colNo = realIdx % cols
    const rowNo = Math.floor(realIdx / cols)

    // 取该格中心的百分比坐标
    const xPercent = ((colNo + 0.5) / cols) * 100
    const yPercent = ((rowNo + 0.5) / rows) * 100

    // 80 px = 物品宽/高，减一半让中心点对准格心
    return {
        position: 'absolute' as const,
        left: `calc(${xPercent}% - 40px)`,
        top: `calc(${yPercent}% - 40px)`,
        zIndex: 2
    }
}

function getTotalValue() {
    return backpackInfo.itemList.reduce((t, i) => t + i.itemValue, 0)
}
function getCurrentWeight() {
    return backpackInfo.itemList.reduce((t, i) => t + i.itemSize, 0)
}

/** 1. 从当前房间拾取单个物品 → 只传数字 itemId → 刷新背包 → 调用 initPlayer() → 日志 + 提示 */
async function pickupRoomItem(item: {
    itemId: number
    itemName: string
    itemSize: number
    itemValue: number
}) {
    console.log('[pickupRoomItem] 开始捡取场景物品：', item)

    await fetchBackpack()

    // 1. 容量检查
    const usedWeight = backpackInfo.itemList.reduce(
        (sum, i) => sum + i.itemSize,
        0
    )
    if (usedWeight + item.itemSize > backpackInfo.backpackSize) {
        console.warn('[pickupRoomItem] 背包空间不足，无法捡取')
        actionMessage.value = '背包空间不足！'
        setTimeout(() => (actionMessage.value = ''), 3000)
        return
    }

    try {
        // 2. 调后端接口：只传数字 itemId
        console.log(
            '[pickupRoomItem] 调用 backpackApi.pickItem，itemId =',
            item.itemId
        )
        const resPick = await backpackApi.pickItem(item.itemId)
        console.log(
            '[pickupRoomItem] backpackApi.pickItem 返回：',
            resPick.data
        )

        // 3. 从场景中移除该物品
        // currentRoom.itemList = currentRoom.itemList.filter(
        //     i => i.itemId !== item.itemId
        // )
        // console.log('[pickupRoomItem] 已移除 currentRoom.itemList 中该物品')
        await fetchRoom(player.roomId)

        // 4. 刷新背包列表
        console.log('[pickupRoomItem] 调用 fetchBackpack() 刷新背包')
        await fetchBackpack()
        bus.emit('backpack-updated')
        console.log('[pickupRoomItem] 已刷新背包')

        // 5. 调用 PlayerInfo.initPlayer() 同步最新玩家信息
        if (playerInfoRef.value?.initPlayer) {
            console.log(
                '[pickupRoomItem] 调用 playerInfoRef.value.initPlayer()'
            )
            await playerInfoRef.value.initPlayer()
            console.log(
                '[pickupRoomItem] playerInfoRef.value.initPlayer() 已完成'
            )
        } else {
            console.warn(
                '[pickupRoomItem] playerInfoRef.value.initPlayer 不存在'
            )
        }

        // 6. 提示
        actionMessage.value = `已拾取 ${item.itemName}，玩家信息已同步`
        setTimeout(() => (actionMessage.value = ''), 3000)
        console.log('[pickupRoomItem] 操作完成')
    } catch (err: any) {
        console.error('[pickupRoomItem] 出错：', err.response || err)
        actionMessage.value = '拾取失败，请查看控制台'
        setTimeout(() => (actionMessage.value = ''), 3000)
    }
}

/** 2. 从箱子中拾取单件物品 → 只传数字 id → 刷新背包 → 调用 initPlayer() → 日志 + 提示 */
async function pickupItem(item: { id: number; name: string; value: number; size: number }) {
    console.log('[pickupItem] 开始从箱子中拾取：', item)

    // 1. 容量检查（基于重量）
    const usedWeight = backpackInfo.itemList.reduce(
        (sum, i) => sum + i.itemSize,
        0
    )
    if (usedWeight + item.size > backpackInfo.backpackSize) {
        console.warn('[pickupItem] 背包空间不足，无法捡取')
        actionMessage.value = '背包空间不足！'
        setTimeout(() => (actionMessage.value = ''), 3000)
        return
    }

    try {
        // 2. 调后端接口：只传数字 id
        console.log('[pickupItem] 调用 backpackApi.pickItem，itemId =', item.id)
        const resPick = await backpackApi.pickItem(item.id)
        console.log('[pickupItem] backpackApi.pickItem 返回：', resPick.data)

        // 3. 刷新背包列表
        console.log('[pickupItem] 调用 fetchBackpack() 刷新背包')
        await fetchBackpack()
        bus.emit('backpack-updated')
        console.log('[pickupItem] 已刷新背包')

        // 4. 从 crateItems 中移除该物品
        crateItems.value = crateItems.value.filter(c => c.id !== item.id)
        console.log('[pickupItem] 已从 crateItems 中移除该物品')

        // 4.5. 同步从 currentRoom.itemList 中移除，防止下次打开木箱时幽灵物品重现
        currentRoom.itemList = currentRoom.itemList.filter(i => i.itemId !== item.id)
        console.log('[pickupItem] 已从 currentRoom.itemList 中移除该物品')

        // 5. 调用 PlayerInfo.initPlayer() 同步最新玩家信息
        if (playerInfoRef.value?.initPlayer) {
            console.log('[pickupItem] 调用 playerInfoRef.value.initPlayer()')
            await playerInfoRef.value.initPlayer()
            console.log('[pickupItem] playerInfoRef.value.initPlayer() 已完成')
        } else {
            console.warn('[pickupItem] playerInfoRef.value.initPlayer 不存在')
        }

        // 6. 提示 & 关闭弹窗（如果箱子已空）
        actionMessage.value = `已拾取 ${item.name}，玩家信息已同步`
        setTimeout(() => (actionMessage.value = ''), 3000)

        if (crateItems.value.length === 0) {
            console.log('[pickupItem] crateItems 已空，关闭弹窗')
            closeItemPickup()
        }
        console.log('[pickupItem] 操作完成')
    } catch (err: any) {
        console.error('[pickupItem] 出错：', err.response || err)
        actionMessage.value = '拾取失败，请查看控制台'
        setTimeout(() => (actionMessage.value = ''), 3000)
    }
}

/* ---------- 初始化 ---------- */
onMounted(async () => {
    try {
        // 【新增】先让子组件初始化"玩家信息 + 房间加载"
        if (
            playerInfoRef.value &&
            typeof playerInfoRef.value.initPlayer === 'function'
        ) {
            await playerInfoRef.value.initPlayer()
        } else {
            console.warn('Game.vue: 找不到 playerInfoRef 或 initPlayer 方法')
        }

        const res = await playerApi.getInfo()
        const p = safeData(res)
        player.id = p.playerId
        player.name = p.playerName
        player.avatarUrl = p.playerAvatarUrl
        player.score = p.playerScore
        player.roomId = p.playerRoomId
        bus.emit('player-score-updated', player.score)
        // …如果还有 health/maxHealth，也同步映射…
        // 玩家拿到后，马上拉背包
        await fetchBackpack()

        await fetchRoom(player.roomId)
    } catch (e) {
        console.error(e)
    }
    bus.on('item-dropped', handleItemDropped)
})
onBeforeUnmount(() => {
    // —— 新增：解绑"item-dropped"
    bus.off('item-dropped', handleItemDropped)
})

provide<FetchRoomFn>('fetchRoom', fetchRoom)
</script>

<style scoped>
.game-container {
    width: 100%;
    height: 100vh;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    color: #fff;
    font-family: 'Arial', sans-serif;
    overflow: hidden;
    position: relative;
}

/* ---------- 场景 ---------- */
.game-scene {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 45%;
    height: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}
/* ---------- 物体 ---------- */
.scene-objects {
    position: relative;
    width: 100%;
    height: 100%;
}
.scene-object {
    position: absolute;
    cursor: pointer;
    transition: all 0.3s ease;
}
.scene-object:hover,
.scene-object.highlighted {
    transform: translateY(-5px);
}
.wooden-crate,
.room-item {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
}
.wooden-crate {
    background: linear-gradient(135deg, #a1887f, #795548);
    border: 2px solid #5d4037;
}
.room-item {
    background: linear-gradient(135deg, #d7ccc8, #bcaaa4);
    border: 2px solid #a1887f;
    box-shadow: 0 4px 16px rgba(161, 136, 127, 0.2);
}
.room-item.highlighted {
    box-shadow: 0 0 16px 4px rgba(180, 160, 140, 0.4);
    transform: translateY(-6px) scale(1.08);
    border-color: #bcaaa4;
}
.object-icon {
    font-size: 32px;
}

/* ---------- 物品提示 ---------- */
.item-tooltip {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(62, 39, 35, 0.95);
    color: #efebe9;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    pointer-events: none;
    z-index: 10;
    text-align: center;
    min-width: 100px;
    border: 1px solid rgba(180, 160, 140, 0.3);
}
.item-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    border-width: 8px;
    border-style: solid;
    border-color: rgba(62, 39, 35, 0.95) transparent transparent transparent;
}

/* ---------- 拾取弹窗 ---------- */
.item-pickup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(62, 39, 35, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
}
.item-pickup-modal {
    background: linear-gradient(135deg, #efebe9, #d7ccc8);
    border-radius: 20px;
    padding: 30px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    border: 2px solid rgba(180, 160, 140, 0.3);
    animation: slideUp 0.3s ease;
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    border-bottom: 2px solid rgba(180, 160, 140, 0.3);
    padding-bottom: 15px;
}
.modal-header h3 {
    margin: 0;
    font-size: 24px;
    color: #4e342e;
}
.close-btn {
    background: none;
    border: none;
    color: #8d6e63;
    font-size: 24px;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: all 0.3s ease;
}
.close-btn:hover {
    color: #4e342e;
    background: rgba(180, 160, 140, 0.15);
}
.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
}
.pickup-item {
    background: linear-gradient(135deg, #d7ccc8, #bcaaa4);
    border-radius: 15px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid rgba(180, 160, 140, 0.2);
}
.pickup-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    border-color: rgba(180, 160, 140, 0.5);
}
.pickup-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.pickup-item.disabled:hover {
    transform: none;
    box-shadow: none;
}
.pickup-item-icon {
    font-size: 36px;
    margin-bottom: 10px;
}
.pickup-item-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
    color: #4e342e;
}
.pickup-item-value {
    font-size: 14px;
    color: #6d4c41;
}
.modal-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    border-top: 2px solid rgba(180, 160, 140, 0.3);
    padding-top: 20px;
}
.inventory-full-warning {
    color: #e53935;
    font-weight: bold;
}

/* ---------- 文字提示 ---------- */
.scene-description {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(62, 39, 35, 0.85);
    padding: 20px 40px;
    border-radius: 25px;
    max-width: 800px;
    font-size: 18px;
    border: 2px solid rgba(180, 160, 140, 0.3);
}
.action-message {
    position: absolute;
    top: 120px;
    right: 20px;
    background: rgba(141, 110, 99, 0.9);
    color: #fff;
    padding: 15px 20px;
    border-radius: 8px;
    font-weight: bold;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    z-index: 999;
}

/* ---------- 动画 ---------- */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
    .game-scene {
        height: 25%;
        position: absolute;
        top: 60%;
    }
    .scene-description {
        bottom: 20px;
        font-size: 16px;
        padding: 15px 25px;
    }
    .item-pickup-modal {
        padding: 20px;
        margin: 10px;
    }
    .items-grid {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
    }
}
</style>