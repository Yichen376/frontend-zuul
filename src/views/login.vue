<template>
    <div class="login-page">
        <!-- --- Start Screen (NEW) --- -->
        <transition name="screen-fade" mode="out-in">
            <div
                v-if="showStartScreen"
                key="start"
                class="start-screen"
                @click="enterWelcome"
            >
                <div class="start-content">
                    <div class="start-text">
                        <h1 class="start-title">World of Zuul</h1>
                        <p class="start-prompt">点击屏幕开始</p>
                        <div class="click-indicator">
                            <div class="particle" v-for="n in 10" :key="n"></div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- --- Welcome Screen --- -->
        <transition name="screen-fade" mode="out-in">
            <div v-if="showWelcome" key="welcome" class="welcome-screen">
                <div class="welcome-content">
                    <img
                        src="/images/logo.png"
                        class="welcome-logo"
                        alt="Game Logo"
                    />
                    <h1 class="game-title">World of Zuul</h1>
                    <p class="game-subtitle">Embark on an epic journey</p>

                    <div class="welcome-buttons">
                        <button
                            class="welcome-btn start-btn"
                            @click="startGame"
                            @mouseenter="addBlueEffect"
                            @mouseleave="removeBlueEffect"
                        >
                            <span>登录/注册</span>
                        </button>

                        <button
                            class="welcome-btn intro-btn"
                            @click="showGameIntro"
                            @mouseenter="addBlueEffect"
                            @mouseleave="removeBlueEffect"
                        >
                            <span>游戏介绍</span>
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- --- Auth card --- -->
        <transition name="screen-fade" mode="out-in">
            <div
                v-if="showLogin"
                key="login"
                class="login-container"
                :class="{ 'register-mode': isRegisterMode }"
            >
                <!-- Close button -->
                <button
                    class="close-button"
                    :disabled="isLoading"
                    title="返回主页"
                    @click="backToWelcome"
                >
                    ×
                </button>

                <!-- Left visual panel -->
                <div v-show="!isMobile" class="login-image">
                    <img
                        src="/images/login-bg.png"
                        class="login-bg"
                        alt="login splash"
                    />
                </div>

                <!-- Right panel (animated switch) -->
                <transition name="fade-slide" mode="out-in">
                    <!-- ---------- LOGIN ---------- -->
                    <div v-if="!isRegisterMode" key="login" class="login-form">
                        <img src="/images/logo.png" class="logo" alt="" />
                        <h2 class="form-title">登录游戏</h2>

                        <form @submit.prevent="handleLogin">
                            <div class="form-group">
                                <label for="username">用户名</label>
                                <input
                                    id="username"
                                    v-model.trim="loginData.username"
                                    type="text"
                                    placeholder="请输入用户名"
                                    required
                                />
                            </div>

                            <div class="form-group">
                                <label for="password">密码</label>
                                <input
                                    id="password"
                                    v-model="loginData.password"
                                    type="password"
                                    placeholder="请输入密码"
                                    required
                                />
                            </div>

                            <div class="checkbox-group">
                                <input
                                    id="remember"
                                    v-model="loginData.rememberMe"
                                    type="checkbox"
                                />
                                <label for="remember">记住我</label>
                                <a class="forgot-password" href="#"
                                    >忘记密码?</a
                                >
                            </div>

                            <button
                                class="login-button"
                                type="submit"
                                :disabled="isLoading"
                            >
                                {{ isLoading ? 'Logging in…' : '开始冒险吧！' }}
                            </button>
                        </form>

                        <!-- ---- Jump‑to‑register ---- -->
                        <button
                            class="register-button"
                            :disabled="isLoading"
                            @click="toggleMode"
                        >
                            注册新账号
                        </button>
                    </div>

                    <!-- ---------- REGISTER ---------- -->
                    <div v-else key="register" class="login-form">
                        <h2 class="form-title">创建新账号</h2>
                        <form @submit.prevent="handleRegister">
                            <div class="form-group">
                                <label for="r-username">用户名</label>
                                <input
                                    id="r-username"
                                    v-model.trim="registerData.username"
                                    type="text"
                                    placeholder="请输入用户名"
                                    required
                                />
                            </div>

                            <div class="form-group">
                                <label for="r-password">密码</label>
                                <input
                                    id="r-password"
                                    v-model="registerData.password"
                                    type="password"
                                    placeholder="请输入密码"
                                    required
                                />
                            </div>

                            <div class="form-group">
                                <label for="confirm">确认密码</label>
                                <input
                                    id="confirm"
                                    v-model="registerData.confirm"
                                    type="password"
                                    placeholder="请再次输入密码"
                                    required
                                />
                            </div>

                            <button
                                class="login-button"
                                type="submit"
                                :disabled="isLoading"
                            >
                                {{ isLoading ? 'Registering…' : '立即注册' }}
                            </button>
                        </form>

                        <button
                            class="register-button"
                            :disabled="isLoading"
                            @click="toggleMode"
                        >
                            返回登录
                        </button>
                    </div>
                </transition>
            </div>
        </transition>
    </div>
