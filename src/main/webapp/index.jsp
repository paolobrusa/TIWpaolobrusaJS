<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LOGIN</title>
    <link rel="stylesheet" href="css/login.css">
</head>
<body>
<div class="login-container">
    <div class="login-header">
        <h1>Accedi</h1>
        <p>Inserisci le tue credenziali per continuare</p>
    </div>

    <div id="messageContainer"></div>

    <form id="loginForm">
        <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required placeholder="Inserisci il tuo username">
        </div>

        <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required placeholder="Inserisci la tua password">
        </div>

        <button type="submit" class="btn-login">
            Accedi
        </button>
    </form>
</div>