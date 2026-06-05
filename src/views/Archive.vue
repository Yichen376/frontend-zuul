<template>
    <div class="login-page">
        <!-- --- Game Save Area --- -->
        <div class="game-save-container">
            <div class="save-panel">
                <!-- header -->
                <div class="panel-header">
                    <button
                        class="close-btn"
                        title="Back to Login"
                        @click="backHome"
                    >
                        ✖️
                    </button>
                    <h2 class="panel-title">
                        <span class="title-icon">🎮</span> 当前游戏存档
                    </h2>
                    <p class="panel-subtitle">选择你的身份</p>
                </div>

                <!-- slots -->
                <div class="save-slots">
                    <!-- 只对 gameSaves 里的实际存档做 v-for -->
                    <div
                        v-for="(save, idx) in gameSaves"
                        :key="save.saveId"
                        class="save-slot"
                        :class="{ selected: selectedSave === idx }"
                        @click="loadSave(save.saveId, idx)"
                    >
                        <!-- 这里是已有存档的样式 -->
                        <div class="slot-number">{{ idx + 1 }}</div>
                        <div class="save-content">
                            <div class="save-info">
                                <h3 class="save-name">
                                    Save #{{ save.saveId }}
                                </h3>
                                <div class="save-details">
                                    <span class="level"
                                        >Score {{ save.playerScore }}</span
                                    >
                                    <span class="location"
                                        >Stamina {{ save.playerStamina }}</span
                                    >
                                    <span class="location"
                                        >Room {{ save.playerRoomId }}</span
                                    >
                                </div>
                                <div class="save-meta">
                                    <span class="date">{{
                                        formatDate(save.saveTime)
                                    }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="slot-actions">
                            <button
                                class="action-btn delete-btn"
                                title="Delete Save"
                                @click.stop="deleteSave(save.saveId)"
                            >
                                删除
                            </button>
                        </div>
                    </div>

                    <!-- 下面这个“新的开始”槽，务必不要让它走 loadSave() -->
                    <div class="save-slot empty-slot" @click="newGame">
                        <div class="empty-content">
                            <div class="empty-icon">+</div>
                            <span class="empty-text">新的开始</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameApi } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()

// 最终存放给模板渲染的数组，每个对象都是 { saveId, playerScore, playerStamina, playerRoomId, saveTime }
const gameSaves = ref([])
// 当前选中的是哪个索引（0-based）
const selectedSave = ref(null)

/**
 * 1. 拉取存档列表，并做从下划线字段到驼峰字段的映射
 */
async function fetchSaves() {
    try {
        console.log('>> fetchSaves: 调用 gameApi.getList() …')
        const res = await gameApi.getList()
        console.log('>> fetchSaves: raw res =', res)
        console.log('>> fetchSaves: raw res.data =', res.data)

        if (!res.data || res.data.code !== 200) {
            console.error('>> fetchSaves: 接口返回异常', res.data)
            throw new Error(res.data?.message || 'fetchSaves: 后端返回错误')
        }

        // 1. 先看一下后端到底返回了什么字段
        console.log('>> fetchSaves: raw list =', res.data.data)
        res.data.data.forEach((item, i) => {
            console.log(`>> fetchSaves: data[${i}] =`, item)
        })

        // 2. 根据接口文档示例，后端 data 中的每一项长这样：
        //    {
        //      saveId: 17,
        //      playerId: 42,
        //      saveTime: "2025-05-25T14:30:45",
        //      playerScore: 1200,
        //      playerStamina: 76,
        //      playerRoomId: 5
        //    }
        //
        //    因此，我们不用再去读下划线字段，直接按驼峰字段把它映射到前端需要的格式：
        gameSaves.value = res.data.data.map(item => {
            const mapped = {
                saveId: item.saveId, // 后端的 saveId → 前端 saveId
                playerScore: item.playerScore, // 后端的 playerScore → 前端 playerScore
                playerStamina: item.playerStamina, // 后端的 playerStamina → 前端 playerStamina
                playerRoomId: item.playerRoomId, // 后端的 playerRoomId → 前端 playerRoomId
                saveTime: item.saveTime // 后端的 saveTime → 前端 saveTime
                // 如果你还需要展示 playerId 或其他字段，可以按需加到这里
            }
            console.log('>> fetchSaves: mapped item =', mapped)
            return mapped
        })

        console.log('>> fetchSaves: 最终 gameSaves.value =', gameSaves.value)

        // 3. 列表不为空就默认选中第 0 条
        selectedSave.value = gameSaves.value.length > 0 ? 0 : null
        console.log(
            '>> fetchSaves: 设置 selectedSave.value =',
            selectedSave.value
        )
    } catch (err) {
        console.error('>> fetchSaves: 捕获到错误 ->', err)
    }
}

