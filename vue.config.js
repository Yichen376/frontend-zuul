const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
    transpileDependencies: true,

    // ==================== 部署与打包 ====================
    // 部署路径（根路径）
    publicPath: '/frontend-zuul',
    // 打包输出目录
    outputDir: 'docs',
    // 静态资源（js/css/img/font等）存放的子目录
    assetsDir: 'static',
    // 生产环境关闭 source map（减小体积、避免源码泄露）
    productionSourceMap: false,
    // 文件名是否包含 hash（缓存策略）
    filenameHashing: true,

    // ==================== 开发服务器 ====================
    devServer: {
        port: '8080',
        client: {
            overlay: false
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    },

    // ==================== Lint 配置 ====================
    lintOnSave: false,

    // ==================== CSS 配置 ====================
    css: {
        // 是否将 CSS 提取为独立文件（生产环境默认 true）
        extract: process.env.NODE_ENV === 'production',
        // 是否开启 CSS source map
        sourceMap: false,
        loaderOptions: {
            scss: {
                implementation: require('sass')
            }
        }
    },

    // ==================== Webpack 配置 ====================
    configureWebpack: {
        // 性能提示阈值（可根据需要调整）
        performance: {
            hints: 'warning',
            maxAssetSize: 512 * 1024,       // 单个资源 512KB
            maxEntrypointSize: 1024 * 1024  // 入口 1MB
        }
    },

    chainWebpack: config => {
        // 处理图片文件（png, jpg, jpeg, gif, webp, svg, ico）
        config.module
            .rule('images')
            .test(/\.(png|jpe?g|gif|webp|svg|ico)(\?.*)?$/)
            .type('asset')
            .parser({
                dataUrlCondition: {
                    // 小于 8KB 的图片转为 base64 内联，减少 HTTP 请求
                    maxSize: 8 * 1024
                }
            })
            .set('generator', {
                filename: 'img/[name].[hash:8][ext]'
            })

        // 处理音频/视频文件（mp3, wav, ogg, mp4, webm）
        config.module
            .rule('media')
            .test(/\.(mp3|wav|ogg|mp4|webm)(\?.*)?$/)
            .type('asset/resource')
            .set('generator', {
                filename: 'media/[name].[hash:8][ext]'
            })

        // 处理字体文件
        config.module
            .rule('fonts')
            .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/)
            .type('asset/resource')
            .set('generator', {
                filename: 'fonts/[name].[hash:8][ext]'
            })
    }
})
