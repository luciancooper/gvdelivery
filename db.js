
const { Pool, Client } = require('pg');

// PostgreSVG Connect String
const connectionString = "postgres://luciancooper:password@localhost:5432/gvdelivery";

const pool = new Pool({
    connectionString: connectionString
});

const db = (function(){
    function executeSelect(callback,sql) {
        pool.connect(function(err,client,done) {
            if (err) {
                console.log("Unable to connect to PostgreSQL: "+ err);
                callback(null,err);
            }
            client.query(sql,function(err,result) {
                done(); // release client back to pool
                if (err) {
                    console.log("Error running query: "+err);
                    callback(null,err);
                } else callback(result.rows);
            });
        });
    }
    return {
        selectUsers: function(callback) {
            executeSelect(callback,'SELECT id, username, password FROM users');
        },
        selectRestaurants:function(callback) {
            executeSelect(callback,'SELECT u.id, u.username, u.password, r.name, r.cuisine, r.address FROM users u INNER JOIN restaurants r ON (u.id = r.client_id)');
        },
        checkUsername: function(username,callback) {
            pool.connect(function(err,client,done) {
                if (err) {
                    console.log("Unable to connect to PostgreSQL: "+ err);
                    callback(null,err);
                    return;
                }
                client.query(`SELECT * FROM users WHERE username = '${username}';`,function(err,result) {
                    done(); // release client back to pool
                    if (err) {
                        console.log("Error running query: "+err);
                        return callback(null,err);
                    }
                    if (result.rows.length === 0) {
                        return callback(null);
                    }
                    callback(result.rows[0]);
                });
            });
        },
        createUser:function(username,hashed_password,callback) {
            pool.connect(function(err,client,done) {
                if (err) {
                    console.log("Unable to connect to PostgreSQL: "+ err);
                    callback(null,err);
                    return;
                }
                client.query(`INSERT INTO users(username, password) VALUES ('${username}', '${hashed_password}') RETURNING id`,function(err,result) {
                    done(); // release client back to pool
                    if (err) {
                        console.log("Error running query: "+err);
                        return callback(null,err);
                    }
                    if (result.rows.length === 0) {
                        return callback(null);
                    }
                    callback(result.rows[0].id);
                });
            });
        },
        createRestaurant:function(id,data,callback) {
            pool.connect(function(err,client,done) {
                if (err) {
                    console.log("Unable to connect to PostgreSQL: "+ err);
                    return callback(err);
                }
                client.query(`INSERT INTO restaurants(client_id, name, cuisine, address) VALUES (${id},'${data.name}', '${data.cuisine}', '${data.address}')`,function(err,result) {
                    done(); // release client back to pool
                    if (err) {
                        console.log("Error running query: "+err);
                        return callback(err);
                    }
                    return callback();
                });
            });
        },
        getRestaurantName:function(id,callback) {
            pool.connect(function(err,client,done) {
                if (err) {
                    console.log("Unable to connect to PostgreSQL: "+ err);
                    return callback(null,err);
                }
                client.query(`SELECT name FROM restaurants WHERE client_id = ${id}`,function(err,result) {
                    done(); // release client back to pool
                    if (err) {
                        console.log("Error running query: "+err);
                        return callback(null,err);
                    }
                    return callback(result.rows[0].name);
                });
            });
        }
    };
}());

module.exports = db;
