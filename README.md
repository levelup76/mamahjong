# mamahjong

Egy egyszerű online Mahjong játék anyák napjára (mamahjong).

Főbb jellemzők:
- 5 pálya, mindegyiken 7 egyedi kő (egyedi honőrök képekkel)
- Google bejelentkezés és eredményrögzítés
- Hangok, zene és háttérképek (admin felülettel később beállítható)

Fejlesztési megjegyzések
- Konfiguráció: `.env.local.example` tartalmazza a környezeti változókat.
- Google OAuth: állítsd be a `GOOGLE_CLIENT_ID` és `GOOGLE_CLIENT_SECRET` értékeket a GitHub Secrets vagy `.env` fájlban.

Hogyan publikálom a repo-t (ha szükséges):
```bash
# ha nincs telepítve: brew install gh
cd /path/to/mamahjong
gh repo create mamahjong --private --source=. --remote=origin --push
```

Később: szeretnél segítsek beállítani CI-t, GitHub Secrets-et, vagy a Google OAuth konfigurációt?
