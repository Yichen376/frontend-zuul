<template>
    <div class="login-page">
        <!-- 音乐 -->
        <audio
            ref="bgm"
            preload="auto"
            @ended="onTrackEnded"
            @play="isPlaying = true"
            @pause="isPlaying = false"
            @error="onAudioError"
        ></audio>

        <!-- 音乐开关按钮 -->
        <button class="music-toggle" @click="toggleMusic" :title="isPlaying ? '暂停音乐' : '播放音乐'">
            <!-- 播放状态：喇叭图标 -->
            <svg v-if="isPlaying" class="music-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <!-- 暂停状态：静音喇叭图标 -->
            <svg v-else class="music-icon muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            <!-- 播放时显示音波跳动条 -->
            <span v-if="isPlaying" class="sound-bars">
                <span class="bar" v-for="i in 4" :key="i" />
            </span>
        </button>
        <!-- --- Background gradient fallback --- -->
        <div class="background" />

        <!-- --- Background slideshow (new) --- -->
        <div class="background-slideshow">
            <div
                v-for="(img, index) in images"
                :key="index"
                class="slide"
                :class="{ active: currentSlide === index }"
                :style="{ backgroundImage: `url(${img})` }"
            />
        </div>

        <!-- --- Floating shapes (existing) --- -->
        <div class="floating-shapes">
            <div v-for="n in 4" :key="`shape-${n}`" class="shape" />
        </div>

        <router-view />
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

// Import multiple music files
import bgm1 from '@/assets/bgm.mp3'
import bgm2 from '@/assets/bgm1.mp3'
import bgm3 from '@/assets/bgm3.mp3'

// Playlist array
const playlist = [bgm1, bgm2, bgm3]

// Audio refs and state
const currentTrackIndex = ref(0)
const bgm = ref(null)
const isPlaying = ref(false)
const audioEnabled = ref(false)

// Screen state management
const showStartScreen = ref(true)
const showWelcome = ref(false)
const showLogin = ref(false)

// Function to enable audio after user interaction
const enableAudioIfNeeded = async () => {
    if (!audioEnabled.value && bgm.value && playlist.length > 0) {
        try {
            bgm.value.muted = false
            bgm.value.src = playlist[currentTrackIndex.value]
            await bgm.value.play()
            isPlaying.value = true
            audioEnabled.value = true
            console.log('Music started playing after user interaction')
        } catch (err) {
            console.warn('Failed to start music:', err)
        }
    }
}

// Initialize music
const initializeMusic = async () => {
    await nextTick()
    if (bgm.value && playlist.length > 0) {
        bgm.value.src = playlist[currentTrackIndex.value]
        bgm.value.volume = 0.3
        bgm.value.loop = false

        // Try to play immediately
        try {
            await bgm.value.play()
            isPlaying.value = true
            audioEnabled.value = true
            console.log('Music auto-started successfully')
        } catch (err) {
            console.log('Auto-play blocked, will start on user interaction')
            bgm.value.muted = true
            addUserInteractionListeners()
        }
    }
}

// Handle track ended - play next track
const onTrackEnded = () => {
    console.log('Track ended, playing next...')
    playNextTrack()
}

// Handle audio errors
const onAudioError = e => {
    console.warn('Audio error:', e)
    isPlaying.value = false
}

// Play next track in playlist
const playNextTrack = () => {
    if (playlist.length === 0) return

    currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.length

    if (bgm.value) {
        bgm.value.src = playlist[currentTrackIndex.value]

        if (audioEnabled.value) {
            bgm.value.play().catch(err => {
                console.warn('Failed to play next track:', err)
                isPlaying.value = false
            })
        }
    }

    console.log(
        `Now playing track ${currentTrackIndex.value + 1}: ${
            playlist[currentTrackIndex.value]
        }`
    )
}

// Add event listeners for user interaction to enable audio
const addUserInteractionListeners = () => {
    const events = ['click', 'touchstart', 'keydown']
    const handleUserInteraction = () => {
        enableAudioIfNeeded()
        events.forEach(event => {
            document.removeEventListener(event, handleUserInteraction)
        })
    }

    events.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true })
    })
}

