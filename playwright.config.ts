import { defineConfig, devices } from "@playwright/test";

// Un seul test de fumée, dans un vrai navigateur : la page charge, le modèle se charge,
// le canvas se dessine. Tout le reste est couvert par les tests unitaires.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    ...devices["Desktop Chrome"],
    launchOptions: {
      args: [
        // une caméra factice : un motif synthétique, suffisant pour vérifier le câblage
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream"
      ]
    }
  },
  webServer: {
    command: "npx vite --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000
  }
});
