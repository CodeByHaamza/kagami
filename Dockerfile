# syntax=docker/dockerfile:1.7

# Kagami — image de production : on construit avec Node, on sert avec nginx.
#
# Le resultat est un site statique. L'image finale ne contient donc ni Node, ni
# node_modules, ni le code source : seulement dist/ et un serveur.

# ---------- construction ----------
FROM node:24.19.0-alpine AS constructeur

WORKDIR /app

# Les dependances d'abord : cette couche ne change que quand le verrou change.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build

# ---------- service ----------
# Image non-root des l'origine : nginx y tourne en UID 101, sans capacites root.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS web

# Le modele ONNX est servi en WebAssembly : il lui faut les bons types MIME et des
# en-tetes qui autorisent SharedArrayBuffer cote MediaPipe.
COPY --chown=nginx:nginx deploiement/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=constructeur --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

# nginx:unprivileged definit deja USER nginx et la bonne commande.
