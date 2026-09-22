# Kino klub — frontend

Slovenská aplikácia pre rezervácie kina: React, TypeScript, Vite a Tailwind CSS 4.
Používa reálny FastAPI backend z projektu `Reservation-System`; ceny, oprávnenia,
rezervácie, platby a vstupenky vždy potvrdzuje server.

## Lokálne spustenie

Vyžaduje Node.js >=22.12 a backend na `http://127.0.0.1:8010`.

```sh
npm ci
npm run dev
```

Frontend beží na [http://127.0.0.1:5180](http://127.0.0.1:5180).
Vite preposiela `/api` na backend. Voliteľné nastavenia sú v `.env.example`:

| Premenná | Význam |
|---|---|
| `API_PROXY_TARGET` | Backend pre dev/preview; predvolene `http://127.0.0.1:8010` |
| `VITE_API_URL` | Verejná klientská adresa API; predvolene `/api` |

Premenné `VITE_` sú súčasťou klientského balíka a nesmú obsahovať tajomstvá.
Backend spustite podľa jeho README. Po jeho lokálnom seedovaní sú dostupné účty
`customer@cinema.test`, `manager@cinema.test` a `admin@cinema.test` so spoločným
heslom `CinemaDemo-2026!`. Registrácia vytvára zákazníka.

## Štruktúra

```text
src/
  main.tsx                  vstup aplikácie a lokálne fonty
  app/
    App.tsx                 poskytovatelia, router, hranica chýb
    router.tsx              cesty a načítanie obrazoviek
    providers/              životný cyklus prihlásenej session
    shell/                  navigácia, päta a hranica chýb
    styles/                 vstup CSS, tokeny a základné HTML pravidlá
  features/
    auth/                   prihlásenie, registrácia a ochrana ciest
    account/                profil a zmena hesla
    programme/              verejný program a filtre
    booking/                sedadlá, opakovanie rezervácie, platba a vstupenky
    visits/                 vlastné rezervácie a doručenie
    management/             správa kina, editory, používatelia a kontrola vstupu
    cinemas/                verejný zoznam kín
  shared/
    api/                    HTTP klient a typy serverového kontraktu
    lib/                    formátovanie a zdieľané asynchrónne hooky
    ui/                     formuláre, dialógy, hlásenia a filmový plagát
```

Doménový stav zostáva vo funkcii, ktorá ho používa. Zdieľaný HTTP klient rieši
session, serverové chyby a stránkovanie. Správa kina má samostatné panely a editory;
router ani zdieľané UI neobsahujú obchodné operácie.

## Dizajn a štýly

Dizajn vychádza z `skill/cinema-design-complete (3).md` a troch dodaných obrázkov.
Úvodná stránka používa široký filmový záber, výrazný titulok a kolekciu plagátov.
Pri jedinom filme sa kolekcia zmení na kompaktný pás s najbližším premietaním.
Rezervácia má plagát prekrývajúci záhlavie, kroky Miesta → Platba → Vstupenky,
mapu sály uprostred a údaje o premietaní vpravo. Vstupenky majú svetlý odtrhávací
pás a filmový obraz. Rad a miesto sú zobrazené samostatne; Code128 kóduje
skutočný vstupný kód cez lokálnu knižnicu JsBarcode. Malý pás je náhľad, detail
zobrazuje celý čiarový kód aj textový kód na manuálne overenie. Čierne plochy, červené akcie a úzka nadpisová typografia
zjednocujú celý tok aj jeho mobilnú verziu.

Tailwind 4 zabezpečuje rozloženie a typografiu priamo v komponentoch. Opakované
ovládacie prvky používajú `@apply` v zdieľanom UI. Farby sú centralizované v
`app/styles/theme.css`; Tailwind je zapojený bez Preflight resetu. Geometria sedadiel,
plagáty, vstupenka a špecifické detaily majú vlastné CSS pri danej funkcii.
Súbory `*.responsive.css` sa načítavajú po základných štýloch. Fonty DM Sans
a Bebas Neue sa načítavajú lokálne.

Originálny filmový obraz je v `public/artwork/journey-beyond.png` (1672 × 941).
Bol vytvorený vstavaným nástrojom ImageGen. Keďže API neposkytuje obrázky filmov,
`shared/lib/artwork.ts` používa tento spoločný vizuál; názvy, ceny a termíny zostávajú
reálne údaje servera. Mapa zachováva čísla sedadiel, značky výberu/obsadenosti,
šípky, viditeľný fokus, mobilný 44px rozmer a alternatívny zoznam.

<details>
<summary>Finálny prompt použitého filmového obrazu</summary>

```text
Use case: ads-marketing.
Asset type: original photographic movie key art for a cinema website, one wide 2048 × 1152 landscape image that can also be cropped into a portrait poster.
Primary request: a cinematic still for the fictional science-fiction drama “A Journey Beyond”; no written title in the image.
Scene/backdrop: an immense abandoned futuristic city receding into copper-colored storm clouds, monumental weathered towers, distant atmospheric haze and tiny warm lights among the ruins. The setting feels physically real and vast.
Subject: one adult woman explorer, waist-up, positioned entirely on the RIGHT side with her face centered about 77% across the image. She wears a textured dark charcoal expedition coat and a subtle deep red scarf. A natural, serious expression and windswept dark hair, looking slightly toward the left horizon. An original face, not resembling a known actor. Keep her face and upper body clearly legible within a right-side portrait crop.
Style/medium: high-budget cinematic photorealistic key photography, sophisticated film color grading, realistic skin texture, subtle film grain, rich fabric detail, optical depth and realistic atmospheric perspective. Premium theatrical science-fiction drama campaign quality.
Composition/framing: wide 16:9 landscape. Keep the LEFT 40% unobstructed and low-detail: dark charcoal atmospheric city haze with enough natural negative space for later white UI copy. The protagonist occupies the right quarter to right third, anchored from mid-frame to the lower edge. Leave comfortable breathing room above her head. Do not center the character.
Lighting/mood: restrained amber rim light from the copper sky, soft cool directional light on the face, deep charcoal shadows, mysterious and emotionally grounded. Dramatic but readable, with controlled highlights.
Constraints: exactly one person. No text, no typography, no logos, no watermarks, no badges, no graphics, no frames, no UI. No illustration, no vector art, no cartoon, no obvious synthetic 3D render.
```

</details>

## Funkcie a hranice

Program, registrácia, prihlásenie, profil, viacmiestna rezervácia s bezpečným
opakovaním po strate odpovede, odpočítavanie serverového termínu, zrušenie holdu,
nákup, vlastné vstupenky, správa kín/programu/používateľov a jednorazová kontrola vstupu.
Manažér vidí pridelené kiná; administrátor celú správu. Backend overuje oprávnenia
pri každej operácii. Čas sa zobrazuje v časovom pásme zariadenia a sumy z celých centov.

Rezervovať a zaplatiť sa dá aj bez účtu. Neprihlásený návštevník zadá meno a
e-mail, backend cez `POST /guest/reservations` vytvorí hold a vráti opaque guest
token, ktorým sa autorizuje čítanie, platba aj zrušenie tej istej rezervácie
(prihlásenie zostáva voliteľné). Token uchovávame v `sessionStorage` aktuálnej
karty pod ID rezervácie a rešpektujeme jeho platnosť.

Platba a doručenie sú lokálne simulácie. UI to výslovne uvádza, nežiada kartu a
nestrháva peniaze. Simulačná platba sa zobrazí iba pri príslušnej operácii v OpenAPI.
Reálny poskytovateľ, e-mailové doručenie a refundácie vyžadujú ďalšiu integráciu.
Bearer session zostáva v pamäti a `sessionStorage` aktuálnej karty; odhlásenie ju
ruší a zmena hesla vyžaduje nové prihlásenie. Kódy vstupeniek sa zobrazujú súkromne.
Guest bez účtu sa k rezervácii vráti len v okne prehliadača, kde nakúpil (token je
v `sessionStorage`); po zatvorení okna alebo vypršaní tokenu prístup zaniká.
E-mailové doručenie odkazu zatiaľ nie je integrované.

## Overenie

```sh
npm run typecheck
npm run format:check
npm run build
```

Testovacie súbory a nástroje nie sú súčasťou frontendového projektu.

## Build a hosting

```sh
npm run build
npm run preview
```

Build je v `dist/`; preview beží na `http://127.0.0.1:4173` s lokálnou API proxy.
Produkčný server musí zabezpečiť HTTPS, proxy `/api/` a návrat `index.html` pre
klientské cesty. Pri API na inom origine nastavte povolený pôvod v backende.
Vite preview ani demo účty nie sú produkčné nasadenie.
