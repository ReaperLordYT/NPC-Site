import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// VITE_BASE_URL lets you set the repo sub-path for GitHub Pages.
// Example: if your site is at https://username.github.io/my-repo/
// set VITE_BASE_URL=/my-repo/ in your GitHub Actions workflow.
// If you use a custom domain (username.github.io), leave it as '/'.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE_URL ?? '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    outDir: "dist",
  },
}));
