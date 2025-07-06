(function () {
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.innerHTML = '';
        if (!username || !password) {
            showMessage('Inserisci username e password', 'error');
            return;
        }
        loginUser(username, password);
    });

    function showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        const messageClass = type === 'error' ? 'error-message' : 'success-message';
        messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;
    }

    function loginUser(username, password) {
        /*
        fetch('/Login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Login effettuato con successo!', 'success');
                // Reindirizza alla pagina principale
                setTimeout(() => {
                    window.location.href = data.redirectUrl;
                }, 1000);
            } else {
                showMessage(data.message || 'Credenziali non valide', 'error');
            }
        })
        .catch(error => {
            showMessage('Errore di connessione', 'error');
        });
        */
        // setTimeout(() => {
        //     if (username === 'admin' && password === 'password') {
        //         showMessage('Login effettuato con successo!', 'success');
        //         setTimeout(() => {
        //             alert('Reindirizzamento alla dashboard...');
        //         }, 1000);
        //     } else {
        //         showMessage('Username o password non corretti', 'error');
        //     }
        // }, 500);
    }
})();