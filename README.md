# Family Coffee

Kávéforgalmazó kisvállalkozás webes alkalmazása Django backend és Angular frontend technológiákkal.

## Projekt struktúra

```
family-coffee/
├── backend/          # Django + GraphQL API
├── frontend/         # Angular alkalmazás
└── deploy/          # Deployment konfigurációk
```

## Technológiák

**Backend:**
- Django 4.2
- GraphQL (graphene-django)
- SQLite adatbázis
- Django CORS headers

**Frontend:**
- Angular 20
- Angular Material
- TypeScript
- RxJS

## Gyors indítás

### Backend indítása

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python seed_dev.py
python manage.py runserver
```

### Frontend indítása

```bash
cd frontend
npm install
npm start
```

Az alkalmazás elérhető: http://localhost:4200
GraphQL endpoint: http://localhost:8000/graphql
Admin felület: http://localhost:8000/admin

## Funkciók

- Termékek és kategóriák kezelése
- GraphQL API
- Kapcsolatfelvételi űrlap
- Rendelések nyilvántartása
- Admin felület tartalomkezeléshez