</template>

<script setup>
import {
    reactive,
    ref,
    onMounted,
    onBeforeUnmount,
    nextTick,
    computed
} from 'vue'
import { useRouter } from 'vue-router'
import { playerApi } from '@/api/index.js'

const showStartScreen = ref(true)
const showWelcome = ref(false)
const showLogin = ref(false)

/* -------------------- Screen Navigation Logic -------------------- */
function enterWelcome() {
    showStartScreen.value = false
    showWelcome.value = true
    enableAudioIfNeeded()
}

function startGame() {
    showWelcome.value = false
    setTimeout(() => {
        showLogin.value = true
    }, 900)
}

// 点击关闭：立即隐藏登录，延时 2s 再显示欢迎，且重置注册模式和头像
function backToWelcome() {
    showLogin.value = false
    isRegisterMode.value = false
    // 重置头像相关状态
    resetAvatarState()
    setTimeout(() => {
        showWelcome.value = true
    }, 900)
}

function showGameIntro() {
    alert(
        '《祖鲁的世界》是一款2D地牢探索解谜游戏。你将化身一名误入远古废墟的冒险家，穿梭于彼此相连的密室之间，搜寻宝物、破解谜题，一步步走向"最终祭坛"揭开尘封的真相。旅途中你会遇见古老的典籍与神奇药剂，也会拾取锋利的兵刃、穿越布满机关的通道，而隐藏的传送门更可能瞬间将你送往全然陌生的角落。'
    )
}

function addBlueEffect(event) {
    event.target.classList.add('blue-effect')
}

function removeBlueEffect(event) {
    event.target.classList.remove('blue-effect')
}

/* -------------------- Auth logic -------------------- */
const router = useRouter()
const loginData = reactive({ username: '', password: '', rememberMe: false })
const registerData = reactive({
    username: '',
    password: '',
    confirm: ''
})
const isLoading = ref(false)

const isRegisterMode = ref(false)
const toggleMode = () => {
    isRegisterMode.value = !isRegisterMode.value
    // 切换模式时重置头像状态
    resetAvatarState()
}

// Avatar upload logic
const avatarInput = ref(null) // 只保留一个 input 引用即可
// —— 响应式判断是否为手机屏幕 ——
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
}
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))
const avatarFile = ref(null)
const avatarPreview = ref(null)

function triggerFileInput() {
    avatarInput.value?.click()
}

function resetAvatarState() {
    avatarFile.value = null
    avatarPreview.value = null
    if (avatarInput.value) avatarInput.value.value = ''
}

function validateFile(file) {
    const types = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/gif',
        'image/webp'
    ]
    const max = 5 * 1024 * 1024
    if (!types.includes(file.type)) {
        alert('请选择有效的图片文件')
        return false
    }
    if (file.size > max) {
        alert('图片文件大小不能超过5MB')
        return false
    }
    return true
}

