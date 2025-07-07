(function () {
    // Configurazione endpoints
    const API_ENDPOINTS = {
        acquisto: 'Acquisto',
        vendo: 'Vendo',
        createArticolo: 'AddArticolo',
        createAsta: 'CreateAsta'
    };

    let appState = {
        currentView: 'acquisto',
        lastAction: null,
        searchResults: [],
        loading: false
    };

    // Utility functions
    function formatCurrency(amount) {
        return new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'}).format(amount);
    }

    function formatDate(date) {
        const dateObj = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('it-IT').format(num);
    }

    // Loading state management
    function setLoading(isLoading) {
        appState.loading = isLoading;
        const loadingElements = document.querySelectorAll('.loading-spinner');
        loadingElements.forEach(el => {
            el.style.display = isLoading ? 'block' : 'none';
        });
    }

    // API calls - Gestione delle risposte JSON del server
    async function fetchData(endpoint, options = {}) {
        try {
            setLoading(true);
            const response = await fetch(endpoint, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...options.headers
                },
                body: options.body
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Gestione degli errori dal server
            if (data.success === false) {
                throw new Error(data.message || 'Errore dal server');
            }

            return data;
        } catch (error) {
            console.error('Errore nella chiamata API:', error);
            showMessage(error.message || 'Errore di connessione al server', 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Navigation functions
    function goToAcquisto() {
        appState.currentView = 'acquisto';
        document.getElementById('vendo-view').style.display = 'none';
        document.getElementById('acquisto-view').style.display = 'block';
        loadAcquistoData();
    }

    function goToVendo() {
        appState.currentView = 'vendo';
        document.getElementById('acquisto-view').style.display = 'none';
        document.getElementById('vendo-view').style.display = 'block';
        loadVendoData()
    }

    // ACQUISTO functions
    async function searchAuctions(event) {
        event.preventDefault();
        const keyword = document.getElementById('search-input').value.trim();

        if (!keyword) {
            showMessage('Inserisci una parola chiave per la ricerca', 'error');
            return;
        }

        try {
            // Chiamata GET al servlet Acquisto con parametro search
            const url = `${API_ENDPOINTS.acquisto}?search=${encodeURIComponent(keyword)}`;
            const data = await fetchData(url);

            // Il server restituisce sempre un oggetto con success, aste e message opzionale
            const aste = data.aste || [];
            appState.searchResults = aste;

            if (data.message) {
                showMessage(data.message, 'info');
            }

            renderAsteRicercate(aste);
        } catch (error) {
            renderAsteRicercate([]);
        }
    }

    function renderAsteRicercate(aste) {
        const container = document.getElementById('aste-content');
        const countElement = document.getElementById('aste-count');

        countElement.textContent = `${aste.length} aste`;

        if (aste.length === 0) {
            container.innerHTML = `
                <div class="no-aste-message">
                    <h2>Nessuna asta trovata</h2>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="aste-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Prezzo Iniziale</th>
                        <th>Offerta Minima</th>
                        <th>Tempo Rimanente</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${aste.map(asta => `
                        <tr class="asta-row">
                            <td class="asta-id">#${asta.id}</td>
                            <td class="price">${formatCurrency(asta.initialPrice)}</td>
                            <td class="min-bid">${formatCurrency(asta.minBid)}</td>
                            <td class="date">${asta.timeLeft || 'N/A'}</td>
                            <td class="actions">
                                <a href="/Offerta?idasta=${asta.id}" class="btn-dettaglio btn-active">
                                    Dettagli
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    async function loadAggiudicazioni() {
        try {
            // Chiamata GET al servlet Acquisto senza parametri per ottenere le aggiudicazioni
            const data = await fetchData(API_ENDPOINTS.acquisto);

            // Il server restituisce sempre un oggetto con success e aggiudicazioni
            const aggiudicazioni = data.aggiudicazioni || [];
            renderAggiudicazioni(aggiudicazioni);
        } catch (error) {
            renderAggiudicazioni([]);
        }
    }

    function renderAggiudicazioni(aggiudicazioni = []) {
        const container = document.getElementById('aggiud-content');
        const countElement = document.getElementById('aggiud-count');

        countElement.textContent = `${aggiudicazioni.length} aggiudicazioni`;

        if (aggiudicazioni.length === 0) {
            container.innerHTML = `
                <div class="no-aste-message">
                    <h3>Nessuna aggiudicazione</h3>
                    <p>Non ci sono ancora aggiudicazioni nel sistema</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="aste-table">
                <thead>
                    <tr>
                        <th>ID Asta</th>
                        <th>Offerta</th>
                        <th>Data</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${aggiudicazioni.map(agg => `
                        <tr class="asta-row">
                            <td class="asta-id">#${agg.idAsta}</td>
                            <td class="bid-amount">${formatCurrency(agg.bid)}</td>
                            <td class="date">${formatDate(agg.date)}</td>
                            <td class="actions">
                                <a href="/Offerta?idasta=${agg.idAsta}">
                                    <span class="status-badge status-won">Dettagli</span>
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    async function loadAcquistoData() {
        // Carica le aggiudicazioni
        await loadAggiudicazioni();

        // Se non ci sono risultati di ricerca, mostra un messaggio
        if (appState.searchResults.length === 0) {
            const container = document.getElementById('aste-content');
            const countElement = document.getElementById('aste-count');

            countElement.textContent = '0 aste';
            container.innerHTML = `
                <div class="no-aste-message">
                    <h2>Cerca articoli per visualizzare aste corrispondenti</h2>
                </div>
            `;
        }
    }

    // VENDO functions
    async function loadVendoData() {
        try {
            // Chiamata GET al servlet Vendo per ottenere aste e articoli
            const data = await fetchData(API_ENDPOINTS.vendo);

            // Il server restituisce sempre un oggetto con success, aste e articoli
            const aste = data.aste || [];
            const articoli = data.articoli || [];

            // Separa le aste per stato
            const asteAperte = aste.filter(asta => asta.state === 'attiva');
            const asteChiuse = aste.filter(asta => asta.state === 'chiusa');

            // Renderizza tutto
            renderAsteAperte(asteAperte);
            renderAsteChiuse(asteChiuse);
            renderArticoli(articoli);
        } catch (error) {
            // In caso di errore, renderizza tutto vuoto
            renderAsteAperte([]);
            renderAsteChiuse([]);
            renderArticoli([]);
        }
    }

    function renderAsteAperte(asteAperte) {
        const container = document.getElementById('aste-aperte-content');
        const countElement = document.getElementById('aste-aperte-count');

        countElement.textContent = `${asteAperte.length} aste`;

        if (asteAperte.length === 0) {
            container.innerHTML = `
                <div class="no-aste-message">
                    <div class="no-aste-icon">🟢</div>
                    <h3>Nessuna asta aperta</h3>
                    <p>Non hai aste attualmente attive</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="aste-table">
                <thead>
                    <tr>
                        <th>ID Asta</th>
                        <th>Prezzo Iniziale</th>
                        <th>Offerta Minima</th>
                        <th>Tempo rimanente</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${asteAperte.map(asta => `
                        <tr class="asta-row active-row">
                            <td class="asta-id">#${asta.id}</td>
                            <td class="price">${formatCurrency(asta.initialPrice)}</td>
                            <td class="min-bid">${formatCurrency(asta.minBid)}</td>
                            <td class="date">${asta.timeLeft || 'N/A'}</td>
                            <td class="actions">
                                <a href="/Dettaglio?idasta=${asta.id}" class="btn-dettaglio btn-active">
                                    Gestisci
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    function renderAsteChiuse(asteChiuse) {
        const container = document.getElementById('aste-chiuse-content');
        const countElement = document.getElementById('aste-chiuse-count');

        countElement.textContent = `${asteChiuse.length} aste`;

        if (asteChiuse.length === 0) {
            container.innerHTML = `
                <div class="no-aste-message">
                    <div class="no-aste-icon">🔴</div>
                    <h3>Nessuna asta chiusa</h3>
                    <p>Non hai ancora aste terminate</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="aste-table">
                <thead>
                    <tr>
                        <th>ID Asta</th>
                        <th>Prezzo Iniziale</th>
                        <th>Offerta Minima</th>
                        <th>Data Asta</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${asteChiuse.map(asta => `
                        <tr class="asta-row closed-row">
                            <td class="asta-id">#${asta.id}</td>
                            <td class="price">${formatCurrency(asta.initialPrice)}</td>
                            <td class="min-bid">${formatCurrency(asta.minBid)}</td>
                            <td class="date">${formatDate(asta.date)}</td>
                            <td class="actions">
                                <a href="/Dettaglio?idasta=${asta.id}" class="btn-dettaglio btn-closed">
                                    Risultati
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    function renderArticoli(articoli) {
        const container = document.getElementById('articoli-container');
        const button = document.getElementById('create-auction-btn');

        if (articoli.length === 0) {
            container.innerHTML = `
                <div class="no-articles-message">
                    <p>Nessun articolo disponibile. Crea prima un articolo.</p>
                </div>
            `;
            if (button) button.disabled = true;
            return;
        }

        const articoliHTML = articoli.map(articolo => `
            <div class="checkbox-item">
                <input type="checkbox" id="articolo_${articolo.code}" name="codice" value="${articolo.code}" class="checkbox-input">
                <label for="articolo_${articolo.code}" class="checkbox-label">
                    <span class="checkbox-name">${articolo.name}</span>
                    <span class="checkbox-price">€${formatNumber(articolo.price)}</span>
                </label>
            </div>
        `).join('');

        container.innerHTML = articoliHTML;
        if (button) button.disabled = false;
    }

    // Form handling functions (non modificate come richiesto)
    async function createArticle(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const urlEncodedData = new URLSearchParams();

        for (let [key, value] of formData.entries()) {
            urlEncodedData.append(key, value);
        }

        try {
            const response = await fetchData(API_ENDPOINTS.createArticolo, {
                method: 'POST',
                body: urlEncodedData
            });

            // Ricarica i dati della sezione vendo
            await loadVendoData();
            event.target.reset();

            // Mostra messaggio di successo o errore basato sulla risposta
            if (response && response.success === false) {
                showMessage(response.message || 'Errore nella creazione dell\'articolo', 'error');
            } else {
                showMessage('Articolo creato con successo!', 'success');
            }
        } catch (error) {
            showMessage('Errore nella creazione dell\'articolo', 'error');
        }
    }

    async function createAuction(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const selectedArticles = Array.from(document.querySelectorAll('input[name="codice"]:checked'));

        if (selectedArticles.length === 0) {
            showMessage('Seleziona almeno un articolo', 'error');
            return;
        }

        const urlEncodedData = new URLSearchParams();
        for (let [key, value] of formData.entries()) {
            urlEncodedData.append(key, value);
        }

        // Aggiungi gli articoli selezionati
        selectedArticles.forEach(input => {
            urlEncodedData.append('codice', input.value);
        });

        try {
            const response = await fetchData(API_ENDPOINTS.createAsta, {
                method: 'POST',
                body: urlEncodedData
            });

            appState.lastAction = 'createAuction';

            // Ricarica i dati della sezione vendo
            await loadVendoData();
            event.target.reset();

            // Deseleziona tutti i checkbox
            selectedArticles.forEach(input => input.checked = false);

            // Mostra messaggio di successo o errore basato sulla risposta
            if (response && response.success === false) {
                showMessage(response.message || 'Errore nella creazione dell\'asta', 'error');
            } else {
                showMessage('Asta creata con successo!', 'success');
            }
        } catch (error) {
            showMessage('Errore nella creazione dell\'asta', 'error');
        }
    }

    function showMessage(message, type) {
        const errorDiv = document.getElementById(
            appState.currentView === 'acquisto' ? 'error-message' : 'vendo-error-message'
        );

        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.className = type === 'error' ? 'error-message' : 'success-message';
            errorDiv.style.display = 'block';

            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    function initApp() {
        // Aggiungi event listeners per la ricerca
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', searchAuctions);
        }

        // Event listeners per la creazione di articoli
        const createArticleForm = document.getElementById('create-article-form');
        if (createArticleForm) {
            createArticleForm.addEventListener('submit', createArticle);
        }

        // Event listeners per la creazione di aste
        const createAuctionForm = document.getElementById('create-auction-form');
        if (createAuctionForm) {
            createAuctionForm.addEventListener('submit', createAuction);
        }

        // Bottoni di navigazione
        const gotoVendoBtn = document.getElementById('goto-vendo-btn');
        const gotoAcquistoBtn = document.getElementById('goto-acquisto-btn');

        if (gotoVendoBtn) {
            gotoVendoBtn.addEventListener('click', goToVendo);
        }

        if (gotoAcquistoBtn) {
            gotoAcquistoBtn.addEventListener('click', goToAcquisto);
        }
        goToAcquisto();
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();