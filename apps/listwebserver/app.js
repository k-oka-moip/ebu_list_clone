const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const url = require('url');
const bodyParser = require('body-parser');
const { promisify } = require('util');
const child_process = require('child_process');
const api = require('./api');
const auth = require('./auth');
const { apiErrorHandler, resourceNotFoundHandler, isAuthenticated } = require('./util/express-middleware');
const programArguments = require('./util/programArguments');
const logger = require('./util/logger');

const app = express();

// Initialize the REST API logger
app.use(morgan('short', { stream: logger('rest-api').restAPILogger }));

logger('static-generator').info('CORS:', programArguments.webappDomain);

// User custom middleware in order to set the Access-Control-Allow-Credentials as true.
const getWhitelist = () => {
    var _webappDomain = url.parse(programArguments.webappDomain);

    logger('static-generator').info('web app domain:', _webappDomain);

    if (!_webappDomain.port || 0 === _webappDomain.port.length) {
        return [
            programArguments.webappDomain,
            _webappDomain.hostname,
            _webappDomain.protocol + '//' + _webappDomain.hostname,
        ];
    } else if (_webappDomain.port == 80 || _webappDomain.port == 443) {
        return [
            programArguments.webappDomain,
            _webappDomain.hostname,
            _webappDomain.hostname + ':' + _webappDomain.port,
            _webappDomain.protocol + '//' + _webappDomain.hostname + ':' + _webappDomain.port,
        ];
    } else {
        return [
            programArguments.webappDomain,
            _webappDomain.hostname + ':' + _webappDomain.port,
            _webappDomain.protocol + '//' + _webappDomain.hostname + ':' + _webappDomain.port,
        ];
    }
};

const whitelist = getWhitelist();
logger('static-generator').info('whitelist:', whitelist);

app.use(
    cors({
        origin: function(origin, callback) {
            if (whitelist.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS. ' + origin + ' != ' + programArguments.webappDomain));
            }
        },
        credentials: true,
    })
);

//Helmet protects the express web servers from some well-known web vulnerabilities
app.use(helmet());

app.use(bodyParser.json());

app.use(cookieParser());

app.use(
    session({
        secret: programArguments.cookieSecret,
        resave: true,
        saveUninitialized: true,
        rolling: true,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (in milliseconds)
        },
    })
);

auth(app);

// API Router
app.use('/api/', isAuthenticated, api);
logger('app').info('API initialized');

// Handles with the 404 Not Found
app.use(resourceNotFoundHandler);

// Handles API Error and send a specific error code for the API Rest Consumer instead of the
// stack trace message. Those kind of information should propagated to the logger.
app.use(apiErrorHandler);

// Generate static config data when the LIST web server is executed.
const generateStaticConfigCommand = `"${programArguments.cpp}/static_generator" "${programArguments.folder}"`;

logger('static-generator').profile('Static configurations generated');

// Promisify execute command
const exec = promisify(child_process.exec);
exec(generateStaticConfigCommand)
    .then(output => {
        logger('static-generator').info(`Generated static configurations: ${output.stdout}`);
    })
    .catch(output => {
        logger('static-generator').error(output.stderr);
    })
    .then(() => {
        logger('static-generator').profile('Static configurations generated');
    });

module.exports = app;
