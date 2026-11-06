import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'
export default defineConfig({ plugins: [tailwind()], server: { proxy: { '/api': process.env.API_PROXY ?? 'http://127.0.0.1:5080' } } })