function onAvatarChange(e) {
    const file = e.target.files[0]
    if (!file || !validateFile(file)) {
        e.target.value = ''
        return
    }
    avatarFile.value = file
    const reader = new FileReader()
    reader.onload = ev => {
        avatarPreview.value = ev.target.result
    }
    reader.readAsDataURL(file)
}

async function handleLogin() {
    if (!loginData.username || !loginData.password) {
        return alert('请完整填写表单')
    }

    isLoading.value = true
    try {
        const res = await playerApi.login({
            username: loginData.username,
            password: loginData.password
        })
        console.log('后端返回结果：', res)

        const playerId = res.data.data.playerId
        const playerAvatarUrl = res.data.data.playerAvatarUrl || ''
        localStorage.setItem('playerId', playerId)
        localStorage.setItem('roomId', 1)
        if (playerAvatarUrl) {
            localStorage.setItem('playerAvatarUrl', playerAvatarUrl)
        }
        alert('登录成功！')
        router.push('archive')
    } catch (err) {
        // 如果是 CORS 导致的网络错误，axios 通常会把 err.message 设为 'Network Error'
        if (err.message && err.message.includes('CORS')) {
            alert('跨域请求被阻止，请检查后端 CORS 配置')
        } else if (err.response?.status === 401) {
            alert('用户名或密码错误')
        } else if (!err.response) {
            // 既没有响应，也不是 CORS 错误，可能服务器挂掉或网络问题
            alert('无法连接到服务器，请检查网络连接')
        } else {
            alert(err.response.data?.msg || '服务器错误，请稍后重试')
        }
    } finally {
        isLoading.value = false
    }
}

/* 修改 handleRegister，使用 FormData 上传文件 */
async function handleRegister() {
    if (!registerData.username || !registerData.password)
        return alert('请完整填写表单')
    if (registerData.password !== registerData.confirm)
        return alert('两次输入的密码不一致')
    isLoading.value = true
    try {
        const form = new FormData()
        form.append('playerName', registerData.username)
        form.append('password', registerData.password)
        form.append('avatar', avatarFile.value)

        console.log('Sending registration data:', {
            playerName: registerData.username,
            avatarFile: avatarFile.value.name,
            fileSize: (avatarFile.value.size / 1024).toFixed(2) + 'KB'
        })

        await playerApi.register(form)

        alert('注册成功！请登录')
        // 成功后清理状态并切换到登录模式
        registerData.username = ''
        registerData.password = ''
        registerData.confirm = ''
        resetAvatarState()
        toggleMode()
    } catch (err) {
        console.error('Registration error:', err)
        if (err.response?.status === 409) {
            alert('用户名已存在，请更换其他用户名')
        } else {
            alert(err.response?.data?.msg || '注册失败，请重试')
        }
    } finally {
        isLoading.value = false
    }
}

// 添加 enableAudioIfNeeded 函数（如果需要）
function enableAudioIfNeeded() {
    // 音频相关逻辑
    console.log('Audio enabled if needed')
}
</script>

<style scoped>
/* Start Screen Styles */
.start-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
    transition: all 0.3s ease;
}

.start-screen:hover {
    background: rgba(0, 0, 0, 0.4);
}

.start-content {
    text-align: center;
    color: white;
    user-select: none;
}

.start-title {
    font-size: 4rem;
    font-weight: 700;
    margin-bottom: 2rem;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5),
        0 0 40px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.2);
    letter-spacing: 0.1em;
    animation: titleGlow 3s ease-in-out infinite alternate;
}

.start-prompt {
    font-size: 1.5rem;
    font-weight: 300;
    margin-bottom: 3rem;
    opacity: 0.9;
    animation: promptPulse 2s ease-in-out infinite;
}

.click-indicator {
    position: relative;
    width: 60px;
    height: 60px;
    margin: 0 auto;
}

/* ===== 粒子漂浮（Floating Particles）—— 随机向四周扩散 ===== */
.particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.6),
        0 0 12px rgba(255, 255, 255, 0.3);
    animation: particleSpread var(--dur, 2.4s) ease-out infinite;
    animation-delay: var(--delay, 0s);
    opacity: 0;
}

