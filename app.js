const express = require('express');
const pg = require('pg');
const app = express();
const port = 3000;

// PostgreSVG Connect String
const dbConnect = "postgres://lucian:password@localhost:5432/gvdelivery";

function queryClients(callback) {
    pg.connect(dbConnect,function(err,client,done) {
        if(err){
            console.log("Unable to connect to PostgreSQL: "+ err);
            callback(null,err);
        }
        client.query('SELECT restaurant_name,restaurant_cuisine,address FROM clients',function(err,result) {
            done(); // closing the connection;
            if (err) {
                console.log("Error occured during SQL Query: "+err);
                callback(null,err);
            }
            callback(result.rows);
        });
    });
};

const pool = new pg.Pool({
    user: 'lucian',
    host: '127.0.0.1',
    database: 'gvdelivery',
    password: 'password',
    port: '5432'
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
            callback(result.rows);
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
        res.write(result.map((r) => { return renderClient(r); }).join('\n'));
        res.end();
    });  
});

app.listen(port, () => console.log(`Web app listening on port ${port}!`))