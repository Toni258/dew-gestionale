# Deploy Linux essenziale

Questa guida è pensata per una VM Linux classica con:

- Node.js LTS
- MySQL già disponibile
- Nginx come reverse proxy
- PM2 per tenere in vita il backend

## 1. Cartelle consigliate sulla VM

Esempio semplice:

```text
/var/www/dew-gestionale/current
/var/www/dew-gestionale/storage/food-images
/var/www/dew-gestionale/logs
```

Puoi mettere il repository dentro `current/` e tenere storage/log esterni.

## 2. Backend `.env`

Nel file `backend/.env` imposta almeno:

```env
NODE_ENV=production
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=intesa_rsa_new
DB_CONNECTION_LIMIT=10
CORS_ORIGIN=https://tuo-dominio.it
TRUST_PROXY=true
JWT_SECRET=metti-un-secret-lungo-random
SESSION_DURATION_HOURS=8
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=tuo-dominio.it
FOOD_IMAGES_DIR=/var/www/dew-gestionale/storage/food-images
FOOD_IMAGES_PUBLIC_PATH=/food-images
LOG_DIR=/var/www/dew-gestionale/logs
LOG_LEVEL=info
ENABLE_SCHEDULERS=true
SCHEDULER_LOCK_NAME=dew:process-expired-dish-suspensions
```

## 3. Frontend build

Dentro la root progetto:

```bash
npm install
npm run build
```

Il build finale finirà in `dist/`.

Se frontend e backend stanno dietro lo stesso dominio, puoi lasciare:

```env
VITE_API_BASE_URL=
VITE_FOOD_IMAGES_PUBLIC_PATH=/food-images
```

## 4. Backend start

```bash
cd backend
npm install
npm run start
```

## 5. PM2

È incluso il file:

- `deploy/pm2/ecosystem.config.cjs`

Esempio:

```bash
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save
pm2 startup
```

## 6. Nginx

È inclusa una config di esempio:

- `deploy/nginx/dew-gestionale.conf`

Da adattare al tuo dominio e al path del progetto.

## 7. Static e immagini

Il backend serve le immagini dal path pubblico configurato:

```text
/food-images/<nome-file>
```

ma i file fisici vengono letti dalla cartella impostata in:

```env
FOOD_IMAGES_DIR
```

Quindi in produzione puoi tranquillamente tenere le immagini fuori dal repository.

## 8. Scheduler

Lo scheduler gira solo se:

```env
ENABLE_SCHEDULERS=true
```

In più usa un advisory lock MySQL (`GET_LOCK`) per evitare doppie esecuzioni concorrenti se il backend viene avviato accidentalmente più volte.

## 9. Healthcheck

Controllo rapido:

```text
GET /health
```

## 10. SQL da eseguire

Per nuove installazioni dopo il dump usa `patch_after_dump.sql`.

Per database già esistenti che hanno già ricevuto la patch precedente, esegui anche:

```text
sql/20260314_add_food_availability_pairing_replacements.sql
```

## 11. Nota importante

Se nel database esistono **sospensioni attive create prima di questa migration**, il nuovo tracciamento dei pairing sostitutivi non può ricostruire in automatico quali sostituzioni appartenevano a quelle vecchie sospensioni.

In quel caso conviene:

- verificare manualmente quelle sospensioni già aperte
- applicare la migration
- usare da quel momento in poi il nuovo flusso di sospensione
