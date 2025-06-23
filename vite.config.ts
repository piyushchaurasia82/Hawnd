import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import fs from 'fs';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    })
  ],
  server: {
    https: fs.existsSync(path.resolve(__dirname, './.cert/key.pem')) ? {
      key: fs.readFileSync(path.resolve(__dirname, './.cert/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './.cert/cert.pem')),
    } : undefined,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
})
