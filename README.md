# DEW Gestionale RSA

Applicazione full stack per la gestione dei menù, dei piatti, degli utenti backoffice e della reportistica di una RSA.

Il progetto è stato pensato per lavorare **sullo stesso database dell'app mobile** già esistente. Per questo motivo il codice evita modifiche incompatibili allo schema condiviso e introduce le estensioni necessarie del gestionale solo tramite tabelle aggiuntive compatibili.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Auth backoffice: cookie HTTP-only + JWT firmato lato backend

## Struttura principale

```text
backend/
  config/
  controllers/
  db/
  jobs/
  middlewares/
  repositories/
  routes/
  services/
src/
  components/
  config/
  context/
  hooks/
  pages/
  services/
  utils/
shared/
  constants.js
sql/
  20260314_add_food_availability_pairing_replacements.sql
```

## Cosa è stato sistemato nel refactor

- configurazione backend centralizzata e letta da `.env`
- sessione backoffice più sicura: ad ogni richiesta l'utente viene riletto dal database
- eliminato il fallback insicuro del secret JWT
- upload immagini piatti reso più sicuro e configurabile
- cartella immagini separata dal path pubblico e pilotabile via variabili d'ambiente
- ripristino sospensioni piatti corretto senza toccare tabelle condivise con la mobile app
- dashboard sospensioni ottimizzata, senza query N+1 per i sostituti
- route archivio ripulite: rimangono solo endpoint di lettura
- eliminati endpoint e pagine di test/debug
- frontend allineato a un layer API centralizzato (`src/services/*Api.js`)
- reportistica spostata fuori dal controller in un service dedicato
- introdotti file di deploy minimi (`DEPLOY.md`, config PM2, config Nginx)

## Variabili d'ambiente principali

### Backend (`backend/.env`)

- `NODE_ENV`
- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_CONNECTION_LIMIT`
- `CORS_ORIGIN`
- `TRUST_PROXY`
- `JWT_SECRET`
- `SESSION_DURATION_HOURS`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `COOKIE_DOMAIN`
- `FOOD_IMAGES_DIR`
- `FOOD_IMAGES_PUBLIC_PATH`
- `LOG_DIR`
- `LOG_LEVEL`
- `ENABLE_SCHEDULERS`
- `SCHEDULER_LOCK_NAME`

### Frontend (`.env`)

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`
- `VITE_FOOD_IMAGES_PUBLIC_PATH`

## Avvio locale

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend

```bash
npm install
npm run dev
```

## Database

Per una base nuova dopo il dump:

1. importa `Dump_dell_app_mobile.sql`
2. esegui `patch_after_dump.sql`
3. se il database era già stato portato avanti in precedenza, esegui anche la migration incrementale:

```bash
sql/20260314_add_food_availability_pairing_replacements.sql
```

## Nota importante sulle sospensioni piatti

Per rendere il ripristino sicuro, il gestionale ora traccia i pairing sostitutivi creati durante una sospensione nella tabella:

- `food_availability_pairing_replacements`

In questo modo, quando la sospensione termina, vengono spenti **solo** i pairing sostitutivi realmente creati dal gestionale per quella sospensione, senza toccare pairing legittimi del menù.

## Cartelle runtime

In locale il progetto usa già queste cartelle:

- `storage/food-images/`
- `logs/`

In produzione puoi spostarle fuori dal repository semplicemente cambiando `.env`.

## Healthcheck

Il backend espone:

```text
GET /health
```

Risponde con un JSON semplice utile per controllo processo / reverse proxy.

## Deploy

Per una guida più pratica e concreta guarda `DEPLOY.md`.
