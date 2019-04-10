const express = require('express');
const app = express()
const port = 3000

app.get('/', function (req, res) {
    res.send('Welcome to the Greenwich Village Delivery Service');
});
app.get('/login', function (req, res) {
    res.send("Routed to Login Page");
});

app.listen(port, () => console.log(`Web app listening on port ${port}!`))