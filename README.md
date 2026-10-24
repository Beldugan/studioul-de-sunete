# 🎵 Studioul de sunete

Aplicație interactivă de fizică pentru Eva (7–8 ani, sistemul britanic, Year 3–4): **sunetul**. Ce este, cum călătorește, cum îl faci mai înalt, mai jos, mai tare sau mai încet. Toate instrumentele **sună de-adevăratelea**: sunetele sunt create direct în browser (Web Audio), fără fișiere audio. Nu folosește biblioteci externe și nu are nevoie de internet: dublu-click pe `index.html`.

## Cele cinci secțiuni

| Secțiunea | Ce face copilul | Ce învață |
|---|---|---|
| 🔊 **Ce este sunetul?** | Toba cu boabe de orez (lovitură ușoară / tare) · sunetul trimis prin aer, apă, lemn și spațiu, cu viteza reală, la 1 km · clopoțelul din borcanul de sticlă, cu pompa de vid și manometrul · radioul: mai aproape / mai departe, cu folie, carton, cofraj de ouă sau pernă între ele | sunetul = vibrație; vibrație mai mare = sunet mai tare; sunetul are nevoie de particule (aer, apă, solid); în vid nu se aude; scade cu distanța; materialele moi izolează |
| 🎸 **Atelierul de instrumente** | 8 pahare cu apă colorată (tragi în sus/jos ca să pui sau să scoți apă), cu două moduri: **lovit cu lingurița** și **suflat peste gura sticlei** · chitara din cutie de pantofi (grosimea elasticului, cât e de întins, lungimea dată de creion) · constructorul de tobe (mărime, cât e de întinsă pielea) | înălțimea sunetului (pitch); mai multă apă → mai jos la lovit, dar **mai înalt la suflat**; elastic subțire, întins, scurt → mai înalt; tobă mare → mai jos |
| 〰️ **Laboratorul undelor** | Osciloscop: glisoare pentru înalt/jos și tare/încet, cu valul „vechi” păstrat pentru comparație · **microfonul**: își vede vocea ca undă, nota cântată, cea mai înaltă și cea mai joasă notă · auzul animalelor · cuvinte RO/EN de la școală | valuri dese = sunet înalt; valuri mari = sunet tare; animalele aud alte intervale decât oamenii |
| 🩺 **Sunetul la lucru** | **Medicină:** ecograful (Eva plimbă sonda și descoperă un bebeluș sau un rinichi cu piatră și umbra ei acustică), stetoscopul (inima în repaus și după alergat), spargerea pietrelor la rinichi cu unde de șoc. **Arme și apărare:** sonarul unui submarin care găsește după ecou o balenă, o stâncă și un submarin ascuns (cu buton „De la capăt”), **5 misiuni de navigare** în întuneric doar cu sonarul (limite de 1, 1½, 2, 3 și 4 minute; fiecare traseu e verificat automat ca să aibă drum liber), „tunul de sunet” (LRAD) cu care navele alungă pirații, creveta-pistol, rigla decibelilor | ultrasunete, ecou, distanța = viteza × timpul ÷ 2, sunetul concentrat, protejarea auzului |
| ⭐ **Provocări** | **Urechea de aur** (mai înalt/jos și mai tare/încet, tot mai greu) · **Acordorul** (acordează un pahar după ureche) · trei melodii la pahare: *Twinkle, Twinkle*, *Oda bucuriei*, *Mary Had a Little Lamb* · **Ecoul memoriei** (Simon cu clopoței) | 18 stele, salvate în browser; după fiecare provocare: „Ai descoperit” + „În viața reală” |
| ❓ **Quiz** | 10 întrebări cu explicații | recapitulare |

## Experimente de făcut și acasă, după aplicație

- **Toba cu orez**: un castron acoperit cu folie alimentară întinsă, câteva boabe de orez, lovești lângă el cu o tavă.
- **Paharele cu apă**: 6–8 pahare identice, apă colorată cu colorant alimentar, o linguriță. Apoi aceleași cu sticle, suflând peste gură.
- **Chitara din cutie de pantofi**: o cutie fără capac, cu o gaură decupată, 3 elastice de grosimi diferite și un creion pus dedesubt pe post de căluș.
- **Telefonul din pahare și sfoară**: sunetul călătorește prin sfoara întinsă.

## Caracteristici

- **Bilingv RO / EN**, comutare instantanee din antet
- Temă deschisă / întunecată, buton de oprire a sunetului
- Merge pe telefon, tabletă și calculator (mouse, deget sau tastele 1–8 la pahare)
- Microfonul se folosește doar local: nimic nu se înregistrează sau trimite
- Volumul e limitat de un compresor, ca să nu fie niciodată prea tare

## Structura

```
index.html
assets/
  css/style.css   – stilul comun al seriei
  css/studio.css  – stilul aplicației
  js/i18n.js      – toate textele RO/EN, vocabularul, quizul
  js/audio.js     – motorul de sunet (pahar, sticlă, elastic, tobă, clopoțel)
  js/art.js       – desenele realiste (tobe, pahare, sticle, cutia-chitară, clopotul de sticlă, pompa, radioul)
  js/app.js       – logica, animațiile și jocurile
  js/work.js      – secțiunea „Sunetul la lucru” (medicină, arme și apărare)
  js/nav.js       – misiunile de navigare cu sonarul (5 trasee)
.github/workflows/pages.yml
```

## Fizica din spate (simplificat, dar consecvent)

- Paharul lovit: frecvența scade cu nivelul apei (`f = 1100 · (1 − 0,55 · w^1,5)` Hz).
- Sticla suflată: coloana de aer, `f = 343 / (4 · L)`, unde `L` = înălțimea aerului rămas.
- Elasticul: `f ∝ (1/L) · √(T/μ)` — lungime, tensiune, grosime. Sunetul este sintetizat cu algoritmul Karplus-Strong (sună ca o coardă reală).
- Toba: `f ∝ (1/diametru) · √tensiune`.
- Viteza sunetului: aer 343 m/s, apă 1.480 m/s, lemn ~3.500 m/s; animația pentru 1 km rulează în timp real.

## Publicare pe GitHub Pages

1. Creează un repository gol numit `studioul-de-sunete`.
2. Din folderul aplicației:
   ```bash
   git init && git add . && git commit -m "Prima versiune"
   git branch -M main
   git remote add origin https://github.com/Beldugan/studioul-de-sunete.git
   git push -u origin main
   ```
3. *Settings → Pages → Source*: **GitHub Actions**.

## Licență

Codul: MIT (vezi `LICENSE`). Melodiile folosite sunt populare / din domeniul public.
