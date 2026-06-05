/* eslint-disable */

/**
 * Vue 单文件组件（.vue）类型声明文件
 * 用于 TypeScript 能正确识别 SFC 导入语法
 * 说明：这是 Vite、Webpack 等构建工具识别 .vue 文件时必须的声明文件
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  /**
   * 定义所有导入的 .vue 文件为 Vue 组件类型
   */
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * ========== 下面为路径别名声明 ==========
 * 解决 VSCode 报错：Cannot find module '@/api'
 * 说明：仅做类型绕过提示，不影响运行
 */
declare module '@/api'
declare module '@/utils/eventBus'

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.webp'
declare module '*.svg'
