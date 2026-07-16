# Fiszki OBRONA 🧠

Interaktywne fiszki do obrony z psychologii. Pytanie → dotknij → odpowiedź → następne.
Aplikacja **działa offline** (np. w samolocie) i jest **mobile-first** (iPhone 14 i inne).

**Na żywo:** https://fszwedo.github.io/fiszki-dla-pauliny/

## Funkcje
- 271 fiszek w 9 działach (filtr działów + losowa kolejność).
- Dłuższe odpowiedzi: punkty + rozwinięcie ("note").
- Przycisk **„Umiem — nie pokazuj”** trwale ukrywa fiszkę (zapis w `localStorage`).
- Menu: przetasuj, przywróć ukryte, zmień działy.
- PWA — dodaj do ekranu głównego (Safari → Udostępnij → Do ekranu początkowego), działa bez internetu.

## Jak używać na iPhonie offline
1. Otwórz link w Safari (raz, online — pobierze dane).
2. Udostępnij → **Do ekranu początkowego**.
3. Uruchamiaj z ikony — działa w samolocie.

## Technicznie
Czysty HTML/CSS/JS, bez buildu. Service worker (`sw.js`) cache'uje całą aplikację i dane.
Hostowane na GitHub Pages (pliki serwowane 1:1, `.nojekyll`).

```
index.html · app.css · app.js · app.webmanifest · sw.js
data/cards.json   — treść fiszek
icons/            — ikony PWA
```

Treść skondensowana automatycznie z materiałów źródłowych — przed obroną warto przejrzeć pod kątem drobnych nieścisłości.