/* 10 个粒子，方向、距离、速度、大小各不相同，模拟随机扩散 */
.particle:nth-child(1)  { --dx: 5px;   --dy: -48px; --delay: 0s;    --dur: 2.2s; width: 5px; height: 5px; }
.particle:nth-child(2)  { --dx: 38px;  --dy: -22px; --delay: 0.25s; --dur: 2.6s; width: 7px; height: 7px; }
.particle:nth-child(3)  { --dx: 42px;  --dy: 15px;  --delay: 0.5s;  --dur: 2.0s; width: 4px; height: 4px; }
.particle:nth-child(4)  { --dx: 20px;  --dy: 40px;  --delay: 0.7s;  --dur: 2.8s; width: 6px; height: 6px; }
.particle:nth-child(5)  { --dx: -35px; --dy: 28px;  --delay: 0.35s; --dur: 2.3s; width: 5px; height: 5px; }
.particle:nth-child(6)  { --dx: -44px; --dy: -8px;  --delay: 0.55s; --dur: 2.5s; width: 8px; height: 8px; }
.particle:nth-child(7)  { --dx: -15px; --dy: -42px; --delay: 0.15s; --dur: 2.1s; width: 4px; height: 4px; }
.particle:nth-child(8)  { --dx: 30px;  --dy: 35px;  --delay: 0.8s;  --dur: 2.7s; width: 6px; height: 6px; }
.particle:nth-child(9)  { --dx: -28px; --dy: -35px; --delay: 0.45s; --dur: 2.4s; width: 5px; height: 5px; }
.particle:nth-child(10) { --dx: 10px;  --dy: 45px;  --delay: 0.65s; --dur: 2.9s; width: 7px; height: 7px; }

@keyframes particleSpread {
    0% {
        transform: translate(0, 0) scale(0.3);
        opacity: 0;
    }
    12% {
        opacity: 1;
    }
    45% {
        opacity: 0.65;
    }
    100% {
        transform: translate(var(--dx), var(--dy)) scale(1.4);
        opacity: 0;
    }
}

/* Animations */
@keyframes titleGlow {
    0% {
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.5),
            0 0 40px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.2);
    }
    100% {
        text-shadow: 0 0 30px rgba(255, 255, 255, 0.8),
            0 0 60px rgba(255, 255, 255, 0.5), 0 0 90px rgba(255, 255, 255, 0.3);
    }
}

@keyframes promptPulse {
    0%,
    100% {
        opacity: 0.7;
        transform: translateY(0);
    }
    50% {
        opacity: 1;
        transform: translateY(-5px);
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .start-title {
        font-size: 2.5rem;
    }

    .start-prompt {
        font-size: 1.2rem;
    }
}
/****************** Layout root ******************/
.login-page,
body {
    font-family: 'Arial', sans-serif;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

/****************** Background gradient (existing) ******************/
.background {
    position: fixed;
    inset: 0;
    z-index: -3;
}

/****************** Background slideshow (new) ******************/
.background-slideshow {
    position: fixed;
    inset: 0;
    z-index: -2;
}
.slide {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0;
    transform: scale(1);
    transition: opacity 2s ease-in-out;
}
.slide.active {
    opacity: 1;
    animation: zoomIn 8s linear forwards;
}
@keyframes zoomIn {
    from {
        transform: scale(1);
    }
    to {
        transform: scale(1.04);
    }
}

/****************** Floating shapes (existing) ******************/
.floating-shapes {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
}
.shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 20s infinite linear;
}
.shape:nth-child(1) {
    width: 80px;
    height: 80px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
}
.shape:nth-child(2) {
    width: 120px;
    height: 120px;
    top: 60%;
    left: 80%;
    animation-delay: -5s;
}
.shape:nth-child(3) {
    width: 60px;
    height: 60px;
    top: 80%;
    left: 20%;
    animation-delay: -10s;
}
.shape:nth-child(4) {
    width: 100px;
    height: 100px;
    top: 10%;
    left: 70%;
    animation-delay: -15s;
}

@keyframes float {
    0% {
        transform: translateY(0) rotate(0);
        opacity: 1;
    }
    50% {
        transform: translateY(-100px) rotate(180deg);
        opacity: 0.5;
    }
    100% {
        transform: translateY(0) rotate(360deg);
        opacity: 1;
    }
}
/****************** Welcome Screen ******************/
.welcome-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    z-index: 1;
}

