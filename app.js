const express = require('express');
const path = require('path');
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

// Setup Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Setup Views & View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('dashboard');
});


app.get('/admin', function (req, res) {
    queryClientsFromPool(function(result,err) {
        if (err) {
            res.status(400).send(err);
            return;
        }
        res.render('admin', {'results':result.rows});
    });  
});

app.listen(port, () => console.log(`Web app listening on port ${port}!`))