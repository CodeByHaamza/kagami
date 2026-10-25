// Copie dans public/ ce que npm fournit deja : les fichiers WebAssembly de MediaPipe.
//
// Ils pesent ~40 Mo. Les commiter alourdirait le depot pour rien, puisque la
// dependance les apporte ; on les recopie donc avant chaque dev et chaque build.

import { cp, mkdir } from "node:fs/promises";

const SOURCE = "node_modules/@mediapipe/tasks-vision/wasm";
const CIBLE = "public/mediapipe/wasm";

await mkdir(CIBLE, { recursive: true });
await cp(SOURCE, CIBLE, { recursive: true });
console.log(`MediaPipe : ${SOURCE} → ${CIBLE}`);
