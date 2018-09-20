const express = require('express'),
    path = require('path'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    errorhandler = require('errorhandler'),
    mongoose = require('mongoose'),
    passport = require('passport');

mongoose.Promise = require('bluebird');

const isProduction = process.env.NODE_ENV === 'production';

console.log("Is production?", isProduction);

const app = express();
const MongoStore = require('connect-mongo')(session);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(session({
    store: new MongoStore({
        host: '127.0.0.1',
        port: '27017',
        db: 'session',
        url: 'mongodb://127.0.0.1:27017/session'
    }),
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false,
    secret: 'picturesque--super--secret'
}));
app.use(passport.initialize());
app.use(passport.session());

if (!isProduction) {
    app.use(errorhandler());
}

if(isProduction){
    mongoose.connect(process.env.MONGODB_URI, {
        useMongoClient: true
    });
} else {
    /*mongoose.connect('mongodb://mongodb:27017/picturesque', {
        useMongoClient: true,
    });*/
    mongoose.connect('mongodb://localhost:27017/picturesque');
    mongoose.set('debug', true);
}

require('./models/User');
require('./models/Picture');
require('./config/passport');
const http = require("http");

app.use(require('./routes'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
    app.use(function(err, req, res, next) {
        console.log(err.stack);

        res.status(err.status || 500);

        res.json({'errors': {
                message: err.message,
                error: err
            }});
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({'errors': {
            message: err.message,
            error: {}
        }});
});

let server = http.createServer(app).listen( process.env.PORT || 3000, function(){
    console.log('Listening on port ' + server.address().port);
});