.welcome-content {
    text-align: center;
    color: white;
    padding: 40px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    width: 400px;
}

@keyframes welcomeSlideIn {
    from {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.welcome-logo {
    width: 150px;
    height: auto;
    margin-bottom: 30px;
}

@keyframes logoGlow {
    from {
        filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
    }
    to {
        filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.6));
    }
}

.game-title {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 15px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    background: linear-gradient(45deg, #fff, #e0e0e0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.game-subtitle {
    font-size: 1.3rem;
    margin-bottom: 50px;
    opacity: 0.9;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.welcome-buttons {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
}

.welcome-btn {
    padding: 18px 50px;
    font-size: 1.2rem;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.4s ease;
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
    min-width: 200px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.welcome-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transition: left 0.5s ease;
}

.welcome-btn:hover::before {
    left: 100%;
}

.welcome-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 1);
    background: rgba(255, 255, 255, 0.2);
}

.welcome-btn.blue-effect {
    border-color: #bcaaa4;
    background: rgba(180, 160, 140, 0.3);
    box-shadow: 0 0 20px rgba(180, 160, 140, 0.5), 0 10px 25px rgba(0, 0, 0, 0.3);
    transform: translateY(-3px) scale(1.05);
}

.start-btn:hover {
    background: linear-gradient(
        135deg,
        rgba(180, 160, 140, 0.3),
        rgba(141, 110, 99, 0.3)
    );
}

.intro-btn:hover {
    background: linear-gradient(
        135deg,
        rgba(180, 160, 140, 0.3),
        rgba(141, 110, 99, 0.3)
    );
}

/****************** Transitions ******************/
/* 新增统一过渡 */
.screen-fade-enter-active,
.screen-fade-leave-active {
    transition: opacity 0.8s ease, transform 0.8s ease;
}
.screen-fade-enter-from,
.screen-fade-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(50px);
}
/****************** Login card (existing) ******************/
.login-container {
    display: flex;
    width: 900px;
    height: 700px;
    background: rgba(245, 240, 230, 0.95);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    animation: slideIn 0.8s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* ---- Close Button (X) ---- */
.close-button {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    /* background: rgba(255, 255, 255, 0.9); */
    /* border: 2px solid #ddd; */
    /* border-radius: 50%; */
    font-size: 48px;
    font-weight: 500;
    color: #000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 10;
    line-height: 1;
    padding: 0;
    border: none;
    background-color: transparent;
}

.close-button:hover {
    /* background: #fff; */
    /* border-color: #999; */
    /* color: #333; */
    /* transform: scale(1.1); */
    /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); */
}

.close-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* -------------- LEFT PANEL -------------- */
.login-image {
    position: absolute;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #000;
    overflow: hidden;
    z-index: 2;
}

.login-image h2 {
    position: absolute;
    top: 200px;
}

.login-container.move-image .login-image {
    transform: translateX(100%);
}

.login-image::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.3;
}

.login-image {
    flex: 1;
    position: relative;
}

.login-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.login-image,
.login-form {
    flex: 0 0 50%;
    box-sizing: border-box;
}

.login-form .logo {
    display: block;
    position: static;
    width: 100px;
    margin: 0 auto;
    margin-top: 10px;
    transform: none;
}

.welcome-text {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 10px;
    text-align: center;
    z-index: 1;
}

.welcome-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    text-align: center;
    line-height: 1.5;
    z-index: 1;
}

/* -------------- FORM -------------- */
.login-form {
    flex: 1;
    padding: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.form-title {
    font-size: 2rem;
    font-weight: 600;
    margin-top: 0px;
    margin-bottom: 30px;
    color: #4e342e;
    text-align: center;
}

.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #6d4c41;
}

