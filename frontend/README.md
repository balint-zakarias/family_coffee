# FamilyCoffee – Backend (Django + GraphQL)

Ez a projekt egy kávéforgalmazó kisvállalkozás webes backendje.  
Django alapú API + GraphQL endpoint, fejlesztési célra előre feltöltött mintatermékekkel és tartalommal.

## Funkciók (jelen állapot)
- **Termékek** és **kategóriák** kezelése (adminban)
- **GraphQL API** a publikus lekérdezésekhez (`/graphql`)
- **SiteContent** modell – nyitóoldal tartalom szerkesztéséhez
- **ContactMessage** – kapcsolatfelvételi űrlap üzenetek mentése
- **Order**/**OrderItem** – rendelések nyilvántartása (most még csak seedelt mintaadatok)
- **Fejlesztői seed script** képekkel és mock adatokkal

---

## Fejlesztői környezet beállítása

### 1. Klónozás
git clone https://github.com/<felhasznalo>/<repo>.git
cd <repo>/backend

### 2. Virtualis kornyezet
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

### 3. Migrációk futtatása
python manage.py migrate

### 4. Szuperuser létrehozása
python manage.py createsuperuser

### 5. Fejlesztői képek elhelyezése
python seed_dev.py

### 6. Seed script futtatása
python seed_dev.py

### 7. Szerver indítása
python manage.py runserver