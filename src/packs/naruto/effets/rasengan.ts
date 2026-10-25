// Le Rasengan en 3D (three.js), dans un canvas transparent par-dessus la video.
//
// doc : https://threejs.org/docs/#OrthographicCamera
//       https://threejs.org/docs/#TorusGeometry
//
// La camera orthographique est reglee en pixels : un objet place en (x, y) apparait au
// pixel (x, y) de l'ecran, ce qui permet de le mettre dans la main.

import * as THREE from "three";

/** Duree de vie du Rasengan, en secondes. */
const DUREE = 4.5;

const lisse = (x: number): number => {
  const borne = Math.min(Math.max(x, 0), 1);
  return borne * borne * (3 - 2 * borne);
};

/** Tout est en melange additif : les couleurs s'ajoutent comme de la lumiere. */
function lumiere(couleur: number, opacite: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: couleur,
    transparent: true,
    opacity: opacite,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

/** Un rond flou pour les particules. */
function rondFlou(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255, 255, 255, 1)");
  g.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

/** Un anneau du tourbillon, avec l'axe autour duquel il tourne. */
interface Anneau extends THREE.Mesh {
  userData: { axe: THREE.Vector3 };
}

export class Rasengan3D {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private readonly boule: THREE.Group;
  private readonly anneaux: Anneau[] = [];
  private readonly points: THREE.Points;

  private largeur = 0;
  private hauteur = 0;
  private rayon = 0;
  private debut = 0;
  actif = false;

  /** @param pixels la densite de pixels (1 sur telephone, pour economiser la memoire) */
  constructor(conteneur: HTMLElement, pixels: number) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(pixels);
    conteneur.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
    this.boule = new THREE.Group();
    this.boule.visible = false;
    this.scene.add(this.boule);

    // le coeur blanc et deux enveloppes bleues (rayon 1 : la taille vient de scale)
    this.boule.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), lumiere(0xffffff, 1)));
    this.boule.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), lumiere(0x7fd4ff, 0.35)));
    this.boule.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), lumiere(0x2f8fff, 0.22)));

    // des anneaux qui tournent vite, chacun autour de son propre axe : le tourbillon
    for (let i = 0; i < 6; i++) {
      const anneau = new THREE.Mesh(
        new THREE.TorusGeometry(0.78 + i * 0.05, 0.02, 8, 80),
        lumiere(0xbfe9ff, 0.8)
      ) as unknown as Anneau;
      anneau.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      anneau.userData.axe = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      this.anneaux.push(anneau);
      this.boule.add(anneau);
    }

    // des particules sur une coquille autour de la sphere
    const positions = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const direction = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(0.85 + Math.random() * 0.35);
      direction.toArray(positions, i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xd6f1ff,
        size: 5,
        sizeAttenuation: false,
        map: rondFlou(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.boule.add(this.points);

    this.redimensionner();
    window.addEventListener("resize", () => this.redimensionner());
  }

  redimensionner(): void {
    this.largeur = window.innerWidth;
    this.hauteur = window.innerHeight;
    // 1 unite = 1 pixel, l'origine au centre de l'ecran
    this.camera.left = -this.largeur / 2;
    this.camera.right = this.largeur / 2;
    this.camera.top = this.hauteur / 2;
    this.camera.bottom = -this.hauteur / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.largeur, this.hauteur);
  }

  /** Un Rasengan de `rayon` pixels en (x, y). */
  lancer(x: number, y: number, rayon: number): void {
    this.rayon = rayon;
    this.debut = performance.now();
    this.actif = true;
    this.boule.visible = true;
    this.placer(x, y);
    this.renderer.setAnimationLoop(temps => this.animer(temps));
  }

  /** Il suit la main. */
  placer(x: number, y: number): void {
    this.boule.position.set(x - this.largeur / 2, this.hauteur / 2 - y, 0);
  }

  private animer(temps: number): void {
    const t = (temps - this.debut) / 1000;
    if (t > DUREE) {
      this.actif = false;
      this.boule.visible = false;
      this.renderer.render(this.scene, this.camera); // une image vide pour effacer le canvas
      this.renderer.setAnimationLoop(null);
      return;
    }
    // il grossit en 0,6 s, tremble un peu, et s'eteint a la fin
    const taille =
      this.rayon *
      lisse(t / 0.6) *
      (1 - lisse((t - DUREE + 0.5) / 0.5)) *
      (1 + 0.04 * Math.sin(t * 50));
    this.boule.scale.setScalar(Math.max(taille, 0.001));
    for (const anneau of this.anneaux) anneau.rotateOnAxis(anneau.userData.axe, 0.35);
    this.points.rotation.y += 0.25;
    this.points.rotation.x += 0.09;
    this.renderer.render(this.scene, this.camera);
  }
}