.form-group input {
    width: 100%;
    padding: 15px;
    border: 2px solid #d7ccc8;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: #faf7f2;
}

.form-group input:focus {
    outline: none;
    border-color: #bcaaa4;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(180, 160, 140, 0.15);
}

.checkbox-group {
    display: flex;
    align-items: center;
    margin-bottom: 25px;
}

.checkbox-group input[type='checkbox'] {
    width: auto;
    margin-right: 10px;
    transform: scale(1.2);
}

.checkbox-group label {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
}

.forgot-password {
    color: #8d6e63;
    margin-left: auto;
    font-size: 0.9rem;
    text-decoration: none;
}

.forgot-password:hover {
    text-decoration: underline;
}

.login-button {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #8d6e63, #6d4c41);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
}

.login-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(141, 110, 99, 0.3);
}

.login-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.divider {
    text-align: center;
    margin: 20px 0;
    color: #999;
    position: relative;
}

.divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e1e5e9;
}

.divider span {
    background: #fff;
    padding: 0 15px;
}

/* ---- Register button (new) ---- */
.register-button {
    width: 100%;
    padding: 15px;
    background: transparent;
    border: 2px solid #bcaaa4;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #8d6e63;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 15px;
}
.register-button:hover {
    background: #efebe9;
    transform: translateY(-2px);
}

.signup-link {
    margin-top: 20px;
    text-align: center;
    color: #666;
}

.signup-link a {
    color: #667eea;
    font-weight: 600;
    text-decoration: none;
}

.signup-link a:hover {
    text-decoration: underline;
}

/* ---- TRANSITION ---- */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

/* Enhanced avatar upload styles */
.avatar-fade-enter-active,
.avatar-fade-leave-active {
    transition: opacity 0.3s ease;
}
.avatar-fade-enter-from,
.avatar-fade-leave-to {
    opacity: 0;
}

.avatar-upload {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.avatar-placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 200px;
    height: 200px;
    border: 2px dashed #aaa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.avatar-placeholder:hover {
    border-color: #bcaaa4;
    background: #efebe9;
}

.avatar-placeholder .plus {
    font-size: 2rem;
    color: #999;
    line-height: 1;
}

.avatar-placeholder span {
    margin-top: 8px;
    font-size: 1rem;
    color: #666;
}

.avatar-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
}

.avatar-preview + span {
    position: absolute;
    bottom: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
}

/* 手机屏幕下的响应式调整 */
@media (max-width: 768px) {
    .close-button {
        font-size: 30px;
        top: 10px;
        right: 10px;
    }
    .form-title {
        font-size: 20px;
    }
    /* 整体改为上下排列 */
    .login-container {
        flex-direction: column;
        width: 100%;
        height: auto;
    }

    /* 非注册模式下隐藏左侧图片区域 */
    .login-container:not(.register-mode) .login-image {
        display: none;
    }

    /* 登录/注册面板占满全宽，并增加内边距 */
    .login-container .login-form {
        flex: 0 0 100%;
        width: 100%;
        padding: 20px;
    }

    /* 注册模式下的左侧区域（avatar-upload）单独显示 */
    .login-container.register-mode .login-image {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: auto;
        padding: 20px 0;
        background: transparent; /* 去掉默认背景图 */
    }
    /* 隐藏背景图，只保留上传控件 */
    .login-container.register-mode .login-bg {
        display: none;
    }

    /* 1. 手机端彻底隐藏左侧面板 */
    .login-container .login-image {
        display: none !important;
    }

    /* 2. 把注册表单铺满并加点内边距 */
    .login-container.register-mode .login-form {
        flex: 0 0 100%;
        width: 100%;
        padding: 20px;
    }

    /* 3. 新的头像上传区域居中显示，放在标题下方 */
    .avatar-upload-mobile {
        display: flex;
        justify-content: center;
        margin: 16px 0;
    }
}
</style>
