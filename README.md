# 🥀 Birthday Wiki — A Gothic Gift Site

A two-act personal birthday gift website:

1. **Gothic Birthday Gate** (`/`) — a dark, ornate celebration page. Her photo sits in
   an ornate frame; tap it to blow out the candles and make secret wishes, then curtains
   part and you step into…
2. **AnwiPedia** (`/wiki`) — a pink, polaroid-flavoured Wikipedia-style encyclopedia about
   one person, written in third person, with editable sections + an infobox.
3. **A Universe of Her** (`/gallery`) — a 3D photo universe (three.js) of all her photos
   drifting through a pink starfield.
4. **Admin** (`/admin`) — password-gated editor to add/edit sections and attach photos.

> The wiki is an **original pink-reskinned layout** inspired by encyclopedia structure —
> it does not use Wikipedia's logo, wordmark, or any trademarked assets.

> **About the wishes:** the wisher is told her wishes are private. They are quietly saved
> to the `wishes` collection in MongoDB and viewable only by the owner in `/admin`.
> A gentle birthday surprise.

## Stack

- **client/** — React + Vite, React Router, framer-motion, @react-three/fiber + drei
- **server/** — Express, Mongoose (MongoDB), JWT auth

## Setup

### 1. Backend

```bash
cd server
npm install
copy .env.example .env      # then edit .env (PowerShell: Copy-Item .env.example .env)
npm run seed                # creates admin + placeholder sections
npm run dev                 # http://localhost:5000
```

Edit `server/.env`:

- `MONGODB_URI` — your MongoDB connection (assumed to exist)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — your admin login

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

### 3. Photos

Drop image files into **`server/photos/`** (`.jpg .png .gif .webp`). They auto-appear:

- Special filenames: `hero.jpg` (gothic gate portrait), `infobox.jpg` (wiki infobox),
  `song.mp3` (optional gate music).
- All photos show in the `/gallery` 3D universe automatically.
- Attach photos to wiki sections from `/admin`.

No rebuild needed — just drop files and refresh.

## Admin

Go to `/admin`, log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Add sections, write
third-person content, attach photos, and read the secret wishes she made.

## Customize

- Her name & infobox fields: top of `client/src/pages/WikiPage.jsx`.
- Colors / theme: CSS variables in `client/src/styles/global.css`.

## Photo sizes (run before deploy)

Originals (~800MB) are NOT deployed. The site uses two generated, committed sets:

```bash
cd server
npm run thumbs     # tiny ~320px polaroids for the 3D gallery  -> photos/thumbs/
npm run medium     # ~1400px web versions for wiki + focus view -> photos/medium/
```

Re-run both after adding new photos to `server/photos/`. `thumbs/` + `medium/`
are committed (small); the big originals + `.mp4` stay local (see `.gitignore`).

## Deploy — Netlify (frontend) + Render (backend) + MongoDB Atlas

### 1. MongoDB Atlas (free)
1. Create a free cluster at mongodb.com/atlas → Database Access: add a user.
2. Network Access: allow `0.0.0.0/0` (Render's IPs aren't fixed on free tier).
3. Copy the connection string (`mongodb+srv://…/birthday_wiki`).

### 2. Backend → Render
- Push this repo to GitHub. On Render: **New → Blueprint**, pick the repo (uses `render.yaml`).
- Fill the env vars: `MONGODB_URI` (Atlas string), `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
  `CLIENT_ORIGIN` (your Netlify URL — can fill after step 3). `JWT_SECRET` is auto-generated.
- Deploy. The server auto-seeds the admin + placeholder sections on first boot.
- Note the URL, e.g. `https://anwipedia-api.onrender.com`. Check `…/api/health` → `{"ok":true}`.

### 3. Frontend → Netlify
- On Netlify: **Add new site → Import from Git**, pick the repo (uses `netlify.toml`: base `client`).
- Add env var **`VITE_API_BASE`** = your Render URL (no trailing slash). Deploy.
- Back on Render, set `CLIENT_ORIGIN` to the Netlify URL and redeploy (for CORS).

### Notes
- Mic blow needs HTTPS — Netlify provides it, so it works in production.
- Render free tier sleeps when idle; first request after a nap takes ~30s to wake.
