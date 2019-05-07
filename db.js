
const { Pool } = require('pg');

// PostgreSVG Connect String
const connectionString = "postgres://luciancooper:password@localhost:5432/gvdelivery";

const pool = new Pool({
    connectionString: connectionString
});

const db = (function(){
    function executeQuery(callback,sql) {
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
                } else callback(result);
            });
        });
    };

    return {
        executeQuery:executeQuery,
        selectUsers: function(callback) {
            executeQuery(callback,'SELECT id, username, password FROM users');
        },
        selectRestaurants:function(callback) {
            executeQuery(callback,'SELECT u.id, u.username, u.password, r.name, r.cuisine, r.address FROM users u INNER JOIN restaurants r ON (u.id = r.client_id)');
        },
        getOrders:function(id,callback) {
            executeQuery(callback,`SELECT delivery_address, price, prepaid, time_placed, time_ready, time_expected, time_delivered FROM orders WHERE restaurant_id = ${id}`);
        },
        getOrdersAdmin:function(callback) {
            executeQuery(callback,'SELECT o.id, r.name, o.delivery_address, o.price, o.prepaid, o.time_placed, o.time_ready, o.time_expected, o.time_delivered FROM orders o INNER JOIN restaurants r ON (o.restaurant_id = r.client_id)');
        },
        checkUsername: function(username,callback) {
            executeQuery(function(result,err) {
                callback((result && result.rows.length > 0) ? result.rows[0] : null,err);
            },`SELECT * FROM users WHERE username = '${username}'`);
        },
        createUser:function(username,hashed_password,callback) {
            executeQuery(function(result,err) {
                callback((result && result.rows.length > 0) ? result.rows[0].id : null,err);
            },`INSERT INTO users(username, password) VALUES ('${username}', '${hashed_password}') RETURNING id`);
        },
        createRestaurant:function(id,data,callback) {
            executeQuery(function(result,err) {
                callback(err);
            },`INSERT INTO restaurants(client_id, name, cuisine, address) VALUES (${id},'${data.name}', '${data.cuisine}', '${data.address}')`);
        },
        getRestaurantName:function(id,callback) {
            executeQuery(function(result,err) {
                callback((result && result.rows.length > 0) ? result.rows[0].name : null,err);
            },`SELECT name FROM restaurants WHERE client_id = ${id}`);
        },
        createOrder:function(data,callback) {
            executeQuery(function(result,err) {
                callback(err);
            },`INSERT INTO orders(restaurant_id, delivery_address, price, prepaid, time_placed, time_ready, time_expected) VALUES (${data.id},'${data.address}', '${data.price}', ${data.prepaid}, '${data.time_placed}','${data.time_ready}','${data.time_expected}')`);
        },
        completeOrder:function(id,timestamp,callback) {
            executeQuery(function(result,err) {
                callback(err);
            },`UPDATE orders SET time_delivered = '${this.formatTimeString(new Date(timestamp))}' WHERE id = ${id}`);
        },
        // @param {Date} date - A date object instance
        formatTimeString: function(date) {
            let ts = /(\d{2}:\d{2}:\d{2}) \w+([+\-]\d{2})/.exec(date.toTimeString());
            let time = ts[1],tz = ts[2];
            let d = date.getDate(),m = date.getMonth()+1,y = date.getFullYear();
            return `${y}-${m>9?m:'0'+m}-${d>9?d:'0'+d} ${time}${tz}`;
        },
        getDashboard:function(id,callback) {
            executeQuery(function(result,err) {
                if (err) return callback(null,err);
                let name = (result && result.rows.length > 0) ? result.rows[0].name : null;
                executeQuery(function(result,err) {
                    if (err) return callback(null,err);
                    callback({ name:name, orders:result.rows });
                },`SELECT delivery_address, price, prepaid, time_placed, time_ready, time_expected, time_delivered FROM orders WHERE restaurant_id = ${id}`);
            },`SELECT name FROM restaurants WHERE client_id = ${id}`);
        }
    };
}());

module.exports = db;
