
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// PostgreSVG Connect String
const connectionString = "postgres://luciancooper:password@localhost:5432/gvdelivery";

const pool = new Pool({
    connectionString: connectionString
});

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

(function(){
    function wipeDatabase(callback) {
        let sql = `
        DROP TABLE IF EXISTS orders,restaurants,users;
        DROP TYPE IF EXISTS CUISINE;
        `;
        executeQuery(function(result,err) {
            if (err) console.log(`Error Wiping Database: ${err}`);
            callback(!err);
        },sql.trim());
    }
    function createDatabase(callback) {
        let sql = `
        CREATE TYPE CUISINE AS ENUM ('American','Cajun','Caribbean','Chinese','French','German','Greek','Indian','Italian','Japanese','Korean','Lebanese','Mediterranean','Mexican','Moroccan','Seafood','Soul','Spanish','Thai','Turkish','Vegetarian','Vietnamese');
        CREATE TABLE IF NOT EXISTS users (
            id serial PRIMARY KEY,
            username VARCHAR(30) NOT NULL UNIQUE,
            password TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS restaurants (
            user_id integer NOT NULL UNIQUE REFERENCES users(id),
            name VARCHAR(30) NOT NULL,
            cuisine CUISINE NOT NULL,
            address jsonb NOT NULL
        );
        CREATE TABLE IF NOT EXISTS orders (
            id serial PRIMARY KEY,
            restaurant_id integer NOT NULL REFERENCES restaurants(user_id),
            delivery_address jsonb NOT NULL,
            price money NOT NULL,
            prepaid boolean NOT NULL,
            time_placed timestamp with time zone NOT NULL,
            time_ready timestamp with time zone NOT NULL,
            time_expected timestamp with time zone NOT NULL,
            time_delivered timestamp with time zone
        );
        `;
        executeQuery(function(result,err) {
            if (err) console.log(`Error Creating Database: ${err}`);
            callback(!err);
        },sql.trim());
    }
    executeQuery(function(result,err) {
        if (err) console.log(`Error Querying Database Tables: ${err}`);
        let tables = result.rows.map((e) => { return e.tablename; });
        if (tables.length !== 3) {
            console.log("Wiping Database...");
            wipeDatabase((complete) => {
                if (!complete) return;
                createDatabase((complete) => {
                    console.log("Setting Up Database...")
                    if (!complete) return;
                    console.log("Database Setup Complete");
                });
            })
        }
    },`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'`);
}());

const db = (function(){
    return {
        executeQuery:executeQuery,
        checkUsername: function(username,callback) {
            executeQuery(function(result,err) {
                callback((result && result.rows.length > 0) ? result.rows[0] : null,err);
            },`SELECT * FROM users WHERE username = '${username}'`);
        },
        registerAccount:function(data,callback) {
            // Check if username is taken
            this.checkUsername(data.username,function(user,err) {
                if (err) return callback(null,err);
                if (user) {
                    // Username is taken
                    return callback({
                        success:false,
                        message:"Username is taken",
                        username:data.username,
                        name:data.name,
                        cuisine:data.cuisine,
                        address: data.address
                    });
                }
                var hash = bcrypt.hashSync(data.password, saltRounds);
                // Create new row in 'users' table
                executeQuery(function(result,err) {
                    if (err) return callback(null,err);
                    let id = (result && result.rows.length > 0) ? result.rows[0].id : null;
                    // Custom Error 
                    if (!id) return callback(null,"Error creating user");
                    // Create new row in restaurant table
                    executeQuery(function(result,err) {
                        if (err) return callback(null,err);
                        callback({ success:true, id:id });
                    },`INSERT INTO restaurants(user_id, name, cuisine, address) VALUES (${id},'${data.name}', '${data.cuisine}', '${JSON.stringify(data.address)}')`);
                },`INSERT INTO users(username, password) VALUES ('${data.username}', '${hash}') RETURNING id`);
            });
        },
        checkLogin:function(data,callback) {
            this.checkUsername(data.username,function(user,err) {
                if (err) return callback(null,err);
                if (!user) {
                    return callback({
                        success:false,
                        message:"Invalid Username",
                    });
                }
                if (!bcrypt.compareSync(data.password, user.password)) {
                    return callback({
                        success:false,
                        message:"Incorrect Password",
                    });
                }
                return callback({
                    success:true,
                    id:user.id
                });
            });
        },
        getRestaurantName:function(id,callback) {
            executeQuery(function(result,err) {
                callback((result && result.rows.length > 0) ? result.rows[0].name : null,err);
            },`SELECT name FROM restaurants WHERE user_id = ${id}`);
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
            },`SELECT name FROM restaurants WHERE user_id = ${id}`);
        },
        getAdminData:function(callback) {
            executeQuery((users,err) => {
                if (err) return callback(null,err);
                executeQuery((orders,err) => {
                    if (err) return callback(null,err);
                    callback({
                        users:users.rows,
                        orders:orders.rows
                    });
                },'SELECT o.id, r.name, o.delivery_address, o.price, o.prepaid, o.time_placed, o.time_ready, o.time_expected, o.time_delivered FROM orders o INNER JOIN restaurants r ON (o.restaurant_id = r.user_id)');
            },'SELECT u.id, u.username, u.password, r.name, r.cuisine, r.address FROM users u INNER JOIN restaurants r ON (u.id = r.user_id)');
        },
    };
}());

module.exports = db;
