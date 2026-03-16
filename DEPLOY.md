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

Per applicare le modifiche al database (quindi già esistente) usare il file `patch_after_dump.sql`.
