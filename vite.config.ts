import { defineConfig } from "vite";

// Les modeles sont servis depuis public/ : Vite les copie tels quels dans le build.
export default defineConfig({
  server: { port: 5173 },
  build: { target: "es2022", sourcemap: true }
});
