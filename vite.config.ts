import { defineConfig } from "vite";
import ssl from "@vitejs/plugin-basic-ssl";

// Les modeles sont servis depuis public/ : Vite les copie tels quels dans le build.
//
// `npm run dev:reseau` sert l'appli en HTTPS sur le reseau local, pour l'essayer
// depuis un telephone quand le poste de developpement n'a pas de camera.
// `getUserMedia` n'existe que dans un contexte sur : sur une adresse 192.168.x.x en
// clair, le navigateur refuse la camera sans rien dire d'utile. Le certificat est
// auto-signe, donc le telephone affiche un avertissement a accepter une fois.
export default defineConfig(({ mode }) => {
  const reseau = mode === "reseau";
  return {
    plugins: reseau ? [ssl()] : [],
    server: { port: 5173, host: reseau },
    build: { target: "es2022", sourcemap: true }
  };
});
