# Mamahjong AI handoff

Frissítve: 2026-05-03

Ez a dokumentum azért van a repo gyökerében, hogy Claude és Codex ugyanabból a
képből induljon tovább. A lokálisan kinyert Bamboo tileset a játék globális,
minden játékosnál azonos alapértelmezett kődesignja. Az admin/Supabase asset
rendszer megmarad a családi honőr fotókhoz, hangokhoz és hátterekhez.

## Projektkép

- Next.js 15 + React 19 + Tailwind alkalmazás.
- Mahjong solitaire játék 5 pályával, mindegyik 144 kővel.
- A játéklogika a `lib/game.ts` fájlban van:
  - 72 párból építi a klasszikus mahjong készletet.
  - `dealSolvable()` csak kliensen biztonságos, mert `Math.random()`-ot használ.
  - `tagHonorsForBoard()` boardhoz címkézi a honőr köveket, hogy pályánként
    saját képet kaphassanak.
- A pályaformák a `lib/layouts.ts` fájlban vannak.
- A játék képernyő fő komponensei:
  - `components/Game.tsx`: állapot, timer, undo, hint, pause, score mentés.
  - `components/Board.tsx`: stage méretezés és kövek renderelése.
  - `components/Tile.tsx`: egyetlen kő vizuális megjelenése.
- Az admin asset rendszer Supabase Storage + `assets` tábla alapon működik:
  - `lib/assets.ts`: aktív assetek lekérése és URL-re oldása.
  - `app/admin/*`: háttér, zene, hang és egyedi honőr képek feltöltése.

## Jelenlegi worktree állapot

Ezek a fájlok már módosítottak voltak az áttekintéskor, ezért óvatosan kell
hozzájuk nyúlni:

- `app/globals.css`
- `components/Board.tsx`
- `components/Game.tsx`
- `components/Tile.tsx`
- `lib/glyphs.ts`

Új, még nem követett elemek:

- `public/tilesets/bamboo/*`
- `scripts/extract-tileset.sh`

Fontos: ezeket nem szabad visszavonni vagy "takarítani" külön kérés nélkül.
Valószínűleg Claude előkészítő munkája van bennük.

## Bamboo assets állapot

A `public/tilesets/bamboo` mappában már megvannak:

- alap kőlap: `tile.png`
- kijelölt kőlap: `tile_selected.png`
- teljes kőjel-készlet: `bam-*`, `char-*`, `dot-*`, `honor-*`, `flower-*`,
  `season-*`

A fájlok a `scripts/extract-tileset.sh` alapján KMahjongg sprite-ból lettek
kinyerve. Az extract script nagy felbontású nyers PNG-ket készít
(`TILESET_RAW_HEIGHT`, alapból 1024 px magas elemek). A kinyert face képek
változó SVG bounding boxból érkeznek, ezért `scripts/normalize-tileset.mjs`
egységes 390×512-es canvasra normalizálja őket a
`public/tilesets/bamboo-normalized` mappába. A normalizálás a KMahjongg
dokumentált metrikáit követi: 96×116 teljes kő, 69×89 face, 12 px level offset.
A renderelés most már ezt a normalizált Bamboo készletet használja:

- A kőhátterek (`tile.png`, `tile_selected.png`) is trimelve vannak
  normalizáláskor, mert az SVG export átlátszó margót hagyhat körülöttük.
  Ha ez nincs levágva, a háttérkő a játékban túl kicsinek látszik.

- `lib/tilesets.ts` oldja fel a Bamboo public URL-eket.
- `Board.tsx` először az adminból érkező board-specifikus honőr képet keresi.
  Ha nincs, a Bamboo tileset képét adja tovább.
- `Tile.tsx` a Bamboo lap PNG-t rendereli alapként, erre kerül a Bamboo jel
  vagy az adminból feltöltött családi kép.

## Tervezett módosítások

1. Board méretezés ellenőrzése
   - A Bamboo alaplap 195x256 képarányú, míg a mostani CSS kő kb. 52x67.6 px.
   - A mostani arány közel jó, de a renderelt belső kép pozicionálását és
     `object-fit` értékeit ellenőrizni kell.
   - Ha a bitmap lap optikailag túl keskeny/széles, csak a `Tile.tsx`
     konstansait módosítanám, a layout koordinátarendszerét nem.

2. Mobil nézet ellenőrzése és finomítása
   - A mobil nézet fontos célfelület, nem opcionális utómunka.
   - A Bamboo bitmap kövek bekerülése után ellenőrizni kell, hogy:
     - a board nem lóg ki kis kijelzőn;
     - a felső vezérlősor nem takarja a játékteret;
     - a gombok érinthető méretűek maradnak;
     - a nyerés/elakadás üzenetek nem törik szét a layoutot.
   - Első körben a meglévő `Board.tsx` scale-to-fit logikát és a `Game.tsx`
     fejléc/toolbar elrendezését kell finomítani, nem a pálya layout adatokat.

