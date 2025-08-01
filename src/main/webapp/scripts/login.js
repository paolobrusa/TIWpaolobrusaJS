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
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }

    function loginUser(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        fetch('Login', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Login in corso!', 'success');
                setTimeout(() => {
                    window.location.href = "Homepage";
                }, 1000);
            } else {
                showMessage(data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('Errore di connessione', 'error');
        });
    }
})();