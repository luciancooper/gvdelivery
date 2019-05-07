const express = require('express');
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());


// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'keyboard_Cat',
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

app.use('/api',require('./api'));

// route for home page
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/home');
});

// route for restuarant registration
app.route('/register').get(sessionChecker, (req, res) => {
    //if (req.session.params) console.log(`/register params:{${JSON.stringify(req.session.params)}}`);
    res.render('register',Object.assign({
        message:'',
        username:undefined,
        name:undefined,
        cuisine:undefined,
        address: { Address:undefined, City:"New York", State:"NY", Zip:undefined }
    }, req.session.params || {}));
    delete req.session.params;
}).post((req, res) => {
    // Handle Registration
    let data = {
        username:req.body.username,
        password:req.body.password,
        name:req.body.name,
        cuisine:req.body.cuisine,
        address: {
            Address:req.body.address,
            City:req.body.city,
            State:req.body.state,
            Zip:req.body.zip
        }
    };
    db.registerAccount(data,(result,err) => {
        if (err) return res.status(400).send(err);
        if (result.success) {
            req.session.user = result.id;
            return res.redirect('/dashboard');
        }
        delete result.success;
        req.session.params = result;
        return res.redirect('/register');
    });
});

// route for user Login
app.route('/login').get(sessionChecker, (req, res) => {
    //if (req.session.params) console.log(`/login params:{${JSON.stringify(req.session.params)}}`);
    res.render('login',Object.assign({
        message:'',
        username:undefined
    }, req.session.params || {}));
    delete req.session.params;
}).post((req, res) => {
    // Handle Login
    let data = {
        username:req.body.username,
        password:req.body.password
    };
    db.checkLogin(data,(result,err) => {
        if (err) return res.status(400).send(err);
        if (result.success) {
            req.session.user = result.id;
            return res.redirect('/dashboard');
        }
        req.session.params = { message:result.message, username:data.username };
        return res.redirect('/login');
    });
});

// route for user's dashboard
app.route('/dashboard').get((req, res, next) => {
    if (!(req.session.user && req.cookies.user_sid)) res.redirect('/login');
    else next();
},(req, res) => {
    //if (req.session.params) console.log(`/dashboard params:{${JSON.stringify(req.session.params)}}`);
    db.getDashboard(req.session.user,function(data,err) {
        if (err) return res.status(400).send(err);
        res.render('dashboard',Object.assign({ tab:undefined }, data, req.session.params || {}));
        delete req.session.params;
    });
}).post((req, res) => {
    // Handle New Order
    let ts_placed = Date.now(),
        ts_ready = ts_placed+(req.body.preptime*60000),
        ts_expected = ts_ready+(20*60000);
    let data = {
        id:req.session.user,
        address:JSON.stringify({Address:req.body.address,City:req.body.city,State:req.body.state,Zip:req.body.zip}),
        time_placed:db.formatTimeString(new Date(ts_placed)),
        time_ready:db.formatTimeString(new Date(ts_ready)),
        time_expected:db.formatTimeString(new Date(ts_expected)),
        price:req.body.price,
        prepaid:(req.body.prepaid || 'FALSE'),
    };
    db.createOrder(data,(err) => {
        if (err) return res.status(400).send(err);
        req.session.params = {tab:'current_deliveries'};
        res.redirect('/dashboard');
    });
});

// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else res.redirect('/login');
});


app.route('/admin').get((req, res) => {
    //if (req.session.params) console.log(`/admin params:${JSON.stringify(req.session.params)}`);
    db.getAdminData((result,err) => {
        if (err) return res.status(400).send(err);
        res.render('admin',Object.assign({tab:undefined}, result, req.session.params || {}));
        delete req.session.params;
    });
}).post((req, res) => {
    // Handle Order Completion
    db.completeOrder(req.body.orderid,Date.now(),(err) => {
        if (err) return res.status(400).send(err);
        req.session.params = {tab:'current_deliveries'};
        res.redirect('/admin');
    });
});

app.get('/home', (req, res) => {
    res.render('home');
});

// route for handling 404 requests(unavailable routes)
app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!")
});

app.listen(port, () => console.log(`Web app listening at localhost:${port}`))