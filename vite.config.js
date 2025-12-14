import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const appVersion = packageJson.version

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt', // 改为 prompt，更积极地提示更新
      includeAssets: ['fonts/**', 'icons/**'],
      manifest: {
        name: "Pattr - 音乐创作项目管理",
        short_name: "Pattr",
        description: "灵活的音乐创作项目管理系统",
        theme_color: "#1a1a1a",
        background_color: "#f5f5f5",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true, // 新版本立即激活
        clientsClaim: true, // 立即控制所有客户端
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,otf,ttf}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB，允许缓存大字体文件
        // 添加版本号到缓存名称，确保版本更新时清除旧缓存
        cacheId: `pattr-v${appVersion}`,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ],
        // 添加更新检查
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/]
      },
      // 添加更新提示
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
