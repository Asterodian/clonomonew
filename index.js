const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compression = require('compression');

app.use(compression({
level: 5,
threshold: 0,
filter: (req, res) => {
if (req.headers['x-no-compression']) {
return false;
}
return compression.filter(req, res);
}
}));

app.set('view engine', 'ejs');
app.set('trust proxy', 1);
app.use(function (req, res, next) {
res.header('Access-Control-Allow-Origin', '*');
res.header(
'Access-Control-Allow-Headers',
'Origin, X-Requested-With, Content-Type, Accept',
);
console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url} - ${res.statusCode}`);
next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Remove rate limiter since it's causing issues with login.
app.use((req, res, next) => {
next();
});

let storedToken = null; // Variable to store token temporarily

// Route to handle the login form and dashboard
app.all('/player/login/dashboard', function (req, res) {
const tData = {};
try {
const uData = JSON.stringify(req.body).split('"')[1].split('\\n');
const uName = uData[0].split('|');
const uPass = uData[1].split('|');
for (let i = 0; i < uData.length - 1; i++) {
const d = uData[i].split('|');
tData[d[0]] = d[1];
}
if (uName[1] && uPass[1]) {
res.redirect('/player/growid/login/validate');
}
} catch (why) { console.log(`Warning: ${why}`); }

res.render(__dirname + '/public/html/dashboard.ejs', { data: tData });
});

// Route to validate login and generate a token
app.all('/player/growid/login/validate', (req, res) => {
const _token = req.body._token;
const growId = req.body.growId;
const password = req.body.password;

const token = Buffer.from(
`_token=${_token}&growId=${growId}&password=${password}`,
).toString('base64');

// Store the token for later validation (in a real app, use a session or database)
storedToken = token;

res.send(
`{"status":"success","message":"Account Validated.","token":"${token}","url":"","accountType":"growtopia"}`,
);
});

// Route to check the token and allow login if valid
app.all('/player/growid/checktoken', (req, res) => {
const refreshToken = req.body.token;  // Expecting a token in the request body

if (storedToken && storedToken === refreshToken) {
// Token is valid, allow login
res.send({
status: "success",
message: "Token validated. Login successful.",
token: refreshToken,
url: "",
accountType: "growtopia"
});
} else {
// Invalid token
res.status(400).send({
status: "error",
message: "Invalid or expired token.",
});
}
});


app.get('/', function (req, res) {
res.send('Hello World!');
});

app.listen(5000, function () {
console.log('Listening on port 5000');
});
