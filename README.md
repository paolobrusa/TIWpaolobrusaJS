# Aste online — Single Page Application (JavaScript)

Politecnico di Milano · Tecnologie Informatiche per il Web · **Voto: 27/30**

Stessa piattaforma di aste di [TIWpaolobrusa](https://github.com/paolobrusa/TIWpaolobrusa), riscritta come **single-page application**: dopo il login la pagina non viene mai ricaricata e il client JavaScript dialoga con le servlet tramite chiamate asincrone `fetch` che restituiscono JSON.

## Differenze rispetto alla versione JSP

- **Una sola pagina HTML** (`Home.html`) gestita da `spa.js`: le viste (vendo, acquisto, dettaglio asta, offerte, aggiudicazioni) vengono mostrate e nascoste lato client.
- **API JSON**: le servlet rispondono con JSON (Gson) invece di generare pagine JSP.
- **Stato lato client**: con `localStorage` l'app ricorda, per ogni utente, l'ultima azione compiuta e le ultime 20 aste visitate (i dati scadono dopo 30 giorni). Il server espone l'endpoint `AsteVisitate` per ricaricarle.
- Stesse regole di business e stesso filtro di login lato server.

## Funzionalità

- Creazione di articoli (con immagine) e di aste; chiusura delle aste dopo la scadenza
- Ricerca per parola chiave tra le aste attive, dettaglio e offerte
- Offerte validate lato server rispetto all'offerta più alta e al rialzo minimo
- Elenco delle aste aggiudicate
- Funziona anche quando `localStorage` non è disponibile

## Architettura

```
webapp/index.html, login.js     pagina di login
webapp/Home.html, spa.js        la SPA (moduli: storage, API, rendering)
controllers/                    servlet che restituiscono JSON
dao/                            accesso ai dati con JDBC (prepared statement)
beans/                          Utente, Articolo, Asta, Offerta, State
```

## Tecnologie

Java · Jakarta Servlet 6 · JDBC · MariaDB · Gson · JavaScript vanilla (fetch, async/await, localStorage) · Maven · Tomcat 10+

## Come avviarlo

1. Crea un database MariaDB chiamato `tiw` con lo stesso schema della versione JSP.
2. Imposta `user`, `pwd` e `urlDb` in `src/main/webapp/WEB-INF/web.xml`.
3. Compila e fai il deploy su Tomcat 10+:

```bash
./mvnw clean package
```
