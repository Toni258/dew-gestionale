# Deploy Linux rapido per DEW Gestionale RSA

Promemoria semplice per ricordare come mettere online il progetto su una VM Linux.

## 1. Com'è fatto il deploy

Il progetto ha due pezzi:

- frontend React/Vite
- backend Node/Express

In produzione succede questo:

1. il frontend viene buildato e finisce in `dist/`
2. il backend gira a parte, per esempio sulla porta `3001`
3. Nginx sta davanti e:
    - mostra il frontend
    - gira `/api`, `/food-images` e `/health` al backend
4. PM2 tiene acceso il backend anche se cade o se la VM si riavvia

Quindi il browser non entra direttamente nel backend.
Passa prima da Nginx.

## 2. Cosa deve esserci sulla VM

Servono queste cose:

- Node.js
- npm
- Nginx
- PM2
- MySQL, locale oppure raggiungibile dalla VM

### Node.js

Serve per far girare il backend.

### npm

Serve per installare i pacchetti e fare la build del frontend.

### Nginx

Serve per pubblicare il sito e passare le richieste giuste al backend.

### PM2

Serve per non far morire il backend.

## 3. Cartelle utili

Struttura comoda:

```text
/var/www/dew-gestionale/current
/var/www/dew-gestionale/storage/food-images
/var/www/dew-gestionale/logs
```

Significato:

- `current/` = progetto
- `storage/food-images/` = immagini vere dei piatti
- `logs/` = log backend

## 4. Node e npm

Prima controllo se ci sono già:

```bash
node -v
npm -v
```

Se funzionano, bene.

Se non funzionano, vanno installati.

Documentazione: https://nodejs.org/en/download

Versione consigliata: LTS con nvm.

```bash
# installa nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# carica nvm
\. "$HOME/.nvm/nvm.sh"

# installa Node
nvm install 24

# controlla
node -v
npm -v
```

## 5. Nginx e PM2

### Nginx

Documentazione: https://nginx.org/en/linux_packages.html

### PM2

Documentazione: https://pm2.keymetrics.io/docs/usage/quick-start/

```bash
sudo npm install -g pm2
pm2 -v
```

## 6. Comandi Linux base

```bash
pwd        # cartella attuale
ls         # file nella cartella
cd nome    # entra in una cartella
cd ..      # torna sopra
mkdir dir  # crea cartella
cp -r a b  # copia
mv a b     # sposta o rinomina
rm file    # elimina file
cat file   # mostra contenuto file
```

I path assoluti partono da `/`.

## 7. Frontend

Dalla root del progetto:

```bash
npm install
npm run build
```

Questo crea `dist/`.

`dist/` è il frontend pronto.

## 8. Backend

Dentro `backend/`:

```bash
cd backend
npm install
npm run start
```

Il backend gira su una porta, per esempio `3001`.

## 9. Variabili frontend

Le API usano già path tipo:

- `/api/auth/...`
- `/api/reports/...`
- `/api/dishes/...`

Quindi in produzione `VITE_API_BASE_URL` può anche restare vuoto, se Nginx gira già `/api` al backend.

`VITE_API_PROXY_TARGET` serve solo in sviluppo.

## 10. Variabili backend

Quelle importanti sono:

- `NODE_ENV=production`
- `PORT=3001`
- dati veri del database MySQL
- `CORS_ORIGIN` con il dominio del frontend
- `TRUST_PROXY=true` se davanti c'è Nginx
- `JWT_SECRET` lungo e casuale
- `COOKIE_SECURE=true` se uso HTTPS
- `FOOD_IMAGES_DIR` con la cartella vera delle immagini
- `LOG_DIR` con la cartella vera dei log

## 11. Immagini

Qui basta ricordare una cosa.

Nel database non c'è il file immagine.
C'è solo il riferimento in `image_url`.

Il file vero sta sul disco.

### Path fisico

Cartella vera sulla VM.

Esempio:

```text
/var/www/dew-gestionale/storage/food-images
```

### Path pubblico

URL che usa il browser.

Esempio:

```text
/food-images/nome-file.jpg
```

Quindi `storage` è una cartella vera.
`/food-images` è solo il percorso pubblico.

## 12. Scheduler

Parte davvero solo se c'è:

```env
ENABLE_SCHEDULERS=true
```

PM2 non decide se parte o no.

PM2 tiene solo vivo il backend.

La variabile giusta è `ENABLE_SCHEDULERS`.

Nel progetto c'è anche un lock MySQL per evitare doppie esecuzioni.

## 13. PM2 base

Avvio backend con PM2:

```bash
cd /var/www/dew-gestionale/current/backend
pm2 start server.js --name dew-backend
pm2 save
pm2 startup
```

Comandi utili:

```bash
pm2 list
pm2 logs dew-backend
pm2 restart dew-backend
pm2 stop dew-backend
```

## 14. Cosa deve fare Nginx

Nginx deve:

- servire `dist/`
- girare `/api/` al backend su `127.0.0.1:3001`
- girare `/food-images/` al backend
- girare `/health` al backend
- fare fallback su `index.html` per React Router

## 15. Ordine pratico

Ordine facile:

1. entrare nella VM
2. controllare o installare Node e npm
3. installare Nginx
4. installare PM2
5. copiare lo zip del progetto
6. scompattarlo
7. creare `.env` e `backend/.env`
8. fare `npm install` nella root
9. fare `npm run build`
10. entrare in `backend/` e fare `npm install`
11. avviare il backend con PM2
12. configurare Nginx
13. testare login, API, immagini e healthcheck

## 16. Healthcheck

Endpoint:

```text
GET /health
```

Serve solo per vedere al volo se il backend risponde.

## 17. Fine

Schema mentale da ricordare:

- frontend buildato in `dist/`
- backend acceso con PM2
- Nginx davanti a tutto
- immagini su disco
- `/api` e resto girati al backend