/**
 * 2. 点击某条存档时，调用后端“读取存档”接口
 * @param {number} saveId  // 从 gameSaves 中映射得到的驼峰字段
 * @param {number} idx     // 在 gameSaves 中的索引
 */
async function loadSave(saveId, idx) {
    try {
        console.log(`>> loadSave: 收到 saveId = ${saveId}, idx = ${idx}`)
        selectedSave.value = idx
        console.log(
            '>> loadSave: 更新 selectedSave.value =',
            selectedSave.value
        )

        // —— 关键修改在这里 ——
        // 后端示例里读取存档接口接收的字段名是 "saveId"，而不是 "save_id"
        console.log('>> loadSave: 正在调用 gameApi.read({ saveId }) …')
        const res = await gameApi.read({ saveId })
        console.log('>> loadSave: gameApi.read raw res =', res)
        console.log('>> loadSave: gameApi.read raw res.data =', res.data)

        if (!res.data) {
            console.error('>> loadSave: res.data 为 null/undefined')
            throw new Error('loadSave: 后端没有返回数据')
        }
        // 后端返回示例（code:200 时）应该是：
        // {
        //   code: 200,
        //   message: "got record",
        //   data: {
        //     saveId: 1,
        //     playerId: 1,
        //     saveTime: "2025-05-31T15:08:55",
        //     playerScore: 0,
        //     playerStamina: -8,
        //     playerRoomId: 12,
        //     playerBackpackId: 1
        //   }
        // }
        if (res.data.code !== 200 || !res.data.data) {
            console.error('>> loadSave: 返回 code ≠ 200 或 data 为空', res.data)
            throw new Error(res.data.message || 'save record not found')
        }

        // 拿到后端返回的完整存档对象
        const rawSave = res.data.data
        console.log('>> loadSave: rawSave =', rawSave)

        // 下面示例里直接把 rawSave 序列化到 query，/game 页面再自己做解码
        const encoded = encodeURIComponent(JSON.stringify(rawSave))
        console.log('>> loadSave: encodeURIComponent =', encoded)

        router.push({
            path: '/game',
            query: { save: encoded }
        })
        console.log('>> loadSave: 已跳转 /game?save=…')
    } catch (err) {
        console.error('>> loadSave: 捕获到错误 ->', err)
        alert('读取存档出错：' + err.message)
    }
}

/**
 * 3. 删除某条存档
 * @param {number} saveId
 */
