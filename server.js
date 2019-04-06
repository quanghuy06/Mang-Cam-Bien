var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname ) 
app.engine('html', require('ejs').renderFile);

var jsonArray = [];
var name = [];
var temp = [];
var hum = [];

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'huynam',
	database : 'thcsb4'
});


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use((request, response, next) => {
  console.log(request.headers)
  next()
})

app.use((request, response, next) => {
  request.chance = Math.random()
  next()
})


app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');

			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});


app.get('/home', (request, response) => {
	if (request.session.loggedin) {
		  connection.query("SELECT * FROM sensors", function (err, result, fields) {
		  if (err) throw err;
  		  response.render( "./charjs_test.html", {name:JSON.stringify(result)});
		  console.log(JSON.stringify(result));
				  
		});
	}else {
		response.send('Please login to view this page!!');
		response.end();
	}
	
})

app.listen(3000);
