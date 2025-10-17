import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      strict: false,
    },
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; media-src 'self' https:; connect-src 'self' https://hysvqdwmhxnblxfqnszn.supabase.co wss://hysvqdwmhxnblxfqnszn.supabase.co https://api.tradeline247ai.com wss://api.tradeline247ai.com; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom", "scheduler"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      scheduler: path.resolve(__dirname, "node_modules/scheduler"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
      },
    },
  },
  ssr: {
    noExternal: ["react", "react-dom"],
  },
}));
