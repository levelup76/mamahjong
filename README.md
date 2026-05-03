# mamahjong

Egy egyszerű online Mahjong játék anyák napjára (mamahjong).

Főbb jellemzők:
- 5 pálya, mindegyiken 7 egyedi kő (egyedi honőrök képekkel)
- Google bejelentkezés és eredményrögzítés
- Hangok, zene és háttérképek (admin felülettel később beállítható)

Fejlesztési megjegyzések
- Konfiguráció: `.env.local.example` tartalmazza a környezeti változókat.
- Google OAuth: állítsd be a `GOOGLE_CLIENT_ID` és `GOOGLE_CLIENT_SECRET` értékeket a GitHub Secrets vagy `.env` fájlban.

Tileset és képek
- A játék alapértelmezett, minden játékosnál azonos kődesignja a Bamboo tileset:
  `public/tilesets/bamboo-normalized`.
- A tileset PNG-k KMahjongg sprite-ból nagy felbontásban kinyerhetők:
  `./scripts/extract-tileset.sh <sprite.svg> bamboo`.
- A kinyert face képek változó SVG bounding boxból jönnek, ezért játék előtt
  normalizálni kell őket egységes 390×512 canvasra:
  `npm run tileset:normalize`.
- A normalizáló a KMahjongg dokumentált metrikáit használja: 96×116 teljes kő,
  69×89 face, 12 px level offset. Ez a Bamboo canvasra skálázva a face képeket
  a megfelelő előlap-területre helyezi. A kőháttereket is trimeli, mert az SVG
  export átlátszó margót hagyhat körülöttük.
- Az admin felületen feltöltött családi honőr képek pályánként felülírják a
  Bamboo `honor-*` képeket. A többi kő továbbra is a lokális Bamboo tilesetből
  jön.
- Jelenlegi játékbeli tuning: háttér scale `1.1`, vízszintes gap `26`,
  függőleges gap `33.5`, z-offset `5`.
- Debug tuning panel: `/play/1?debugTiles=1`.

Lokális fejlesztés
```bash
npm run dev:local
```

Ez fixen a `http://127.0.0.1:3000` címen indítja a Next dev szervert,
Turbopack nélkül. Build futtatás előtt érdemes leállítani a dev szervert.

Hogyan publikálom a repo-t (ha szükséges):
```bash
# ha nincs telepítve: brew install gh
cd /path/to/mamahjong
gh repo create mamahjong --private --source=. --remote=origin --push
```

Később: szeretnél segítsek beállítani CI-t, GitHub Secrets-et, vagy a Google OAuth konfigurációt?
