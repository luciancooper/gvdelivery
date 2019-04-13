const express = require('express');
const { Pool, Client } = require('pg');
const app = express();
const port = 3000;

// PostgreSVG Connect String
const connectionString = "postgres://lucian:password@localhost:5432/gvdelivery";

function queryClients(callback) {
    const client = new Client({
        connectionString: connectionString,
    })
    client.connect();
    
    client.query('SELECT restaurant_name,restaurant_cuisine,address FROM clients', (err, res) => {
        client.end();
        callback(res,err);
    });
};

const pool = new Pool({
    connectionString: connectionString
});

function queryClientsFromPool(callback) {
    pool.connect(function(err,client,done) {
        if (err) {
            console.log("Unable to connect to PostgreSQL: "+ err);
            callback(null,err);
        }
        client.query('SELECT restaurant_name,restaurant_cuisine,address FROM clients',function(err,result) {
            done(); // release client back to pool
            if (err) {
                console.log("Error running query: "+err);
                callback(null,err);
            }
            callback(result);
        });
    });
};

app.get('/', function (req, res) {
    res.send('Welcome to the Greenwich Village Delivery Service');
});

function renderClient(json) {
    let name = `<tr><th>Name</th><td>${json.restaurant_name}</td></tr>`;
    let cuisine = `<tr><th>Cuisine</th><td>${json.restaurant_cuisine}</td></tr>`;
    let address = ['Address','City','State','Zip'].map((k) => { return `<tr><th>${k}</th><td>${json.address[k]}</td></tr>`}).join('');
    return `<table>${name}${cuisine}${address}</table>`;
}

app.get('/db', function (req, res) {
    queryClientsFromPool(function(result,err) {
        if (err) {
            res.status(400).send(err);
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.write(result.rows.map((r) => { return renderClient(r); }).join('\n'));
        res.end();
    });  
});

app.listen(port, () => console.log(`Web app listening on port ${port}!`))