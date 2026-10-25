// Ce que l'application expose au test de fumée pour dire « je suis prête ».
declare global {
  interface Window {
    kagami?: { pret: boolean };
  }
}
export {};
