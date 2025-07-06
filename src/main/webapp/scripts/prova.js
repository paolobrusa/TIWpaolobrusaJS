// Gestione dello storage lato client per l'applicazione aste
class ClientStorageManager {
    constructor() {
        this.STORAGE_KEY = 'aste_app_data';
        this.EXPIRY_DAYS = 30; // Un mese
    }

    // Inizializza i dati se non esistono
    initializeStorage() {
        const data = this.getData();
        if (!data) {
            this.setData({
                lastAction: null,
                visitedAuctions: [],
                timestamp: new Date().getTime()
            });
        }
    }

    // Recupera i dati dal localStorage
    getData() {
        try {
            const item = localStorage.getItem(this.STORAGE_KEY);
            if (!item) return null;

            const data = JSON.parse(item);

            // Controlla se i dati sono scaduti (più di 30 giorni)
            if (this.isExpired(data.timestamp)) {
                this.clearData();
                return null;
            }

            return data;
        } catch (error) {
            console.error('Errore nel recupero dati:', error);
            return null;
        }
    }

    // Salva i dati nel localStorage
    setData(data) {
        try {
            data.timestamp = new Date().getTime();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Errore nel salvataggio dati:', error);
        }
    }

    // Controlla se i dati sono scaduti
    isExpired(timestamp) {
        const now = new Date().getTime();
        const thirtyDaysInMs = this.EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        return (now - timestamp) > thirtyDaysInMs;
    }

    // Pulisce i dati scaduti
    clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    // Salva l'ultima azione dell'utente
    setLastAction(action) {
        const data = this.getData() || {
            lastAction: null,
            visitedAuctions: [],
            timestamp: new Date().getTime()
        };

        data.lastAction = action;
        this.setData(data);
    }

    // Recupera l'ultima azione
    getLastAction() {
        const data = this.getData();
        return data ? data.lastAction : null;
    }

    // Aggiunge un'asta alla lista delle aste visitate
    addVisitedAuction(auctionId) {
        const data = this.getData() || {
            lastAction: null,
            visitedAuctions: [],
            timestamp: new Date().getTime()
        };

        // Evita duplicati
        if (!data.visitedAuctions.includes(auctionId)) {
            data.visitedAuctions.push(auctionId);
            this.setData(data);
        }
    }

    // Recupera le aste visitate
    getVisitedAuctions() {
        const data = this.getData();
        return data ? data.visitedAuctions : [];
    }

    // Rimuove un'asta dalla lista (se è stata chiusa)
    removeVisitedAuction(auctionId) {
        const data = this.getData();
        if (data) {
            data.visitedAuctions = data.visitedAuctions.filter(id => id !== auctionId);
            this.setData(data);
        }
    }

    // Controlla se è la prima volta che l'utente accede
    isFirstTime() {
        return this.getData() === null;
    }
}

// Utilizzo dell'applicazione
class AsteApp {
    constructor() {
        this.storage = new ClientStorageManager();
        this.storage.initializeStorage();
    }

    // Determina quale pagina mostrare all'avvio
    getInitialPage() {
        if (this.storage.isFirstTime()) {
            return 'ACQUISTO';
        }

        const lastAction = this.storage.getLastAction();
        if (lastAction === 'CREATE_AUCTION') {
            return 'VENDO';
        }

        return 'ACQUISTO';
    }

    // Quando l'utente crea un'asta
    onCreateAuction(auctionData) {
        // Salva l'azione
        this.storage.setLastAction('CREATE_AUCTION');

        // Qui faresti la chiamata API per creare l'asta
        // fetch('/api/auctions', { method: 'POST', ... })

        this.showPage('VENDO');
    }

    // Quando l'utente clicca su un'asta
    onAuctionClick(auctionId) {
        // Salva l'asta come visitata
        this.storage.addVisitedAuction(auctionId);

        // Aggiorna l'ultima azione
        this.storage.setLastAction('VIEW_AUCTION');

        // Mostra i dettagli dell'asta
        this.showAuctionDetails(auctionId);
    }

    // Carica le aste visitate ancora aperte
    async loadVisitedOpenAuctions() {
        const visitedIds = this.storage.getVisitedAuctions();

        if (visitedIds.length === 0) {
            return [];
        }

        try {
            // Chiamata API per verificare quali aste sono ancora aperte
            const response = await fetch('/api/auctions/check-open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auctionIds: visitedIds })
            });

            const openAuctions = await response.json();

            // Rimuovi le aste chiuse dallo storage
            const closedAuctions = visitedIds.filter(id =>
                !openAuctions.some(auction => auction.id === id)
            );

            closedAuctions.forEach(id => {
                this.storage.removeVisitedAuction(id);
            });

            return openAuctions;
        } catch (error) {
            console.error('Errore nel caricamento aste:', error);
            return [];
        }
    }

    // Mostra la pagina appropriata
    async showPage(page) {
        if (page === 'ACQUISTO') {
            const visitedAuctions = await this.loadVisitedOpenAuctions();
            this.renderAcquistoPage(visitedAuctions);
        } else if (page === 'VENDO') {
            this.renderVendoPage();
        }
    }

    // Inizializza l'applicazione
    async init() {
        const initialPage = this.getInitialPage();
        await this.showPage(initialPage);
    }

    // Metodi di rendering (da implementare secondo il tuo UI)
    renderAcquistoPage(visitedAuctions) {
        console.log('Rendering pagina ACQUISTO con aste visitate:', visitedAuctions);
        // Implementa il rendering della pagina
    }

    renderVendoPage() {
        console.log('Rendering pagina VENDO');
        // Implementa il rendering della pagina
    }

    showAuctionDetails(auctionId) {
        console.log('Mostra dettagli asta:', auctionId);
        // Implementa la visualizzazione dei dettagli
    }
}

// Inizializzazione dell'app
document.addEventListener('DOMContentLoaded', () => {
    const app = new AsteApp();
    app.init();
});

// Esempio di utilizzo
/*
const app = new AsteApp();

// Simula la creazione di un'asta
app.onCreateAuction({ title: 'Asta esempio', startPrice: 100 });

// Simula il click su un'asta
app.onAuctionClick('auction123');
*/