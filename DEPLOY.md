# Deploy Linux semplice per DEW Gestionale RSA

Questa guida mi serve per avere chiaro come fare il deploy del progetto su una VM Linux.
Serve a ricordarmi cosa serve davvero, cosa devo configurare e in che ordine muovermi.

## 1. Idea generale

Il progetto ha due parti:

- frontend React/Vite
- backend Node.js/Express

In produzione il funzionamento, in pratica, è questo:

1. il frontend viene buildato e diventa una cartella di file statici (`dist/`)
2. il backend continua a girare come processo separato, ad esempio sulla porta `3001`
3. Nginx sta davanti all'applicazione e:
    - serve il frontend buildato
    - inoltra `/api`, `/food-images` e `/health` al backend
4. PM2 serve per tenere acceso il backend anche se il processo si ferma o se la VM viene riavviata

Quindi il browser dell'utente non parla direttamente con Node sulla porta `3001`, ma passa prima da Nginx.

## 2. Cosa serve sulla VM

Sulla macchina Linux servono almeno queste cose:

- Node.js
- npm
- Nginx
- PM2
- MySQL già presente oppure comunque raggiungibile dalla VM

### Node.js e npm

Node.js serve per eseguire il backend.
npm serve per installare le dipendenze del progetto.

Su Linux si usa la shell.

### Nginx

Nginx è il web server che pubblica il sito.
Nel mio caso serve sia per mostrare il frontend buildato sia per fare da reverse proxy verso il backend.

### PM2

PM2 è quello che tiene in vita il backend Node.
Se il processo si blocca, PM2 può riavviarlo.
Serve anche per farlo ripartire dopo un reboot della macchina.

## 3. Dove mettere il progetto

Una struttura sensata sulla VM può essere questa:

```text
/var/www/dew-gestionale/current
/var/www/dew-gestionale/storage/food-images
/var/www/dew-gestionale/logs
```

Non è obbligatoria per forza, però è ordinata e ha senso.

- `current/` contiene il progetto
- `storage/food-images/` contiene i file immagine veri dei piatti
- `logs/` contiene i log del backend

## 4. Come installare Node.js e npm

Per questo progetto servono sia `node` che `npm`.

- `node` serve per eseguire il backend
- `npm` serve per installare le dipendenze e fare la build del frontend

Controllare se sono già installati:

```bash
node -v
npm -v
```

Se funzionano, allora Node.js e npm sono già presenti e si può andare avanti.

Se non funzionano, allora vanno installati sulla VM.

Documentazione: https://nodejs.org/en/download
Selezionare versione (LTS) for Linux using nvm with npm

```bash
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 24

# Verify the Node.js version:
node -v # Should print "v24.14.0".

# Verify npm version:
npm -v # Should print "11.9.0".
```

Finita l'installazione ricontrollare:

```bash
node -v
npm -v
```

Se i comandi funzionano, allora si può passare agli `npm install` del progetto.

## 5. Installazione base

### Installare Nginx

Documentazione: https://nginx.org/en/linux_packages.html

### Installare PM2

Documentazione: https://pm2.keymetrics.io/docs/usage/quick-start/

```bash
sudo npm install -g pm2
pm2 -v
```

## 6. Comandi Linux base utili

```bash
pwd        # mostra la cartella attuale
ls         # mostra i file della cartella attuale
cd nome    # entra in una cartella
cd ..      # torna alla cartella sopra
mkdir dir  # crea una cartella
cp -r a b  # copia file/cartelle
mv a b     # sposta o rinomina
rm file    # elimina un file
cat file   # stampa il contenuto di un file di testo
```

Su Linux i path assoluti partono da `/`.

## 7. Frontend: installazione e build

Dalla root del progetto:

```bash
npm install
npm run build
```

Dopo il build viene creata la cartella `dist/`.
Quella è la versione finale del frontend da pubblicare.

## 8. Backend: installazione e avvio

Dentro `backend/`:

```bash
cd backend
npm install
npm run start
```

Nel progetto il backend gira su una porta configurabile, ad esempio `3001`.

## 9. Variabili ambiente frontend

Nel frontend, le chiamate API usano già percorsi come:

- `/api/auth/...`
- `/api/reports/...`
- `/api/dishes/...`

Quindi in produzione `VITE_API_BASE_URL` può restare vuoto se frontend e backend stanno sotto lo stesso dominio e Nginx inoltra già `/api` al backend.

`VITE_API_PROXY_TARGET`, invece, serve solo in sviluppo con Vite dev server.
In produzione non viene usato dal browser finale.

## 10. Variabili ambiente backend

Le cose più importanti da configurare sono queste:

- `NODE_ENV=production`
- `PORT=3001`
- i parametri reali del database MySQL
- `CORS_ORIGIN` con il dominio vero del frontend
- `TRUST_PROXY=true` se davanti c'è Nginx
- `JWT_SECRET` con un valore lungo e casuale
- `COOKIE_SECURE=true` se il sito usa HTTPS
- `FOOD_IMAGES_DIR` con la cartella reale delle immagini
- `LOG_DIR` con la cartella reale dei log

## 11. Immagini: differenza tra path fisico e path pubblico

Questo è uno dei punti più importanti da ricordare.

Nel database non salvo il file immagine, ma il riferimento (`image_url`).
Il file vero sta su disco.

Quindi ci sono due cose diverse:

### Path fisico

È la cartella vera sulla VM dove si trova il file.
Per esempio:

```text
/var/www/dew-gestionale/storage/food-images
```

### Path pubblico

È il percorso URL con cui il browser chiede l'immagine.
Per esempio:

```text
/food-images/nome-file.jpg
```

Per questo nell'URL non compare `storage`.
`storage` è la cartella vera sul disco, mentre `/food-images` è solo il percorso pubblico esposto dal backend.

## 12. Scheduler

Nel backend lo scheduler viene inizializzato dal codice, ma i job partono davvero solo se:

```env
ENABLE_SCHEDULERS=true
```

Quindi PM2 non decide da solo se il job parte oppure no.
PM2 tiene vivo il backend, mentre il flag che controlla davvero lo scheduler è `ENABLE_SCHEDULERS`.

Nel progetto c'è anche un lock MySQL per evitare doppie esecuzioni concorrenti.
Quindi, se sulla VM gira una sola istanza backend e voglio che il job automatico funzioni, la scelta consigliata è `true`.

## 13. PM2: uso base

Per avviare il backend con PM2:

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

## 14. Nginx: cosa deve fare

Nginx deve:

- servire `dist/`
- inoltrare `/api/` al backend su `127.0.0.1:3001`
- inoltrare `/food-images/` al backend
- inoltrare `/health` al backend
- fare fallback su `index.html` per React Router

## 15. Ordine pratico delle operazioni

Step da seguire:

1. entrare nella VM
2. installare/verificare Node e npm
3. installare Nginx
4. installare PM2
5. copiare lo zip del progetto sulla VM
6. scompattarlo nella cartella scelta
7. creare `.env` e `backend/.env`
8. fare `npm install` nella root
9. fare `npm run build`
10. fare `cd backend && npm install`
11. avviare il backend con PM2
12. configurare Nginx
13. testare login, API, immagini e healthcheck

## 16. Healthcheck

Il backend espone:

```text
GET /health
```

Utile per controllare velocemente se il server risponde.

## 17. Riassunto finale

L'idea è tenere tutto il più semplice possibile e questa guida mi serve a quello.