3. Ellenőrzés
   - `npm run build`
   - Ha a lint script hibázik a Next 15 / ESLint config miatt, azt külön
     jelezni kell, nem automatikusan átírni.
   - Lokális dev szerveren vizuális ellenőrzés legalább egy pályán desktopon
     és mobil viewporton.

## Javasolt implementációs sorrend

1. `lib/tilesets.ts` létrehozva.
2. `Tile.tsx` propjai kiegészítve bitmap renderhez.
3. `Board.tsx` admin honőr image URL-t használ elsőbbséggel, különben Bamboo
   képet.
4. `app/globals.css` finomítva a bitmap renderhez.
5. `Game.tsx` mobil toolbar/board elrendezése első körben sűrítve.
6. README frissítve.
7. Build lefuttatva: `npm run build` sikeres.

## Aktuális Bamboo render beállítások

- A játék a normalizált készletet használja: `public/tilesets/bamboo-normalized`.
- A public URL-eket a `lib/tilesets.ts` oldja fel.
- A kőháttér és a piktogram külön réteg:
  - háttér: `tile.png` vagy `tile_selected.png`
  - piktogram/fotó: Bamboo face kép vagy adminból feltöltött honőr kép
- A kőméret a `components/Tile.tsx` fájlban van:
  - `UNIT = 26`
  - `TILE_W = 52`
  - `TILE_H = TILE_W * (256 / 195)`
  - `Z_OFFSET = 5`
- A véglegesített jelenlegi vizuális tuning:
  - kőháttér scale: `1.1`
  - `Gap X`: `26`
  - `Gap Y`: `33.5`
  - `Z off`: `5`
- A gap értékek nem a kő méretét változtatják, hanem a pozíciós rácsot:
  - `stepX` szabályozza a vízszintes távolságot
  - `stepY` szabályozza a függőleges távolságot
- Azonos szinten a kirajzolási sorrend meg lett fordítva:
  - jelenlegi z-index: `tile.z * 1000 - tile.y * 10 - tile.x`
  - cél: azonos rétegen a kövek oldalfala természetesebben takarjon.

## Fejlesztői tile tuning panel

- A panel csak URL paraméterrel jelenik meg:
  - `/play/1?debugTiles=1`
- A panel a `components/Game.tsx` végén él (`TileTuningPanel` és
  `TuningSlider`).
- Jelenleg állítható:
  - háttér scale/x/y/w/h
  - `Gap X`
  - `Gap Y`
  - `Z off`
- Fontos: a kő mérete nem állítható a panelből. A felhasználói döntés az volt,
  hogy a kövek közti távolságot kell hangolni, nem a kövek méretét.

## Asset pipeline parancsok

- Nyers Bamboo PNG-k újragenerálása SVG-ből:
  - `./scripts/extract-tileset.sh /private/tmp/kmahjongg-previews/bamboo.svg bamboo`
  - alap raw magasság: `1024px`
  - felülírható: `TILESET_RAW_HEIGHT=2048 ./scripts/extract-tileset.sh ...`
- Normalizált játékbeli készlet generálása:
  - `npm run tileset:normalize`
- Lokális dev szerver:
  - `npm run dev:local`
  - fixen `http://127.0.0.1:3000`
  - a script Turbopack nélkül fut, mert a Turbopack dev cache többször
    `.next` manifest hibát okozott build/dev váltáskor.
- Build futtatás előtt érdemes leállítani a dev szervert, majd utána újraindítani.

## Együttműködési szabály Claude és Codex között

- Minden új döntést ide vagy a README-be kell felírni, ha később számít.
- A módosított, de nem saját fájlokat nem szabad visszavonni.
- Ha a Bamboo design után adminból feltöltött honőr kép eltűnik, az regresszió.
- Ha a játék SSR/hydration hibát jelez, először a kliens oldali deal/mount
  logikát kell nézni a `Game.tsx` fájlban.
- Ha a board mobilon kilóg vagy túl kicsi, először a `Board.tsx` scale-to-fit
  logikát kell ellenőrizni, nem a layout adatokat.

## Döntések és nyitott kérdések

- Döntés: a Bamboo tileset minden játékosnak ugyanaz, nincs játékosonkénti
  témaválasztás.
- Döntés: az adminból feltöltött családi honőr képek elsőbbséget élveznek az
  adott pályán.
- Döntés: a mobil UI finomítás része a Bamboo bekötésnek.
- Nyitott: vizuális böngészős ellenőrzés után kell-e további arány/pozíció
  finomítás a családi honőr képeken.
