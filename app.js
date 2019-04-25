const express = require('express');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const app = express();
const port = 3000;

// Setup Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Setup Views & View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// Add Body Parser
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());


// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) res.clearCookie('user_sid');        
    next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) res.redirect('/dashboard');
    else next();
};

// route for home page
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/home');
});

// route for restuarant registration
app.route('/register').get(sessionChecker, (req, res) => {
    res.render('register');
}).post((req, res) => {
    // Handle Registration
    let data = {
        username:req.body.username,
        password:req.body.password,
        name:req.body.name,
        cuisine:req.body.cuisine,
        address:`{"Address":"${req.body.address}","City":"${req.body.city}","State":"${req.body.state}","Zip":"${req.body.zip}"}`
    };
    console.log(`username:'${data.username}'`);
    console.log(`password:'${data.password}'`);
    console.log(`name:'${data.name}'`);
    console.log(`cuisine:'${data.cuisine}'`);
    console.log(`address:'${data.address}'`);

    db.checkUsername(data.username,function(user,err) {
        if (err) return res.status(400).send(err);
        if (user) return res.redirect('/register');
        var hash = bcrypt.hashSync(data.password, saltRounds);
        console.log(`hashed password:'${hash}'`);
        db.createUser(data.username,hash,function(id,err) {
            if (err) return res.status(400).send(err);
            if (!id) return res.status(400).send("Error creating user");
            console.log(`user id:${id}`);
            db.createRestaurant(id,{name:data.name,cuisine:data.cuisine,address:data.address},function(err) {
                if (err) return res.status(400).send(err);
                req.session.user = id;
                res.redirect('/dashboard');
            });
        });
    });
});

// route for user Login
app.route('/login').get(sessionChecker, (req, res) => {
    let data = req.session.login_data || {};
    res.render('login',{message:(data.message || ''),username:data.username});
    delete req.session.login_data;
}).post((req, res) => {
    // Handle Login
    let data = {
        username:req.body.username,
        password:req.body.password
    };
    //console.log(`Handling Login -> username:'${data.username}' password:'${data.password}'`)
    db.checkUsername(data.username,function(user,err){
        if (err) return res.status(400).send(err);
        if (!user) {
            req.session.login_data = {message:"No Username Found",username:data.username};
            return res.redirect('/login');
        }
        if (bcrypt.compareSync(data.password, user.password)) {
            req.session.user = user.id;
            return res.redirect('/dashboard');
        } else {
            req.session.login_data = {message:"Incorrect Password",username:data.username};
            return res.redirect('/login');
        }
    });
});

// route for user's dashboard
app.get('/dashboard', (req, res) => {
    console.log(`req.session.user:'${req.session.user}' req.cookies.user_sid:'${req.cookies.user_sid}'`)
    if (req.session.user && req.cookies.user_sid) {
        db.getRestaurantName(req.session.user,function(name,err) {
            if (err) return res.status(400).send(err);
            res.render('dashboard',{name:name});
        });
    } else res.redirect('/login');
});

// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else res.redirect('/login');
});


app.get('/admin', function (req, res) {
    db.selectRestaurants(function(rows,err) {
        if (err) return res.status(400).send(err);
        res.render('admin',{'rows':rows});
    });
});

app.get('/home', function (req, res) {
    res.render('home');
});

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!")
});

app.listen(port, () => console.log(`Web app listening at localhost:${port}`))