// Toggle music play/pause
const toggleMusic = async () => {
    if (!bgm.value || playlist.length === 0) return

    try {
        if (isPlaying.value) {
            bgm.value.pause()
            isPlaying.value = false
        } else {
            if (bgm.value.src !== playlist[currentTrackIndex.value]) {
                bgm.value.src = playlist[currentTrackIndex.value]
            }
            await bgm.value.play()
            isPlaying.value = true
            audioEnabled.value = true
        }
    } catch (err) {
        console.warn('Failed to toggle music:', err)
    }
}

// Manual track control functions
const playPreviousTrack = () => {
    if (playlist.length === 0) return

    currentTrackIndex.value =
        currentTrackIndex.value === 0
            ? playlist.length - 1
            : currentTrackIndex.value - 1

    if (bgm.value) {
        bgm.value.src = playlist[currentTrackIndex.value]
        if (isPlaying.value && audioEnabled.value) {
            bgm.value.play().catch(err => {
                console.warn('Failed to play previous track:', err)
            })
        }
    }
}

const playSpecificTrack = index => {
    if (index < 0 || index >= playlist.length) return

    currentTrackIndex.value = index
    if (bgm.value) {
        bgm.value.src = playlist[currentTrackIndex.value]
        if (isPlaying.value && audioEnabled.value) {
            bgm.value.play().catch(err => {
                console.warn('Failed to play specific track:', err)
            })
        }
    }
}

// Current track info
const currentTrackName = computed(() => {
    if (playlist.length === 0) return 'No tracks'
    return `Track ${currentTrackIndex.value + 1} of ${playlist.length}`
})

// Cleanup function
const stopMusic = () => {
    if (bgm.value) {
        bgm.value.pause()
        bgm.value.currentTime = 0
        isPlaying.value = false
    }
}

/* -------------------- Slideshow logic -------------------- */
const images = [
    'images/image-1.jpg',
    'images/image-2.jpg',
    'images/image-3.jpg',
    'images/image-4.png'
]
const currentSlide = ref(0)
let slideTimer

function preloadImages() {
    images.forEach(src => {
        const img = new Image()
        img.src = src
    })
}

function startSlideshow() {
    slideTimer = setInterval(() => {
        currentSlide.value = (currentSlide.value + 1) % images.length
    }, 8000)
}

onMounted(() => {
    preloadImages()
    startSlideshow()
    initializeMusic()
})

onBeforeUnmount(() => {
    clearInterval(slideTimer)
    stopMusic()
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
        document.removeEventListener(event, enableAudioIfNeeded)
    })
})
</script>

<style scoped>
/* 音乐开关按钮样式 */
.music-toggle {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 1001;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 28px;
    cursor: pointer;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    color: rgba(255, 255, 255, 0.9);
    outline: none;
}

.music-toggle:hover {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.35);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
    transform: translateY(-1px);
}

.music-toggle:active {
    transform: scale(0.95);
}

.music-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    transition: all 0.3s ease;
}

.music-icon.muted {
    opacity: 0.5;
}

/* 音波跳动条 */
.sound-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 16px;
}

.sound-bars .bar {
    width: 3px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 2px;
    animation: soundBounce 0.8s ease-in-out infinite;
}

.sound-bars .bar:nth-child(1) { height: 8px; animation-delay: 0s; }
.sound-bars .bar:nth-child(2) { height: 14px; animation-delay: 0.15s; }
.sound-bars .bar:nth-child(3) { height: 10px; animation-delay: 0.3s; }
.sound-bars .bar:nth-child(4) { height: 16px; animation-delay: 0.45s; }

@keyframes soundBounce {
    0%, 100% { transform: scaleY(0.5); opacity: 0.4; }
    50% { transform: scaleY(1); opacity: 1; }
}

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

.ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: rippleEffect 2s infinite;
}

.ripple:nth-child(2) {
    animation-delay: 0.5s;
}

.ripple:nth-child(3) {
    animation-delay: 1s;
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

@keyframes rippleEffect {
    0% {
        width: 20px;
        height: 20px;
        opacity: 1;
    }
    100% {
        width: 60px;
        height: 60px;
        opacity: 0;
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
    background: rgba(180, 160, 140, 0.15);
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
</style>
