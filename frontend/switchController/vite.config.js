import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // allow requests coming from ngrok/external tunnel domains
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok.app'],
  },
})
