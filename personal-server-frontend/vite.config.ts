import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const bridgePort = process.env.PRIVATEVAULT_BRIDGE_PORT || "4000";
const frontendHost = process.env.PRIVATEVAULT_FRONTEND_HOST || "127.0.0.1";
const frontendPort = Number(process.env.PRIVATEVAULT_FRONTEND_PORT || 5173);

export default defineConfig({
  plugins: [react()],
  server: {
    host: frontendHost,
    port: frontendPort,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${bridgePort}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});