async function deleteSave(saveId) {
    if (!confirm('确认删除此存档？')) {
        console.log('>> deleteSave: 用户取消删除，saveId =', saveId)
        return
    }

    try {
        console.log(
            `>> deleteSave: 调用 gameApi.delete({ save_id: ${saveId} }) …`
        )
        const res = await gameApi.delete({ saveId })
        console.log('>> deleteSave: gameApi.delete raw res =', res)
        console.log('>> deleteSave: gameApi.delete raw res.data =', res.data)

        if (!res.data || res.data.code !== 200) {
            console.error('>> deleteSave: 删除失败，返回 =', res.data)
            throw new Error(res.data?.message || 'deleteSave: 后端删除失败')
        }

        console.log('>> deleteSave: 删除成功，saveId =', saveId)

        // 方式一：局部删除并重置选中
        gameSaves.value = gameSaves.value.filter(s => s.saveId !== saveId)
        console.log('>> deleteSave: 过滤后 gameSaves.value =', gameSaves.value)
        selectedSave.value = gameSaves.value.length > 0 ? 0 : null
        console.log(
            '>> deleteSave: 更新 selectedSave.value =',
            selectedSave.value
        )

        // （方式二：也可以直接 await fetchSaves() 重新拉完整列表）
    } catch (err) {
        console.error('>> deleteSave: 捕获到错误 ->', err)
        alert('删除存档出错：' + err.message)
    }
}

// 新游戏
async function newGame() {
    console.log('>> newGame: 点击“新的开始”')

    try {
        // ① 用 await 拿到真正的 response
        const res = await gameApi.new()

        // ② 再去判断 res.data.code
        if (!res.data || res.data.code !== 200) {
            throw new Error(res.data?.msg || '后端返回异常')
        }

        console.log('>> newGame: 创建成功，后端返回 =', res.data)
        router.push('/game')
    } catch (err) {
        console.error('>> newGame: 出错 =', err)
        alert(err.message || '新游戏创建失败')
    }
}

// 返回登录页
function backHome() {
    console.log('>> backHome: 返回登录')
    router.push('/welcome/login')
}

// 格式化时间字符串
function formatDate(t) {
    // 后端的 t 格式是 "2025-05-31 15:08:55"，dayjs 能直接解析
    return dayjs(t).format('YYYY-MM-DD HH:mm')
}

// 页面一载入就拉列表
onMounted(fetchSaves)
</script>

<style scoped>
/****************** Game Save Area ******************/
.game-save-container {
    position: relative;
    z-index: 10;
    /* 去掉固定 padding，改为相对更灵活的内边距 */
    width: 100%;
    padding: 20px;
}

