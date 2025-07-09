//(function () {
// ===== GESTIONE DATI PERSISTENTI (localStorage simulato con cookies) =====
    const PersistentStorage = {
        setCookie(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/`;
        },

        getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    try {
                        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
                    } catch (e) {
                        return null;
                    }
                }
            }
            return null;
        },

        removeCookie(name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        }
    };

// ===== GESTIONE DATI UTENTE =====
    const UserDataManager = {
        STORAGE_KEY: 'auction_user_data',
        EXPIRY_DAYS: 30,

        getUserData() {
            const data = PersistentStorage.getCookie(this.STORAGE_KEY);
            if (!data) {
                return this.createNewUserData();
            }

            // Controlla se i dati sono scaduti
            if (Date.now() > data.expiryDate) {
                PersistentStorage.removeCookie(this.STORAGE_KEY);
                return this.createNewUserData();
            }

            return data;
        },

        createNewUserData() {
            const userData = {
                isFirstTime: true,
                lastAction: null,
                lastActionDate: null,
                visitedAuctions: [],
                expiryDate: Date.now() + (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000)
            };
            this.saveUserData(userData);
            return userData;
        },

        saveUserData(userData) {
            userData.expiryDate = Date.now() + (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000);
            PersistentStorage.setCookie(this.STORAGE_KEY, userData, this.EXPIRY_DAYS);
        },

        setLastAction(action) {
            const userData = this.getUserData();
            userData.lastAction = action;
            userData.lastActionDate = Date.now();
            userData.isFirstTime = false;
            this.saveUserData(userData);
        },

        addVisitedAuction(auctionId) {
            const userData = this.getUserData();
            if (!userData.visitedAuctions.includes(auctionId)) {
                userData.visitedAuctions.push(auctionId);
                if (userData.visitedAuctions.length > 20) {
                    userData.visitedAuctions.shift();
                }
                this.saveUserData(userData);
            }
            this.setLastAction('auction_viewed');
        }
    };

// ===== GESTIONE AJAX =====
    const ApiManager = {
        async request(endpoint, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            const finalOptions = {...defaultOptions, ...options};

            try {
                const response = await fetch(endpoint, finalOptions);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return {success: false, message: text};
                }
            } catch (error) {
                console.error('API Error:', error);
                app.showMessage('Errore di connessione al server', 'error');
                throw error;
            }
        },

        async get(endpoint) {
            return this.request(endpoint);
        },

        async post(endpoint, data) {
            const formData = new URLSearchParams();
            for (const [key, value] of Object.entries(data)) {
                if (Array.isArray(value)) {
                    value.forEach(v => formData.append(key, v));
                } else {
                    formData.append(key, value);
                }
            }

            return this.request(endpoint, {
                method: 'POST',
                body: formData
            });
        }
    };

// ===== APPLICAZIONE PRINCIPALE =====
    const app = {
        currentSection: null,

        showMessage(message, type = 'info') {
            const container = document.getElementById('message-container');
            const messageDiv = document.createElement('div');
            messageDiv.className = `error-message ${type === 'success' ? 'success' : ''}`;
            messageDiv.textContent = message;

            container.innerHTML = '';
            container.appendChild(messageDiv);

            setTimeout(() => {
                if (container.contains(messageDiv)) {
                    container.removeChild(messageDiv);
                }
            }, 5000);
        },

        updateNavigation(activeSection) {
            document.getElementById('nav-acquisto').classList.remove('active');
            document.getElementById('nav-vendo').classList.remove('active');

            if (activeSection === 'acquisto') {
                document.getElementById('nav-acquisto').classList.add('active');
                document.getElementById('page-subtitle').textContent = 'Cerca e partecipa alle aste';
            } else if (activeSection === 'vendo') {
                document.getElementById('nav-vendo').classList.add('active');
                document.getElementById('page-subtitle').textContent = 'Gestisci le tue aste';
            }
        },

        async showSection(section) {
            this.currentSection = section;
            this.updateNavigation(section);

            try {
                if (section === 'acquisto') {
                    await this.loadAcquistoSection();
                } else if (section === 'vendo') {
                    await this.loadVendoSection();
                }
            } catch (error) {
                console.error('Error loading section:', error);
            }
        },

        async loadAcquistoSection() {
            const userData = UserDataManager.getUserData();

            document.getElementById('content').innerHTML = `
            <div class="search-section">
                <form class="search-form" onsubmit="app.searchAuctions(event)">
                    <div class="search-container">
                        <input type="text" id="search-keyword" placeholder="Cerca nelle aste..." class="search-input">
                        <button type="submit" class="search-button">Cerca</button>
                    </div>
                </form>
            </div>

            <div class="tables-container">
                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title auction-title" id="aste-title">
                            ${!userData.isFirstTime && userData.visitedAuctions.length > 0 ?
                'Aste Visitate di Recente' : 'Aste Disponibili'}
                        </h2>
                        <span class="section-count" id="auctions-count">0 aste</span>
                    </div>
                    <div id="auctions-list">
                        ${!userData.isFirstTime && userData.visitedAuctions.length > 0 ?
                '<div class="loading">Caricamento aste visitate...</div>' :
                '<div class="no-aste-message"><h3>Cerca articoli per visualizzare le aste</h3></div>'}
                    </div>
                </div>

                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title closed-title">Aggiudicazioni</h2>
                        <span class="section-count" id="awards-count">0 aggiudicazioni</span>
                    </div>
                    <div id="awards-list">
                        <div class="loading">Caricamento...</div>
                    </div>
                </div>
            </div>
        `;

            // Carica aste visitate se non è la prima volta
            if (!userData.isFirstTime && userData.visitedAuctions.length > 0) {
                await this.loadVisitedAuctions(userData.visitedAuctions);
            }

            // Carica aggiudicazioni
            await this.loadAwards();
        },

        async loadVendoSection() {
            document.getElementById('content').innerHTML = `
            <div class="tables-container">
                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title active-title">🟢 Aste Aperte</h2>
                        <span class="section-count" id="open-auctions-count">0 aste</span>
                    </div>
                    <div id="open-auctions-list">
                        <div class="loading">Caricamento...</div>
                    </div>
                </div>

                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title closed-title">🔴 Aste Chiuse</h2>
                        <span class="section-count" id="closed-auctions-count">0 aste</span>
                    </div>
                    <div id="closed-auctions-list">
                        <div class="loading">Caricamento...</div>
                    </div>
                </div>
            </div>

            <div class="forms-container">
                <div class="form-container">
                    <div class="form-header">
                        <h2 class="form-title article-title">Crea Articolo</h2>
                        <p class="form-subtitle">Aggiungi un nuovo articolo</p>
                    </div>
                    <form onsubmit="app.createArticle(event)" class="form-content">
                        <div class="input-group">
                            <label for="article-name" class="input-label">Nome Articolo</label>
                            <input type="text" id="article-name" name="nome" class="form-input" required placeholder="Nome articolo">
                        </div>
                        <div class="input-group">
                            <label for="article-description" class="input-label">Descrizione</label>
                            <textarea id="article-description" name="descrizione" class="form-textarea" required placeholder="Descrizione" rows="3"></textarea>
                        </div>
                        <div class="input-group">
                            <label for="article-path" class="input-label">Path Immagine</label>
                            <input type="text" id="article-path" name="path" class="form-input" placeholder="URL o percorso dell'immagine">
                        </div>
                        <div class="input-group">
                            <label for="article-price" class="input-label">Prezzo Base (€)</label>
                            <input type="number" id="article-price" name="prezzo" class="form-input" step="1" min="1" required placeholder="0">
                        </div>
                        <button type="submit" class="btn-submit">Crea Articolo</button>
                    </form>
                </div>

                <div class="form-container">
                    <div class="form-header">
                        <h2 class="form-title auction-title">Crea Asta</h2>
                        <p class="form-subtitle">Crea una nuova asta</p>
                    </div>
                    <form onsubmit="app.createAuction(event)" class="form-content">
                        <div class="input-group">
                            <label class="input-label">Seleziona Articoli</label>
                            <div class="checkbox-container" id="articles-checkbox">
                                <div class="loading">Caricamento articoli...</div>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="min-bid" class="input-label">Rilancio Minimo (€)</label>
                            <input type="number" id="min-bid" name="minBid" class="form-input" step="1" min="1" required placeholder="0">
                        </div>
                        <div class="input-group">
                            <label for="auction-date" class="input-label">Data Scadenza</label>
                            <input type="datetime-local" id="auction-date" name="date" class="form-input" required step="1">
                        </div>
                        <button type="submit" class="btn-submit" id="create-auction-btn">Crea Asta</button>
                    </form>
                </div>
            </div>
        `;

            await this.loadUserAuctions();
            await this.loadUserArticles();
        },

        // Mostra pagina dettaglio offerta (sostituisce tutto il contenuto)
        async showOffertaDetail(auctionId) {
            // Aggiungi l'asta alle visitate SOLO quando l'utente clicca per vedere i dettagli
            UserDataManager.addVisitedAuction(auctionId);

            try {
                const response = await ApiManager.get(`Offerta?idasta=${auctionId}`);

                if (!response.success) {
                    this.showMessage(response.message || 'Errore nel caricamento', 'error');
                    return;
                }

                document.getElementById('content').innerHTML = `
                <div class="aste-container">
                    <div class="aste-header">
                        <h2>Offerta - Asta #${auctionId}</h2>
                        <button class="btn-homepage" onclick="app.showSection('acquisto')">
                            ← Torna ad Acquisto
                        </button>
                    </div>

                    <div class="tables-container">
                        <div class="section-container">
                            <div class="section-header">
                                <h2 class="section-title article-title">Articoli Disponibili</h2>
                                <span class="section-count">${response.articoli ? response.articoli.length : 0} articoli</span>
                            </div>
                            ${this.renderArticoliTable(response.articoli)}
                        </div>

                        <div class="section-container">
                            <div class="section-header">
                                <h2 class="section-title auction-title">Offerte Ricevute</h2>
                                <span class="section-count">${response.offerta ? response.offerta.length : 0} offerte</span>
                            </div>
                            ${this.renderOfferteTable(response.offerta)}
                        </div>
                    </div>

                    <div class="forms-container">
                        <div class="form-container">
                            <div class="form-header">
                                <h2 class="form-title auction-title">Offerta</h2>
                                <p class="form-subtitle">Inserisci la tua offerta</p>
                            </div>
                            <form onsubmit="app.makeOffer(event, ${auctionId})" class="form-content">
                                <div class="input-group">
                                    <label for="offertaprezzo" class="input-label">Importo Offerta (€)</label>
                                    <input type="number" name="offertaprezzo" id="offertaprezzo" 
                                           class="form-input" placeholder="0" step="1" min="1" required>
                                </div>
                                <button type="submit" class="btn-submit">Invia Offerta</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            } catch (error) {
                console.error('Error loading offerta:', error);
            }
        },

        // Mostra pagina dettaglio asta (per sezione Vendo)
        async showDettaglioAsta(auctionId) {
            try {
                const response = await ApiManager.get(`Dettaglio?idasta=${auctionId}`);

                if (!response.success) {
                    this.showMessage(response.message || 'Errore nel caricamento', 'error');
                    return;
                }

                const asta = response.asta;

                document.getElementById('content').innerHTML = `
                <div class="aste-container">
                    <div class="aste-header">
                        <h2>Dettaglio Asta #${auctionId}</h2>
                        <button class="btn-homepage" onclick="app.showSection('vendo')">
                            ← Torna a Vendo
                        </button>
                    </div>

                    <div class="main-content">
                        <div class="asta-details-container">
                            <div class="asta-details-header">
                                <h2 class="asta-title">Asta #${asta.id}</h2>
                                <div class="asta-status">
                                    ${asta.state === 'attiva' ?
                    '<span class="status-badge status-active">🟢 Attiva</span>' :
                    '<span class="status-badge status-closed">🔴 Chiusa</span>'}
                                </div>
                            </div>

                            <div class="asta-info-grid">
                                <div class="info-card">
                                    <div class="info-label">ID Asta</div>
                                    <div class="info-value asta-id">#${asta.id}</div>
                                </div>
                                <div class="info-card">
                                    <div class="info-label">Prezzo Iniziale</div>
                                    <div class="info-value price">€${asta.initialPrice}</div>
                                </div>
                                <div class="info-card">
                                    <div class="info-label">Offerta Minima</div>
                                    <div class="info-value min-bid">€${asta.minBid}</div>
                                </div>
                                <div class="info-card">
                                    <div class="info-label">Data Asta</div>
                                    <div class="info-value date">${new Date(asta.date).toLocaleString('it-IT')}</div>
                                </div>
                            </div>

                            <div class="asta-articles">
                                <h3>Articoli dell'Asta</h3>
                                ${this.renderArticoliAstaTable(response.articoli)}
                            </div>

                            ${asta.state === 'attiva' ? `
                                <div class="asta-actions">
                                    <button onclick="app.closeAuction(${asta.id})" class="btn-close-auction">
                                        Chiudi Asta
                                    </button>
                                </div>
                            ` : ''}

                            ${asta.state === 'chiusa' && response.utente ? `
                                <div class="winner-section">
                                    <h3 class="winner-title">Asta Aggiudicata</h3>
                                    <div class="winner-card">
                                        <div class="winner-info">
                                            <h4>Aggiudicatario</h4>
                                            <p class="winner-name">${response.utente.name} ${response.utente.surname}</p>
                                            <p class="winner-address">${response.utente.address}</p>
                                        </div>
                                        <div class="winning-bid">
                                            <h4>Prezzo finale</h4>
                                            <p class="winning-amount">€${response.offertaVincente.bid}</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div class="offerte-container">
                            <div class="section-header">
                                <h3 class="section-title">Lista Offerte</h3>
                                <div class="section-count">
                                    ${response.offerte ? response.offerte.length + ' offerte ricevute' : 'Nessuna offerta'}
                                </div>
                            </div>
                            ${this.renderOfferteDettaglioTable(response.offerte, asta.state)}
                        </div>
                    </div>
                </div>
            `;
            } catch (error) {
                console.error('Error loading dettaglio:', error);
            }
        },

        // Funzioni di rendering tabelle
        renderArticoliTable(articoli) {
            if (!articoli || articoli.length === 0) {
                return `
                <div class="no-aste-message">
                    <div class="no-aste-icon">📦</div>
                    <h3>Nessun articolo disponibile</h3>
                </div>
            `;
            }

            return `
            <table class="aste-table">
                <thead>
                    <tr>
                        <th>Codice</th>
                        <th>Nome</th>
                        <th>Descrizione</th>
                        <th>Prezzo</th>
                    </tr>
                </thead>
                <tbody>
                    ${articoli.map(a => `
                        <tr class="asta-row">
                            <td class="asta-id">${a.code}</td>
                            <td class="article-name">${a.name}</td>
                            <td class="article-description">${a.description}</td>
                            <td class="price">€${a.price}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        },

        renderArticoliAstaTable(articoli) {
            if (!articoli || articoli.length === 0) {
                return '<div class="no-aste-message"><h4>Nessun articolo presente</h4></div>';
            }

            return `
            <div class="articles-table-container">
                <table class="articles-table">
                    <thead>
                        <tr>
                            <th>Codice</th>
                            <th>Nome</th>
                            <th>Prezzo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${articoli.map(a => `
                            <tr class="article-row">
                                <td class="asta-id">${a.code}</td>
                                <td class="article-name">${a.name}</td>
                                <td class="price">€${a.price}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        },

        renderOfferteTable(offerte) {
            if (!offerte || offerte.length === 0) {
                return `
                <div class="no-aste-message">
                    <div class="no-aste-icon">💰</div>
                    <h3>Nessuna offerta ricevuta</h3>
                </div>
            `;
            }

            return `
            <table class="aste-table">
                <thead>
                    <tr>
                        <th>Utente</th>
                        <th>Offerta</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    ${offerte.map(o => `
                        <tr class="asta-row">
                            <td class="user-name">${o.usnUser}</td>
                            <td class="min-bid">€${o.bid}</td>
                            <td class="date">${new Date(o.date).toLocaleString('it-IT')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        },

        renderOfferteDettaglioTable(offerte, astaState) {
            if (!offerte || offerte.length === 0) {
                return `
                <div class="no-aste-message">
                    <div class="no-aste-icon">💰</div>
                    <h3>Nessuna offerta ricevuta</h3>
                </div>
            `;
            }

            return `
            <div class="offerte-table-container">
                <table class="offerte-table">
                    <thead>
                        <tr>
                            <th>Utente</th>
                            <th>Offerta</th>
                            <th>Data</th>
                            <th>Stato</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${offerte.map((o, idx) => `
                            <tr class="offerta-row ${idx === 0 && astaState === 'chiusa' ? 'winning-row' : ''}">
                                <td class="user-name">${o.usnUser}</td>
                                <td class="min-bid">€${o.bid}</td>
                                <td class="date">${new Date(o.date).toLocaleString('it-IT')}</td>
                                <td class="offerta-status">
                                    ${idx === 0 && astaState === 'chiusa' ?
                '<span class="status-badge status-winner">Vincente</span>' :
                idx === 0 && astaState === 'attiva' ?
                    '<span class="status-badge status-leading">Migliore</span>' :
                    '<span class="status-badge status-normal">Valida</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        },

        // Altre funzioni
        async searchAuctions(event) {
            event.preventDefault();
            const keyword = document.getElementById('search-keyword').value.trim();

            if (!keyword) {
                this.showMessage('Inserisci una parola chiave per cercare', 'error');
                return;
            }

            try {
                // Cambia il titolo della sezione
                document.getElementById('aste-title').textContent = 'Risultati Ricerca';
                document.getElementById('auctions-list').innerHTML = '<div class="loading">Ricerca in corso...</div>';

                const response = await ApiManager.get(`Acquisto?keyWord=${encodeURIComponent(keyword)}`);

                if (response.success && response.aste) {
                    this.displayAuctions(response.aste);
                    if (response.error) {
                        this.showMessage(response.error, 'info');
                    }
                } else {
                    this.showMessage(response.error || 'Errore nella ricerca', 'error');
                    document.getElementById('auctions-list').innerHTML =
                        '<div class="no-aste-message"><h3>Nessuna asta trovata</h3></div>';
                }
            } catch (error) {
                console.error('Search error:', error);
                document.getElementById('auctions-list').innerHTML =
                    '<div class="no-aste-message"><h3>Errore durante la ricerca</h3></div>';
            }
        },

        async loadVisitedAuctions(auctionIds) {
            try {
                // Usa la nuova servlet per caricare tutte le aste visitate in una sola chiamata
                const response = await ApiManager.post('AsteVisitate', {'ids[]': auctionIds});

                if (response.success && response.aste && response.aste.length > 0) {
                    this.displayAuctions(response.aste);
                } else {
                    // Se non ci sono aste attive tra quelle visitate
                    document.getElementById('aste-title').textContent = 'Aste Disponibili';
                    document.getElementById('auctions-list').innerHTML =
                        '<div class="no-aste-message"><h3>Le aste visitate sono terminate. Cerca nuove aste!</h3></div>';
                }
            } catch (error) {
                console.error('Error loading visited auctions:', error);
                document.getElementById('auctions-list').innerHTML =
                    '<div class="no-aste-message"><h3>Cerca articoli per visualizzare le aste</h3></div>';
            }
        },

        async loadAwards() {
            try {
                const response = await ApiManager.get('Acquisto');

                if (response.success && response.aggiudicazioni) {
                    this.displayAwards(response.aggiudicazioni);
                }
            } catch (error) {
                console.error('Error loading awards:', error);
            }
        },

        async loadUserAuctions() {
            try {
                const response = await ApiManager.get('Vendo');

                if (response.success && response.aste) {
                    this.displayUserAuctions(response.aste);
                }
            } catch (error) {
                console.error('Error loading user auctions:', error);
            }
        },

        async loadUserArticles() {
            try {
                const response = await ApiManager.get('Vendo');

                if (response.success && response.articoli) {
                    this.displayArticlesForSelection(response.articoli);
                }
            } catch (error) {
                console.error('Error loading user articles:', error);
            }
        },

        async createArticle(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await ApiManager.post('AddArticolo', data);

                if (response.success) {
                    this.showMessage('Articolo creato con successo', 'success');
                    event.target.reset();
                    await this.loadUserArticles();
                } else {
                    this.showMessage(response.message || 'Errore nella creazione', 'error');
                }
            } catch (error) {
                console.error('Create article error:', error);
            }
        },

        async createAuction(event) {
            event.preventDefault();
            const formData = new FormData(event.target);

            const checkboxes = document.querySelectorAll('input[name="codice"]:checked');
            const codici = Array.from(checkboxes).map(cb => cb.value);

            if (codici.length === 0) {
                this.showMessage('Seleziona almeno un articolo', 'error');
                return;
            }

            const data = {
                codice: codici,
                minBid: formData.get('minBid'),
                date: formData.get('date')
            };

            try {
                const response = await ApiManager.post('CreateAsta', data);

                if (response.success) {
                    this.showMessage('Asta creata con successo', 'success');
                    event.target.reset();
                    UserDataManager.setLastAction('auction_created');
                    await this.loadUserAuctions();
                    await this.loadUserArticles();
                } else {
                    this.showMessage(response.message || 'Errore nella creazione', 'error');
                }
            } catch (error) {
                console.error('Create auction error:', error);
            }
        },

        async makeOffer(event, auctionId) {
            event.preventDefault();
            const formData = new FormData(event.target);

            const data = {
                idasta: auctionId,
                offertaprezzo: formData.get('offertaprezzo')
            };

            try {
                const response = await ApiManager.post('Offerta', data);

                if (response.success) {
                    this.showMessage('Offerta inviata con successo', 'success');
                    // Ricarica la pagina offerta
                    await this.showOffertaDetail(auctionId);
                } else {
                    this.showMessage(response.message || 'Errore nell\'invio', 'error');
                }
            } catch (error) {
                console.error('Make offer error:', error);
            }
        },

        async closeAuction(auctionId) {
            if (!confirm('Sei sicuro di voler chiudere questa asta?')) {
                return;
            }

            try {
                const response = await ApiManager.post('Dettaglio', {idAsta: auctionId});

                if (response.success) {
                    this.showMessage('Asta chiusa con successo', 'success');
                    await this.showDettaglioAsta(auctionId);
                } else {
                    this.showMessage(response.message || 'Errore nella chiusura', 'error');
                }
            } catch (error) {
                console.error('Close auction error:', error);
            }
        },

        displayAuctions(auctions) {
            const container = document.getElementById('auctions-list');
            const countElement = document.getElementById('auctions-count');

            if (!auctions || auctions.length === 0) {
                container.innerHTML = `
                <div class="no-aste-message">
                    <h3>Nessuna asta trovata</h3>
                </div>
            `;
                countElement.textContent = '0 aste';
                return;
            }

            container.innerHTML = `
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
                    ${auctions.map(auction => `
                        <tr class="asta-row">
                            <td class="asta-id">#${auction.id}</td>
                            <td class="price">€${auction.initialPrice}</td>
                            <td class="min-bid">€${auction.minBid}</td>
                            <td class="date">${auction.timeLeft || 'N/A'}</td>
                            <td class="actions">
                                <button class="btn-dettaglio" onclick="app.showOffertaDetail(${auction.id})">
                                    Dettagli
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

            countElement.textContent = `${auctions.length} aste`;
        },

        displayAwards(awards) {
            const container = document.getElementById('awards-list');
            const countElement = document.getElementById('awards-count');

            if (!awards || awards.length === 0) {
                container.innerHTML = `
                <div class="no-aste-message">
                    <h3>Nessuna aggiudicazione</h3>
                    <p>Non ci sono ancora aggiudicazioni</p>
                </div>
            `;
                countElement.textContent = '0 aggiudicazioni';
                return;
            }

            container.innerHTML = `
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
                    ${awards.map(award => `
                        <tr class="asta-row">
                            <td class="asta-id">#${award.idAsta}</td>
                            <td class="min-bid">€${award.bid}</td>
                            <td class="date">${new Date(award.date).toLocaleString('it-IT')}</td>
                            <td class="actions">
                                <button class="btn-dettaglio" onclick="app.showOffertaDetail(${award.idAsta})">
                                    Dettagli
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

            countElement.textContent = `${awards.length} aggiudicazioni`;
        },

        displayUserAuctions(auctions) {
            const openAuctions = auctions.filter(a => a.state === 'attiva');
            const closedAuctions = auctions.filter(a => a.state === 'chiusa');

            // Aste aperte
            const openContainer = document.getElementById('open-auctions-list');
            const openCount = document.getElementById('open-auctions-count');

            if (openAuctions.length === 0) {
                openContainer.innerHTML = `
                <div class="no-aste-message">
                    <div class="no-aste-icon">🟢</div>
                    <h3>Nessuna asta aperta</h3>
                    <p>Non hai aste attualmente attive</p>
                </div>
            `;
                openCount.textContent = '0 aste';
            } else {
                openContainer.innerHTML = `
                <table class="aste-table">
                    <thead>
                        <tr>
                            <th>ID Asta</th>
                            <th>Prezzo Iniziale</th>
                            <th>Offerta Massima</th>
                            <th>Tempo rimanente</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${openAuctions.map(auction => `
                            <tr class="asta-row">
                                <td class="asta-id">#${auction.id}</td>
                                <td class="price">€${auction.initialPrice}</td>
                                <td class="min-bid">€${auction.minBid}</td>
                                <td class="date">${auction.timeLeft || 'N/A'}</td>
                                <td class="actions">
                                    <button class="btn-dettaglio" onclick="app.showDettaglioAsta(${auction.id})">
                                        Gestisci
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
                openCount.textContent = `${openAuctions.length} aste`;
            }

            // Aste chiuse
            const closedContainer = document.getElementById('closed-auctions-list');
            const closedCount = document.getElementById('closed-auctions-count');

            if (closedAuctions.length === 0) {
                closedContainer.innerHTML = `
                <div class="no-aste-message">
                    <div class="no-aste-icon">🔴</div>
                    <h3>Nessuna asta chiusa</h3>
                    <p>Non hai ancora aste terminate</p>
                </div>
            `;
                closedCount.textContent = '0 aste';
            } else {
                closedContainer.innerHTML = `
                <table class="aste-table">
                    <thead>
                        <tr>
                            <th>ID Asta</th>
                            <th>Prezzo Iniziale</th>
                            <th>Offerta Vincente</th>
                            <th>Data Asta</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${closedAuctions.map(auction => `
                            <tr class="asta-row">
                                <td class="asta-id">#${auction.id}</td>
                                <td class="price">€${auction.initialPrice}</td>
                                <td class="min-bid">€${auction.minBid}</td>
                                <td class="date">${new Date(auction.date).toLocaleDateString('it-IT')}</td>
                                <td class="actions">
                                    <button class="btn-dettaglio" onclick="app.showDettaglioAsta(${auction.id})">
                                        Risultati
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
                closedCount.textContent = `${closedAuctions.length} aste`;
            }
        },

        displayArticlesForSelection(articles) {
            const container = document.getElementById('articles-checkbox');

            if (!articles || articles.length === 0) {
                container.innerHTML = `
                <div class="no-articles-message">
                    <p>Nessun articolo disponibile. Crea prima un articolo.</p>
                </div>
            `;
                document.getElementById('create-auction-btn').disabled = true;
                return;
            }

            container.innerHTML = articles.map(article => `
            <div class="checkbox-item">
                <input type="checkbox" id="articolo_${article.code}" name="codice" value="${article.code}" class="checkbox-input">
                <label for="articolo_${article.code}" class="checkbox-label">
                    <span class="checkbox-name">${article.name}</span>
                    <span class="checkbox-price">€${article.price}</span>
                </label>
            </div>
        `).join('');

            document.getElementById('create-auction-btn').disabled = false;
        },

        logout() {
            if (confirm('Sei sicuro di voler uscire?')) {
                window.location.href = 'Logout';
            }
        }
    };

// ===== INIZIALIZZAZIONE =====
    window.addEventListener('DOMContentLoaded', function () {
        const userData = UserDataManager.getUserData();

        // Determina quale sezione mostrare
        if (userData.isFirstTime) {
            app.showSection('acquisto');
        } else if (userData.lastAction === 'auction_created') {
            app.showSection('vendo');
        } else {
            app.showSection('acquisto');
        }
    });

// ===== STILI AGGIUNTIVI =====
    const style = document.createElement('style');
    style.textContent = `
    .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    .active {
        background-color: #4a90e2 !important;
        color: white !important;
    }

    .success {
        background-color: #d4edda !important;
        color: #155724 !important;
        border: 1px solid #c3e6cb !important;
    }

    .winner-section {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        padding: 1rem;
        margin-top: 1rem;
    }

    .winner-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: 5px;
        margin-top: 1rem;
    }

    .winner-info h4, .winning-bid h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .winner-name {
        font-size: 1.2rem;
        font-weight: bold;
        color: #2c3e50;
    }

    .winning-amount {
        font-size: 1.5rem;
        font-weight: bold;
        color: #27ae60;
    }

    .btn-close-auction {
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        margin-top: 1.5rem;
        width: 100%;
    }

    .btn-close-auction:hover {
        background-color: #c82333;
    }

    .winning-row {
        background-color: #fff3cd;
        font-weight: bold;
    }

    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .status-winner {
        background-color: #ffc107;
        color: #000;
    }

    .status-leading {
        background-color: #17a2b8;
        color: white;
    }

    .status-normal {
        background-color: #6c757d;
        color: white;
    }

    .asta-actions {
        margin-top: 2rem;
        text-align: center;
    }

    .main-content {
        display: flex;
        gap: 2rem;
        margin-top: 2rem;
    }

    .asta-details-container {
        flex: 1;
    }

    .offerte-container {
        flex: 1;
    }

    @media (max-width: 768px) {
        .main-content {
            flex-direction: column;
        }
    }
`;
    document.head.appendChild(style);
//})