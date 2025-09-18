# ☕ Family Coffee

A full-stack web application for a small coffee business.  
It provides product and category management, order tracking, a GraphQL API, and an Angular-based frontend.

---

## 📑 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [Setup & Run](#-setup--run)
  - [Backend (Django)](#backend-django)
  - [Frontend (Angular)](#frontend-angular)
- [Configuration](#-configuration)
- [Seeding Development Data](#-seeding-development-data)
- [Deployment](#-deployment)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 🚀 Features
- Product and category CRUD management  
- Order handling and tracking  
- Contact form for customer inquiries  
- GraphQL API for frontend consumption  
- Django Admin interface for content management  
- Development seed script for test data  

---

## 🛠 Tech Stack

| Layer       | Technology                                               |
|-------------|----------------------------------------------------------|
| **Backend** | Django 4.2, Graphene-Django (GraphQL), Django CORS       |
| **Database**| SQLite (development) — can be switched to PostgreSQL etc.|
| **Frontend**| Angular 16+, Angular Material, RxJS, TypeScript          |
| **Deployment** | Docker / manual scripts inside `deploy/`              |

---

## 📂 Project Structure

family_coffee/
├── backend/        # Django + GraphQL backend
│   ├── manage.py
│   ├── requirements.txt
│   └── seed_dev.py
├── frontend/       # Angular web client
│   ├── src/
│   ├── angular.json
│   └── package.json
├── deploy/         # Deployment configuration
└── README.md

---

## 📋 Requirements
- **Python** ≥ 3.10  
- **pip** (or pipx/poetry if preferred)  
- **Node.js** ≥ 18 and **npm**  
- **Angular CLI** (`npm install -g @angular/cli`)  
- **Git**  
- (Optional) **Docker** for containerized deployment  

---

## ▶️ Setup & Run

### Backend (Django)
```bash
# Enter backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Load seed data (optional, see below)
python seed_dev.py

# Start development server
python manage.py runserver

	•	Backend runs on: http://localhost:8000
	•	Django Admin: http://localhost:8000/admin
	•	GraphQL API: http://localhost:8000/graphql

# Enter frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm start

	•	Frontend runs on: http://localhost:4200
	•	Make sure the backend is running for API calls to work.

⚙️ Configuration
	•	Backend default DB: SQLite (db.sqlite3) in the backend folder.
	•	For production, update DATABASES in backend/settings.py (e.g. PostgreSQL).
	•	CORS is enabled for local development — adjust for production.
	•	.env file support can be added (not included by default).

🚀 Deployment
	•	The deploy/ folder contains configuration for deployment (Docker and scripts).
	•	Recommended steps:
	1.	Switch database to PostgreSQL in production.
	2.	Configure environment variables (secret key, DB, CORS).
	3.	Build Angular frontend (npm run build) and serve via Nginx or another static server.
	4.	Use a production WSGI server for Django (e.g. Gunicorn, uWSGI).
	5.	Place behind a reverse proxy (e.g. Nginx/Apache).

🔮 Future Improvements
	•	Authentication & user accounts
	•	Tests for backend (pytest/Django tests) and frontend (Karma/Jest)
	•	CI/CD pipeline (GitHub Actions)
	•	Switch from SQLite → PostgreSQL in production
	•	Internationalization (multi-language support)   