/* 改动：.save-panel 由固定宽度改为最大宽度，并居中 */
.save-panel {
    background: rgba(245, 240, 230, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(180, 160, 140, 0.2);
    overflow: hidden;
    animation: slideInUp 0.6s ease-out;
    /* 由 width: 600px 修改为下方两行 */
    width: 100%;
    max-width: 600px;
    margin: 0 auto; /* 居中 */
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.panel-header {
    padding: 30px 30px 20px;
    text-align: center;
    background: linear-gradient(
        135deg,
        rgba(180, 160, 140, 0.12),
        rgba(141, 110, 99, 0.12)
    );
    border-bottom: 1px solid rgba(180, 160, 140, 0.15);
}

.panel-title {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: bold;
    color: #4e342e;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.title-icon {
    font-size: 32px;
}

.panel-subtitle {
    margin: 0;
    color: #8d6e63;
    font-size: 16px;
}

.save-slots {
    padding: 20px 30px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
}

.save-slot {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: rgba(239, 235, 233, 0.8);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.save-slot:hover {
    background: rgba(215, 204, 200, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.save-slot.selected {
    border-color: #bcaaa4;
    background: rgba(180, 160, 140, 0.1);
}

.save-slot.empty-slot {
    border: 2px dashed #bcaaa4;
    background: rgba(239, 235, 233, 0.5);
}

.save-slot.empty-slot:hover {
    border-color: #a1887f;
    background: rgba(215, 204, 200, 0.7);
}

/* 编号圆圈 */
.slot-number {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #8d6e63;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    margin-right: 16px;
}

/* 存档内容区 */
.save-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
}

/* 存档信息 */
.save-info {
    flex: 1;
}

.save-name {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: bold;
    color: #4e342e;
}

/* 存档详细信息：分数、耐力、房间号 */
.save-details {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
}

.level,
.location {
    font-size: 14px;
    color: #8d6e63;
    font-weight: 500;
}

/* 存档元数据（时间） */
.save-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #8d6e63;
}

/* 如果需要显示头像，可放在这里 */
.character-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 20px;
}

/* “新的开始” 槽 */
.empty-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #a1887f;
}

.empty-icon {
    font-size: 24px;
    font-weight: bold;
}

.empty-text {
    font-size: 16px;
    font-weight: 500;
}

/* 操作按钮删除 */
.slot-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.save-slot:hover .slot-actions {
    opacity: 1;
}

.action-btn {
    background: red;
    color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    transform: scale(1.05);
}

.panel-actions {
    padding: 20px 30px;
    display: flex;
    gap: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.action-button {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.load-btn {
    background: linear-gradient(135deg, #8d6e63, #6d4c41);
    color: white;
}

.load-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #6d4c41, #4e342e);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(141, 110, 99, 0.4);
}

.load-btn:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
}

.settings-btn {
    background: rgba(107, 114, 128, 0.1);
    color: #374151;
    border: 1px solid rgba(107, 114, 128, 0.2);
}

.settings-btn:hover {
    background: rgba(107, 114, 128, 0.2);
    transform: translateY(-2px);
}

.btn-icon {
    font-size: 14px;
}

.panel-footer {
    padding: 15px 30px;
    text-align: center;
    border-top: 1px solid rgba(180, 160, 140, 0.15);
    background: rgba(239, 235, 233, 0.5);
}

.game-version {
    font-size: 12px;
    color: #a1887f;
}

.close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    border: none;
    background-color: transparent;
    cursor: pointer;
}

/*================= Responsive Design =================*/
@media (max-width: 1024px) {
    /* 中等屏幕（例如平板）下，稍微缩小保存面板的内边距 */
    .panel-header {
        padding: 25px 25px 15px;
    }
    .panel-title {
        font-size: 24px;
    }
    .save-slots {
        padding: 18px 24px;
    }
    .panel-actions {
        padding: 18px 24px;
    }
}

@media (max-width: 768px) {
    /* 小屏幕做更大幅度调整 */
    .game-save-container {
        max-width: 90%;
        padding: 10px;
    }

    .panel-header {
        padding: 20px;
    }

    .panel-title {
        font-size: 22px;
    }

    .panel-subtitle {
        font-size: 14px;
    }

    .save-slots {
        padding: 15px 20px;
    }

    /* save-slot 内部改为上下堆叠 */
    .save-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    .save-details {
        flex-wrap: wrap; /* 如果显示项过多，则自动换行 */
    }

    /* 缩小头像尺寸（如果使用头像的话） */
    .character-avatar {
        width: 40px;
        height: 40px;
        font-size: 16px;
    }

    /* 操作按钮始终可见，位置改为行内 */
    .slot-actions {
        opacity: 1;
        position: static;
        margin-left: auto;
    }

    /* 按钮文字、图标都缩小 */
    .action-btn {
        padding: 4px 6px;
        font-size: 12px;
    }

    .panel-actions {
        padding: 15px 20px;
        flex-direction: column;
    }
    .action-button {
        padding: 10px 16px;
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    /* 超小屏幕下再做一些微调 */
    .panel-header {
        padding: 15px;
    }
    .panel-title {
        font-size: 20px;
    }
    .save-slots {
        padding: 12px 16px;
        gap: 10px;
    }
    .slot-number {
        width: 28px;
        height: 28px;
        font-size: 12px;
        margin-right: 12px;
    }
    .save-name {
        font-size: 16px;
    }
    .level,
    .location {
        font-size: 12px;
    }
    .save-meta {
        font-size: 10px;
    }
    .empty-icon {
        font-size: 20px;
    }
    .empty-text {
        font-size: 14px;
    }
    .close-btn {
        top: 16px;
        right: 16px;
    }
}
</style>
