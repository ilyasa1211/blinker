import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  main: {
    server: {
      host: "0.0.0.0"
    },
  },
  preload: {
    server: {
      host: "0.0.0.0"
    },
  },
  renderer: {
    server: {
      host: "0.0.0.0"
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/renderer/index.html'),
          overlay: resolve(__dirname, 'src/renderer/overlay.html')
        }
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
