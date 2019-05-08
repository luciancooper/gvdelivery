
const { Pool, Client } = require('pg');

// PostgreSVG Connect String
// const connectionString = "postgres://luciancooper:password@localhost:5432/gvdelivery";
const connectionString = "postgres://colgworld:password@172.21.0.2:54320/GVDeliveryPostgresDB";


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
        getOrders:function(id,callback) {
            executeSelect(callback,`SELECT delivery_address, price, prepaid, time_placed, time_ready, time_expected, time_delivered FROM orders WHERE restaurant_id = ${id}`);
        },
        getOrdersAdmin:function(callback) {
            executeSelect(callback,'SELECT o.id, r.name, o.delivery_address, o.price, o.prepaid, o.time_placed, o.time_ready, o.time_expected, o.time_delivered FROM orders o INNER JOIN restaurants r ON (o.restaurant_id = r.client_id)');
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
        },
        createOrder:function(data,callback) {
            pool.connect(function(err,client,done) {
                if (err) {
                    console.log("Unable to connect to PostgreSQL: "+ err);
                    return callback(err);
                }
                let sql = `INSERT INTO orders(restaurant_id, delivery_address, price, prepaid, time_placed, time_ready, time_expected) VALUES (${data.id},'${data.address}', '${data.price}', ${data.prepaid}, '${data.time_placed}','${data.time_ready}','${data.time_expected}')`;
                client.query(sql,function(err,result) {
                    done(); // release client back to pool
                    if (err) {
                        console.log("Error running query: "+err);
                        return callback(err);
                    }
                    return callback();
                });
            });
        },
        completeOrder:function(id,timestamp,callback) {
            timestamp = this.formatTimeString(new Date(timestamp));
            pool.connect(function(err,client,done) {
                if (err) {
                    console.log("Unable to connect to PostgreSQL: "+ err);
                    return callback(err);
                }
                client.query(`UPDATE orders SET time_delivered = '${timestamp}' WHERE id = ${id}`,function(err,result) {
                    done(); // release client back to pool
                    if (err) {
                        console.log("Error running query: "+err);
                        return callback(err);
                    }
                    return callback();
                });
            });
        },
        // @param {Date} date - A date object instance
        formatTimeString: function(date) {
            let ts = /(\d{2}:\d{2}:\d{2}) \w+([+\-]\d{2})/.exec(date.toTimeString());
            let time = ts[1],tz = ts[2];
            let d = date.getDate(),m = date.getMonth()+1,y = date.getFullYear();
            return `${y}-${m>9?m:'0'+m}-${d>9?d:'0'+d} ${time}${tz}`;
        },
    };
}());

module.exports = db;
