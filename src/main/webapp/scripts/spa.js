(function() {
    'use strict';

    const StorageModule = (function() {
        const EXPIRY_DAYS = 30;

        function isStorageAvailable() {
            try {
                const test = 'storageTest';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch(e) {
                return false;
            }
        }

        const LSavailable = isStorageAvailable();

        return {
            setItem: function(key, value) {
                const data = {
                    value: value,
                    expiry: Date.now() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000)
                };

                try {
                    if (LSavailable) {
                        localStorage.setItem(key, JSON.stringify(data));
                    } else {
                        console.warn('localStorage non disponibile, i dati non verranno salvati');
                    }
                } catch(e) {
                    console.warn('Storage error:', e);
                }
            },

            getItem: function(key) {
                try {
                    if (!LSavailable) {
                        return null;
                    }

                    const stored = localStorage.getItem(key);
                    if (!stored) return null;

                    const data = JSON.parse(stored);

                    // Check expiry
                    if (Date.now() > data.expiry) {
                        this.removeItem(key);
                        return null;
                    }

                    return data.value;
                } catch(e) {
                    console.warn('Storage retrieval error:', e);
                    return null;
                }
            },

            removeItem: function(key) {
                try {
                    if (LSavailable) {
                        localStorage.removeItem(key);
                    }
                } catch(e) {
                    console.warn('Storage removal error:', e);
                }
            }
        };
    })();

    const UserDataModule = (function() {
        let currentUser = null;

        function getStorageKey() {
            return currentUser;
        }

        function createNewUserData() {
            return {
                username: currentUser,
                isFirstTime: true,
                lastAction: null,
                lastActionDate: null,
                visitedAuctions: []
            };
        }

        return {
            init: function(username) {
                currentUser = username;
            },

            getUserData: function() {
                if (!currentUser) return createNewUserData();

                const data = StorageModule.getItem(getStorageKey());
                return data || createNewUserData();
            },

            saveUserData: function(userData) {
                if (!currentUser) return;
                StorageModule.setItem(getStorageKey(), userData);
            },

            setLastAction: function(action) {
                const userData = this.getUserData();
                userData.lastAction = action;
                userData.lastActionDate = Date.now();
                userData.isFirstTime = false;
                this.saveUserData(userData);
            },

            addVisitedAuction: function(auctionId) {
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
    })();

    const ApiModule = (function() {
        async function request(endpoint, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            const finalOptions = Object.assign({}, defaultOptions, options);

            try {
                const response = await fetch(endpoint, finalOptions);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                let data;

                try {
                    data = JSON.parse(text);
                } catch (e) {
                    data = {success: false, message: text};
                }

                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        }

        return {
            get: async function(endpoint) {
                return request(endpoint);
            },

            post: async function(endpoint, data) {
                const formData = new URLSearchParams();
                for (const [key, value] of Object.entries(data)) {
                    if (Array.isArray(value)) {
                        value.forEach(v => formData.append(key, v));
                    } else {
                        formData.append(key, value);
                    }
                }

                return request(endpoint, {
                    method: 'POST',
                    body: formData
                });
            }
        };
    })();

    const TemplateModule = (function() {
        const templates = {};

        //prevenire XSS
        function sanitizer(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Formattazione valuta
        function formatCurrency(value) {
            return new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR'
            }).format(value);
        }

        // Formattazione data
        function formatDate(date) {
            return new Date(date).toLocaleString('it-IT');
        }

        return {
            init: function() {
                // Carica tutti i template dal DOM
                const templateElements = document.querySelectorAll('template');
                templateElements.forEach(template => {
                    templates[template.id] = template.content;
                });
            },

            getTemplate: function(templateId) {
                const template = templates[templateId];
                if (!template) {
                    throw new Error(`Template ${templateId} not found`);
                }
                return template.cloneNode(true);
            },

            createAuctionRow: function(auction) {
                const tr = document.createElement('tr');
                tr.className = 'asta-row';
                tr.innerHTML = `
                    <td class="asta-id">#${sanitizer(auction.id)}</td>
                    <td class="price">${formatCurrency(auction.initialPrice)}</td>
                    <td class="min-bid">${formatCurrency(auction.minBid)}</td>
                    <td class="date">${sanitizer(auction.timeLeft || 'N/A')}</td>
                    <td class="actions">
                        <button class="btn-dettaglio auction-detail-btn" data-auction-id="${sanitizer(auction.id)}">
                            Dettagli
                        </button>
                    </td>
                `;
                return tr;
            },

            createArticleRow: function(article) {
                const tr = document.createElement('tr');
                tr.className = 'asta-row';
                tr.innerHTML = `
                    <td class="asta-id">${sanitizer(article.code)}</td>
                    <td class="article-name">${sanitizer(article.name)}</td>
                    <td class="article-description">${sanitizer(article.description)}</td>
                    <td class="price">${formatCurrency(article.price)}</td>
                `;
                return tr;
            },

            createArticleRowWithImage: function(article) {
                const tr = document.createElement('tr');
                tr.className = 'asta-row';
                tr.innerHTML = `
                    <td class="asta-id">${sanitizer(article.code)}</td>
                    <td class="article-name">${sanitizer(article.name)}</td>
                    <td class="article-description">${sanitizer(article.description)}</td>
                    <td class="article-path">
                        ${article.path ? `<img src="Image/${sanitizer(article.path)}" alt="Errore"/>` : 'Nessuna immagine'}
                    </td>
                    <td class="price">${formatCurrency(article.price)}</td>
                `;
                return tr;
            },

            createOfferRow: function(offer, index, astaState) {
                const tr = document.createElement('tr');
                tr.className = 'offerta-row';
                if (index === 0 && astaState === 'chiusa') {
                    tr.className += ' winning-row';
                }

                let statusBadge = '<span class="status-badge status-normal">Valida</span>';
                if (index === 0 && astaState === 'chiusa') {
                    statusBadge = '<span class="status-badge status-winner">Vincente</span>';
                } else if (index === 0 && astaState === 'attiva') {
                    statusBadge = '<span class="status-badge status-leading">Migliore</span>';
                }

                tr.innerHTML = `
                    <td class="user-name">${sanitizer(offer.usnUser)}</td>
                    <td class="min-bid">${formatCurrency(offer.bid)}</td>
                    <td class="date">${formatDate(offer.date)}</td>
                    <td class="offerta-status">${statusBadge}</td>
                `;
                return tr;
            },

            createCheckboxItem: function(article) {
                const div = document.createElement('div');
                div.className = 'checkbox-item';
                div.innerHTML = `
                    <input type="checkbox" id="articolo_${sanitizer(article.code)}" 
                           name="codice" value="${sanitizer(article.code)}" class="checkbox-input">
                    <label for="articolo_${sanitizer(article.code)}" class="checkbox-label">
                        <span class="checkbox-name">${sanitizer(article.name)}</span>
                        <span class="checkbox-price">${formatCurrency(article.price)}</span>
                    </label>
                `;
                return div;
            },

            createNoDataMessage: function(icon, title, subtitle = '') {
                const div = document.createElement('div');
                div.className = 'no-aste-message';
                div.innerHTML = `
                    <div class="no-aste-icon">${icon}</div>
                    <h3>${sanitizer(title)}</h3>
                    ${subtitle ? `<p>${sanitizer(subtitle)}</p>` : ''}
                `;
                return div;
            }
        };
    })();

    const UIModule = (function() {
        let messageTimeout;

        return {
            showMessage: function(message, type = 'info') {
                const container = document.getElementById('message-container');
                const messageDiv = document.createElement('div');
                messageDiv.className = `error-message ${type === 'success' ? 'success' : ''}`;
                messageDiv.textContent = message;

                container.innerHTML = '';
                container.appendChild(messageDiv);

                if (messageTimeout) {
                    clearTimeout(messageTimeout);
                }

                messageTimeout = setTimeout(() => {
                    if (container.contains(messageDiv)) {
                        container.removeChild(messageDiv);
                    }
                }, 5000);
            },

            updateNavigation: function(activeSection) {
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

            // showLoading: function(elementId) {
            //     const element = document.getElementById(elementId);
            //     if (element) {
            //         element.innerHTML = '<div class="loading">Caricamento...</div>';
            //     }
            // },

            updateCount: function(elementId, count, suffix = '') {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = `${count} ${suffix}`;
                }
            }
        };
    })();

    const AuctionRenderer = (function() {
        function displayAuctions(auctions) {
            const container = document.getElementById('auctions-list');

            if (!auctions || auctions.length === 0) {
                const message = TemplateModule.createNoDataMessage(
                    '🔍',
                    'Nessuna asta trovata'
                );
                container.innerHTML = '';
                container.appendChild(message);
                UIModule.updateCount('auctions-count', 0, 'aste');
                return;
            }

            UIModule.updateCount('auctions-count', auctions.length, 'aste');

            const table = document.createElement('table');
            table.className = 'aste-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Prezzo Iniziale</th>
                        <th>Offerta Minima</th>
                        <th>Tempo Rimanente</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');
            auctions.forEach(auction => {
                tbody.appendChild(TemplateModule.createAuctionRow(auction));
            });

            container.innerHTML = '';
            container.appendChild(table);
        }

        function displayAwards(awards) {
            const container = document.getElementById('awards-list');
            UIModule.updateCount('awards-count', awards.length, 'aggiudicazioni');

            if (!awards || awards.length === 0) {
                const message = TemplateModule.createNoDataMessage(
                    '🏆',
                    'Nessuna aggiudicazione',
                    'Non ci sono ancora aggiudicazioni'
                );
                container.innerHTML = '';
                container.appendChild(message);
                return;
            }

            const table = document.createElement('table');
            table.className = 'aste-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID Asta</th>
                        <th>Offerta</th>
                        <th>Data</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');
            awards.forEach(award => {
                const tr = document.createElement('tr');
                tr.className = 'asta-row';
                tr.innerHTML = `
                    <td class="asta-id">#${award.idAsta}</td>
                    <td class="min-bid">${new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(award.bid)}</td>
                    <td class="date">${new Date(award.date).toLocaleString('it-IT')}</td>
                    <td class="actions">
                        <button class="btn-dettaglio award-detail-btn" data-auction-id="${award.idAsta}">
                            Dettagli
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            container.innerHTML = '';
            container.appendChild(table);
        }

        function displayUserAuctions(auctions) {
            const openAuctions = auctions.filter(a => a.state === 'attiva');
            const closedAuctions = auctions.filter(a => a.state === 'chiusa');

            displayOpenAuctions(openAuctions);
            displayClosedAuctions(closedAuctions);
        }

        function displayOpenAuctions(auctions) {
            const container = document.getElementById('open-auctions-list');
            UIModule.updateCount('open-auctions-count', auctions.length, 'aste');

            if (auctions.length === 0) {
                const message = TemplateModule.createNoDataMessage(
                    '🟢',
                    'Nessuna asta aperta',
                    'Non hai aste attualmente attive'
                );
                container.innerHTML = '';
                container.appendChild(message);
                return;
            }

            const table = document.createElement('table');
            table.className = 'aste-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID Asta</th>
                        <th>Prezzo Iniziale</th>
                        <th>Offerta Massima</th>
                        <th>Tempo rimanente</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');
            auctions.forEach(auction => {
                const tr = document.createElement('tr');
                tr.className = 'asta-row';
                tr.innerHTML = `
                    <td class="asta-id">#${auction.id}</td>
                    <td class="price">${new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(auction.initialPrice)}</td>
                    <td class="min-bid">${new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(auction.minBid)}</td>
                    <td class="date">${auction.timeLeft || 'N/A'}</td>
                    <td class="actions">
                        <button class="btn-dettaglio open-auction-detail-btn" data-auction-id="${auction.id}">
                            Gestisci
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            container.innerHTML = '';
            container.appendChild(table);
        }

        function displayClosedAuctions(auctions) {
            const container = document.getElementById('closed-auctions-list');
            UIModule.updateCount('closed-auctions-count', auctions.length, 'aste');

            if (auctions.length === 0) {
                const message = TemplateModule.createNoDataMessage(
                    '🔴',
                    'Nessuna asta chiusa',
                    'Non hai ancora aste terminate'
                );
                container.innerHTML = '';
                container.appendChild(message);
                return;
            }

            const table = document.createElement('table');
            table.className = 'aste-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID Asta</th>
                        <th>Prezzo Iniziale</th>
                        <th>Offerta Vincente</th>
                        <th>Data Asta</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');
            auctions.forEach(auction => {
                const tr = document.createElement('tr');
                tr.className = 'asta-row';
                tr.innerHTML = `
                    <td class="asta-id">#${auction.id}</td>
                    <td class="price">${new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(auction.initialPrice)}</td>
                    <td class="min-bid">${new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(auction.minBid)}</td>
                    <td class="date">${new Date(auction.date).toLocaleDateString('it-IT')}</td>
                    <td class="actions">
                        <button class="btn-dettaglio closed-auction-detail-btn" data-auction-id="${auction.id}">
                            Risultati
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            container.innerHTML = '';
            container.appendChild(table);
        }

        return {
            displayAuctions,
            displayAwards,
            displayUserAuctions
        };
    })();

    const ArticleRenderer = (function() {
        function displayArticlesInTable(articles, containerId, showImages = false) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (!articles || articles.length === 0) {
                const message = TemplateModule.createNoDataMessage(
                    '📦',
                    'Nessun articolo disponibile'
                );
                container.innerHTML = '';
                container.appendChild(message);
                return;
            }

            const table = document.createElement('table');
            table.className = 'aste-table';

            if (showImages) {
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Codice</th>
                            <th>Nome</th>
                            <th>Descrizione</th>
                            <th>Immagine</th>
                            <th>Prezzo</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
            } else {
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Codice</th>
                            <th>Nome</th>
                            <th>Descrizione</th>
                            <th>Prezzo</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
            }

            const tbody = table.querySelector('tbody');
            articles.forEach(article => {
                if (showImages) {
                    tbody.appendChild(TemplateModule.createArticleRowWithImage(article));
                } else {
                    tbody.appendChild(TemplateModule.createArticleRow(article));
                }
            });

            container.innerHTML = '';
            container.appendChild(table);
        }

        function displayArticlesForSelection(articles) {
            const container = document.getElementById('articles-checkbox');

            if (!articles || articles.length === 0) {
                container.innerHTML = `
                    <div class="no-articles-message">
                        <p>Nessun articolo disponibile. Crea prima un articolo.</p>
                    </div>
                `;
                const createBtn = document.getElementById('create-auction-btn');
                if (createBtn) createBtn.disabled = true;
                return;
            }

            container.innerHTML = '';
            articles.forEach(article => {
                container.appendChild(TemplateModule.createCheckboxItem(article));
            });

            const createBtn = document.getElementById('create-auction-btn');
            if (createBtn) createBtn.disabled = false;
        }

        return {
            displayArticlesInTable,
            displayArticlesForSelection
        };
    })();

    const OfferRenderer = (function() {
        function displayOffersInTable(offers, containerId, astaState) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (!offers || offers.length === 0) {
                const message = TemplateModule.createNoDataMessage(
                    '💰',
                    'Nessuna offerta ricevuta'
                );
                container.innerHTML = '';
                container.appendChild(message);
                return;
            }

            const table = document.createElement('table');
            table.className = 'aste-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Utente</th>
                        <th>Offerta</th>
                        <th>Data</th>
                        <th>Stato</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');
            offers.forEach((offer, index) => {
                tbody.appendChild(TemplateModule.createOfferRow(offer, index, astaState));
            });

            container.innerHTML = '';
            container.appendChild(table);
        }

        return {
            displayOffersInTable
        };
    })();

    const NavigationController = (function() {
        function showSection(section) {
            UIModule.updateNavigation(section);

            try {
                if (section === 'acquisto') {
                    AcquistoController.load();
                } else if (section === 'vendo') {
                    VendoController.load();
                }
            } catch (error) {
                console.error('Error loading section:', error);
                UIModule.showMessage('Errore nel caricamento della sezione', 'error');
            }
        }

        function goToOffertaDetail(auctionId) {
            OffertaController.show(auctionId);
        }

        function goToAwardDetail(auctionId) {
            AwardController.show(auctionId);
        }

        function goToDettaglioAsta(auctionId) {
            DettaglioController.show(auctionId);
        }

        function backToAcquisto() {
            showSection('acquisto');
        }

        function backToVendo() {
            showSection('vendo');
        }

        return {
            showSection,
            goToOffertaDetail,
            goToAwardDetail,
            goToDettaglioAsta,
            backToAcquisto,
            backToVendo
        };
    })();

    const AcquistoController = (function() {
        async function load() {
            const template = TemplateModule.getTemplate('template-acquisto-section');
            document.getElementById('content').innerHTML = '';
            document.getElementById('content').appendChild(template);

            const userData = UserDataModule.getUserData();

            // Mostra aste visitate se non è la prima volta e ci sono aste visitate
            if (!userData.isFirstTime && userData.visitedAuctions && userData.visitedAuctions.length > 0) {
                document.getElementById('aste-title').textContent = 'Aste Visitate di Recente';
                await loadVisitedAuctions(userData.visitedAuctions);
            } else {
                // Mostra messaggio iniziale se è la prima volta o non ci sono aste visitate
                document.getElementById('aste-title').textContent = 'Aste Disponibili';
                const message = TemplateModule.createNoDataMessage(
                    '🔍',
                    'Cerca articoli per visualizzare le aste',
                    'Le aste che visiterai appariranno qui'
                );
                document.getElementById('auctions-list').innerHTML = '';
                document.getElementById('auctions-list').appendChild(message);
                UIModule.updateCount('auctions-count', 0, 'aste');
            }

            await loadAwards();
        }

        async function searchAuctions(form) {
            const keyword = form.querySelector('#search-keyword').value.trim();

            if (!keyword) {
                UIModule.showMessage('Inserisci una parola chiave per cercare', 'error');
                return;
            }

            try {
                document.getElementById('aste-title').textContent = 'Risultati Ricerca';
                //UIModule.showLoading('auctions-list');

                const response = await ApiModule.get(`Acquisto?search=${encodeURIComponent(keyword)}`);

                if (response.success) {
                    if (response.aste && response.aste.length > 0) {
                        AuctionRenderer.displayAuctions(response.aste);
                        if (response.error) {
                            UIModule.showMessage(response.error, 'info');
                        }
                    } else {
                        // Nessuna asta trovata
                        AuctionRenderer.displayAuctions([]);
                        UIModule.showMessage('Nessuna asta trovata per la ricerca: "' + keyword + '"', 'info');
                    }
                } else {
                    UIModule.showMessage(response.message || response.error || 'Errore nella ricerca', 'error');
                    AuctionRenderer.displayAuctions([]);
                }
            } catch (error) {
                console.error('Search error:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
                AuctionRenderer.displayAuctions([]);
            }
        }

        async function loadVisitedAuctions(auctionIds) {
            if (!auctionIds || auctionIds.length === 0) {
                document.getElementById('aste-title').textContent = 'Aste Disponibili';
                const message = TemplateModule.createNoDataMessage(
                    '🔍',
                    'Cerca articoli per visualizzare le aste'
                );
                document.getElementById('auctions-list').innerHTML = '';
                document.getElementById('auctions-list').appendChild(message);
                UIModule.updateCount('auctions-count', 0, 'aste');
                return;
            }

            try {
                const idsString = auctionIds.join(',');
                const response = await ApiModule.get(`AsteVisitate?ids=${idsString}`);

                if (response.success && response.aste && response.aste.length > 0) {
                    AuctionRenderer.displayAuctions(response.aste);
                } else {
                    // Le aste visitate non esistono più o sono terminate
                    document.getElementById('aste-title').textContent = 'Aste Disponibili';
                    const message = TemplateModule.createNoDataMessage(
                        '🔍',
                        'Le aste visitate sono terminate',
                        'Cerca nuove aste da visualizzare'
                    );
                    document.getElementById('auctions-list').innerHTML = '';
                    document.getElementById('auctions-list').appendChild(message);
                    UIModule.updateCount('auctions-count', 0, 'aste');

                    // Pulisci le aste visitate scadute
                    const userData = UserDataModule.getUserData();
                    userData.visitedAuctions = [];
                    UserDataModule.saveUserData(userData);
                }
            } catch (error) {
                console.error('Error loading visited auctions:', error);
                document.getElementById('aste-title').textContent = 'Aste Disponibili';
                const message = TemplateModule.createNoDataMessage(
                    '🔍',
                    'Errore nel caricamento delle aste visitate',
                    'Prova a cercare nuove aste'
                );
                document.getElementById('auctions-list').innerHTML = '';
                document.getElementById('auctions-list').appendChild(message);
                UIModule.updateCount('auctions-count', 0, 'aste');
            }
        }

        async function loadAwards() {
            try {
                const response = await ApiModule.get('Acquisto');

                if (response.success && response.aggiudicazioni) {
                    AuctionRenderer.displayAwards(response.aggiudicazioni);
                } else {
                    AuctionRenderer.displayAwards([]);
                }
            } catch (error) {
                console.error('Error loading awards:', error);
                AuctionRenderer.displayAwards([]);
            }
        }

        return {
            load,
            searchAuctions
        };
    })();

    const VendoController = (function() {
        async function load() {
            const template = TemplateModule.getTemplate('template-vendo-section');
            document.getElementById('content').innerHTML = '';
            document.getElementById('content').appendChild(template);

            await Promise.all([
                loadUserAuctions(),
                loadUserArticles()
            ]);
        }

        async function loadUserAuctions() {
            try {
                const response = await ApiModule.get('Vendo');

                if (response.success && response.aste) {
                    AuctionRenderer.displayUserAuctions(response.aste);
                } else {
                    AuctionRenderer.displayUserAuctions([]);
                }
            } catch (error) {
                console.error('Error loading user auctions:', error);
                AuctionRenderer.displayUserAuctions([]);
            }
        }

        async function loadUserArticles() {
            try {
                const response = await ApiModule.get('Vendo');

                if (response.success && response.articoli) {
                    ArticleRenderer.displayArticlesForSelection(response.articoli);
                } else {
                    ArticleRenderer.displayArticlesForSelection([]);
                }
            } catch (error) {
                console.error('Error loading user articles:', error);
                ArticleRenderer.displayArticlesForSelection([]);
            }
        }

        async function createArticle(form) {
            const formData = new FormData(form);

            try {
                const response = await fetch('AddArticolo', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                let data;

                try {
                    data = JSON.parse(text);
                } catch (e) {
                    data = {success: false, message: text};
                }

                if (data.success) {
                    form.reset();
                    await Promise.all([
                        loadUserAuctions(),
                        loadUserArticles()
                    ]);
                } else {
                    UIModule.showMessage(data.message || 'Errore nella creazione', 'error');
                }
            } catch (error) {
                console.error('Create article error:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
            }
        }

        async function createAuction(form) {
            const formData = new FormData(form);
            const checkboxes = form.querySelectorAll('input[name="codice"]:checked');
            const codici = Array.from(checkboxes).map(cb => cb.value);

            if (codici.length === 0) {
                UIModule.showMessage('Seleziona almeno un articolo', 'error');
                return;
            }

            const data = {
                codice: codici,
                minBid: formData.get('minBid'),
                date: formData.get('date')
            };

            try {
                const response = await ApiModule.post('CreateAsta', data);

                if (response.success) {
                    form.reset();
                    UserDataModule.setLastAction('auction_created');
                    await Promise.all([
                        loadUserAuctions(),
                        loadUserArticles()
                    ]);
                } else {
                    UIModule.showMessage(response.message || 'Errore nella creazione', 'error');
                }
            } catch (error) {
                console.error('Create auction error:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
            }
        }

        return {
            load,
            createArticle,
            createAuction
        };
    })();

    const OffertaController = (function() {
        async function show(auctionId) {
            // Aggiungi l'asta alle aste visitate
            UserDataModule.addVisitedAuction(auctionId);

            try {
                const response = await ApiModule.get(`Offerta?idasta=${auctionId}`);

                if (!response.success) {
                    UIModule.showMessage(response.message || 'Errore nel caricamento', 'error');
                    return;
                }

                const template = TemplateModule.getTemplate('template-offerta-detail');
                document.getElementById('content').innerHTML = '';
                document.getElementById('content').appendChild(template);

                // Popola i dati
                ArticleRenderer.displayArticlesInTable(response.articoli || [], 'articoli-table-container', true);
                OfferRenderer.displayOffersInTable(response.offerta || [], 'offerte-table-container', 'attiva');

                // Aggiorna i contatori
                UIModule.updateCount('articles-count', (response.articoli || []).length, 'articoli');
                UIModule.updateCount('offers-count', (response.offerta || []).length, 'offerte');

                // Setup form
                const offerForm = document.getElementById('offer-form');
                if (offerForm) {
                    offerForm.dataset.auctionId = auctionId;
                }

            } catch (error) {
                console.error('Error loading offerta:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
            }
        }

        async function makeOffer(form, auctionId) {
            const formData = new FormData(form);

            const data = {
                idasta: auctionId,
                offertaprezzo: formData.get('offertaprezzo')
            };

            try {
                const response = await ApiModule.post('Offerta', data);

                if (response.success) {
                    await show(auctionId);
                } else {
                    UIModule.showMessage(response.message || 'Errore nell\'invio', 'error');
                }
            } catch (error) {
                console.error('Make offer error:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
            }
        }

        return {
            show,
            makeOffer
        };
    })();

    const AwardController = (function() {
        async function show(auctionId) {
            try {
                const response = await ApiModule.get(`Offerta?idasta=${auctionId}`);

                if (!response.success) {
                    UIModule.showMessage(response.message || 'Errore nel caricamento', 'error');
                    return;
                }

                const template = TemplateModule.getTemplate('template-offerta-detail');
                document.getElementById('content').innerHTML = '';
                document.getElementById('content').appendChild(template);

                // Popola i dati
                ArticleRenderer.displayArticlesInTable(response.articoli || [], 'articoli-table-container', true);
                OfferRenderer.displayOffersInTable(response.offerta || [], 'offerte-table-container', 'chiusa');

                // Aggiorna i contatori
                UIModule.updateCount('articles-count', (response.articoli || []).length, 'articoli');
                UIModule.updateCount('offers-count', (response.offerta || []).length, 'offerte');

                // Nascondi il form dell'offerta per le aggiudicazioni
                const offerFormContainer = document.querySelector('.forms-container');
                if (offerFormContainer) {
                    offerFormContainer.style.display = 'none';
                }

            } catch (error) {
                console.error('Error loading award:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
            }
        }

        return {
            show
        };
    })();

    const DettaglioController = (function() {
        async function show(auctionId) {
            try {
                const response = await ApiModule.get(`Dettaglio?idasta=${auctionId}`);

                if (!response.success) {
                    UIModule.showMessage(response.message || 'Errore nel caricamento', 'error');
                    return;
                }

                const template = TemplateModule.getTemplate('template-dettaglio-asta');
                document.getElementById('content').innerHTML = '';
                document.getElementById('content').appendChild(template);

                const asta = response.asta;

                // Popola i dati dell'asta
                document.querySelector('#asta-id').textContent = `#${asta.id}`;
                document.querySelector('#asta-id-value').textContent = `#${asta.id}`;
                document.getElementById('asta-price').textContent = `€${asta.initialPrice}`;
                document.getElementById('asta-minbid').textContent = `€${asta.minBid}`;
                document.getElementById('asta-date').textContent = new Date(asta.date).toLocaleString('it-IT');

                // Status
                const statusContainer = document.getElementById('asta-status');
                if (asta.state === 'attiva') {
                    statusContainer.innerHTML = '<span class="status-badge status-active">🟢 Attiva</span>';
                } else {
                    statusContainer.innerHTML = '<span class="status-badge status-closed">🔴 Chiusa</span>';
                }

                ArticleRenderer.displayArticlesInTable(response.articoli || [], 'articoli-asta-container', true);

                OfferRenderer.displayOffersInTable(response.offerte || [], 'offerte-dettaglio-container', asta.state);

                if (asta.state === 'attiva') {
                    const actionsContainer = document.getElementById('asta-actions');
                    if (actionsContainer) {
                        actionsContainer.innerHTML = `
                            <button id="close-auction-btn" class="btn-close-auction" data-auction-id="${asta.id}">
                                Chiudi Asta
                            </button>
                        `;
                    }
                }

                // Sezione vincitore (solo se chiusa)
                if (asta.state === 'chiusa' && response.utente) {
                    const winnerSection = document.getElementById('winner-section');
                    if (winnerSection) {
                        winnerSection.innerHTML = `
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
                        `;
                    }
                }

            } catch (error) {
                console.error('Error loading dettaglio:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
            }
        }

        async function closeAuction(auctionId) {
            if (!confirm('Sei sicuro di voler chiudere questa asta?')) {
                return;
            }

            try {
                const response = await ApiModule.post('Dettaglio', {idAsta: auctionId});

                if (response.success) {
                    await show(auctionId);
                } else {
                    UIModule.showMessage(response.message || 'Errore nella chiusura', 'error');
                }
            } catch (error) {
                console.error('Close auction error:', error);
                UIModule.showMessage('Errore di connessione al server', 'error');
            }
        }

        return {
            show,
            closeAuction
        };
    })();

    const EventController = (function() {
        function setupEventListeners() {
            document.getElementById('nav-acquisto').addEventListener('click', () => {
                NavigationController.showSection('acquisto');
            });

            document.getElementById('nav-vendo').addEventListener('click', () => {
                NavigationController.showSection('vendo');
            });

            document.querySelector('.btn-logout').addEventListener('click', logout);

            document.getElementById('content').addEventListener('submit', handleFormSubmit);
            document.getElementById('content').addEventListener('click', handleClick);
        }

        function handleFormSubmit(event) {
            const form = event.target;

            if (form.id === 'search-form') {
                event.preventDefault();
                AcquistoController.searchAuctions(form);
            } else if (form.id === 'create-article-form') {
                event.preventDefault();
                VendoController.createArticle(form);
            } else if (form.id === 'create-auction-form') {
                event.preventDefault();
                VendoController.createAuction(form);
            } else if (form.id === 'offer-form') {
                event.preventDefault();
                const auctionId = form.dataset.auctionId;
                OffertaController.makeOffer(form, auctionId);
            }
        }

        function handleClick(event) {
            const target = event.target;

            if (target.classList.contains('auction-detail-btn')) {
                const auctionId = parseInt(target.dataset.auctionId);
                NavigationController.goToOffertaDetail(auctionId);
            } else if (target.classList.contains('award-detail-btn')) {
                const auctionId = parseInt(target.dataset.auctionId);
                NavigationController.goToAwardDetail(auctionId);
            } else if (target.classList.contains('open-auction-detail-btn') ||
                target.classList.contains('closed-auction-detail-btn')) {
                const auctionId = parseInt(target.dataset.auctionId);
                NavigationController.goToDettaglioAsta(auctionId);
            } else if (target.id === 'back-to-acquisto') {
                NavigationController.backToAcquisto();
            } else if (target.id === 'back-to-vendo') {
                NavigationController.backToVendo();
            } else if (target.id === 'close-auction-btn') {
                const auctionId = parseInt(target.dataset.auctionId);
                DettaglioController.closeAuction(auctionId);
            }
        }

        function logout() {
            if (confirm('Sei sicuro di voler uscire?')) {
                window.location.href = 'Logout';
            }
        }

        return {
            setupEventListeners
        };
    })();

    const Startup = (function() {
        let currentUser = null;

        function init() {
            currentUser = window.CURRENT_USER;
            if(currentUser == null){
                window.location.href = 'index.html';
            }

            TemplateModule.init();
            UserDataModule.init(currentUser);
            EventController.setupEventListeners();

            const userData = UserDataModule.getUserData();
            if (userData.isFirstTime) {
                NavigationController.showSection('acquisto');
            } else if (userData.lastAction === 'auction_created') {
                NavigationController.showSection('vendo');
            } else {
                NavigationController.showSection('acquisto');
            }
        }

        return {
            init
        };
    })();

    document.addEventListener('DOMContentLoaded', function() {
        Startup.init();
    });
})();