# 🧪 Testing Guide

Ez a dokumentum leírja, hogyan futtasd az integrációs teszteket a Family Coffee projektben.

## Backend Tesztek (Django)

### Futtatás
```bash
cd backend
python manage.py test

# Vagy specifikus app tesztelése
python manage.py test catalog
python manage.py test contentapp
python manage.py test cart
```

### Mit tesztelünk
- **Catalog API**: Termékek lekérdezése, létrehozása, only_for_rent funkció
- **Content Management**: Site content CRUD műveletek
- **Cart**: Kosár funkciók, termék hozzáadás

## Frontend Tesztek (Angular + Jasmine)

### Unit/Integration tesztek
```bash
cd frontend
npm test                    # Interaktív mód
npm run test:integration    # Egyszeri futtatás
```

### Mit tesztelünk
- **ProductCard komponens**: Ár megjelenítés, rental indikátor
- **Komponens interakciók**: Event emitting, input handling

## E2E Tesztek (Playwright)

### Telepítés
```bash
cd frontend
npm install @playwright/test
npx playwright install
```

### Futtatás
```bash
npm run e2e        # Headless mód
npm run e2e:ui     # UI mód
```

### Mit tesztelünk
- **Teljes user flow**: Termék böngészés, részletek megtekintés
- **Rental funkció**: Bérlési indikátor és árazás megjelenítés
- **Kosár funkció**: Termék hozzáadás kosárhoz

## Teszt Struktúra

```
backend/
├── catalog/tests.py        # Catalog API tesztek
├── contentapp/tests.py     # Content management tesztek
├── cart/tests.py          # Cart funkció tesztek
└── run_tests.py           # Test runner script

frontend/
├── src/shared/ui/product-card/product-card.spec.ts  # Komponens tesztek
└── e2e/product-browsing.spec.ts                     # E2E tesztek
```

## CI/CD Integráció

A teszteket könnyen integrálhatod CI/CD pipeline-ba:

```yaml
# GitHub Actions példa
- name: Run Backend Tests
  run: |
    cd backend
    python manage.py test

- name: Run Frontend Tests  
  run: |
    cd frontend
    npm run test:integration

- name: Run E2E Tests
  run: |
    cd frontend
    npm run e2e
```

## Teszt Adatok

A tesztek saját test adatbázist használnak, nem érintik a fejlesztői adatokat.
