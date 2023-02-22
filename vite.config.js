import { resolve } from 'path'
import { readdir } from 'fs/promises'
import { defineConfig } from 'vite'

const dirContents = await readdir(resolve(__dirname, './examples'))
const examples = dirContents
  .filter((f) => f.endsWith('.html'))
  .filter((f) => f !== 'index.html')
  .map((f) => f.slice(0, -'.html'.length))

// https://vitejs.dev/config/
export default defineConfig({
  root: './examples',
  server: {
    host: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, './examples/index.html'),
        ...Object.fromEntries(
          examples.map((example) => [example, resolve(__dirname, `./examples/${example}.html`)])
        ),
      },
    },
  },
})
