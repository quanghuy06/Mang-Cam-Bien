var mysql = require('mysql');
var mqtt  = require('mqtt');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname ) 
app.engine('html', require('ejs').renderFile);

var count = 0;
var client = mqtt.connect("mqtt://localhost:1883",{username:"huytq",password:"Quanghuy@123"});
var topic1 = "Topic 1";
var topic2 = "Topic 2";
var topic3 = "Topic 3";
var message="test message";
var topic_list=["home/sensors/temperature","home/sensors/humidity","home/sensors/illumination"];

console.log("connected flag  " + client.connected);


function publish(topic,msg,options){
	console.log("publishing",msg);
	
	if (client.connected == true){
		client.publish(topic,msg,options);
	}
}

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

var server = app.listen(3000, () => { //Start the server, listening on port 3000.
    console.log("Conect to requests on port 3000...");
})

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'huytq',
	password : 'Quanghuy@123',
	database : 'wsn'
});

connection.connect(function(err) {
	if (err) 
		throw err;
	console.log("mysql connected");
	var sql ="DROP TABLE IF EXISTS sensors";
	connection.query(sql, function(err, result){
		if (err) 
			throw err;
		console.log("drop tables sensors ok");
	});
	sql = "CREATE TABLE sensors( id INT(10) PRIMARY KEY  auto_increment , Sensor_ID varchar(10) not null, Date_and_Time datetime not null, Temperature int(3) not null,Humidity int(3) not null,Illumination int(3) not null)"
	connection.query(sql, function(err, result){
		if (err) 
			throw err;
		console.log("create tables sensors ok");
	});
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
app.use(express.static('public')); //Send index.html page on GET /

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});
app.get('/home', (request, response) => {
	if (request.session.loggedin) {
		  connection.query("SELECT * FROM sensors", function (err, result, fields) {
		  if (err) throw err;
		  response.sendFile(path.join(__dirname + '/index.html'));
		});
	}else {
		response.send('Please login to view this page!!');
		response.end();
	}
	
})


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
				response.send('No Connect Account!');

			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

var io = require('socket.io')(server); //Bind socket.io to our express server.

//app.use(express.static('public')); //Send index.html page on GET /

io.on('connection', (socket) => {
    console.log("Someone connected."); //show a log as a new client connects.
    var today = new Date();
	 connection.query("SELECT * FROM sensors", function (err, result, fields) {
	 if (err) throw err;
	 result.forEach(function(value) {
	 var m_time = value.Date_and_Time.toString().slice(4,24);
	console.log(m_time);
    io.sockets.emit('temp', {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:m_time , temp:value.Temperature,hum:value.Humidity,illu:value.Illumination}); 
	 });
	 
	});

	socket.on('led_status1',(data) =>{
		console.log("led status change: led1 %d",data.led);
		publish(topic1,data.led.toString(),options);
	});
	socket.on('led_status2',(data) =>{
		console.log("led status change: led2 %d",data.led);
		publish(topic2,data.led.toString(),options);
	});
	socket.on('led_pwm',(data) =>{
		console.log("led pwm change: led1 %d ",data.led1);
		publish(topic3,data.led1.toString(),options);
	});
	
})
var Temp ;
var Hum ;
var Illumination ; 

var cnt_check = 0;

client.on('message',function(topic, message, packet){
	console.log("message is "+ message);
	console.log("topic is "+ topic);
	//message = JSON.parse(message);
	if( topic == topic_list[0]){
		cnt_check ++;
		//Temp = message["Temperature"];
		Temp = message;
	}
	else if( topic == topic_list[1]){
		cnt_check ++;
		//Hum = message["Humidity"];
		Hum = message;
	}
	else if( topic == topic_list[2]){
		cnt_check ++;
		//Illumination = message["Illumination"];
		Illumination = message;
	}
	if( cnt_check == 3 ){
		cnt_check = 0;
		console.log(Temp,Hum,Illumination);

		console.log("ready to save");
		var first_name = "DHT-11";
		var Date_and_Time = new Date().toMysqlFormat(); 
		let query = "INSERT INTO `sensors` (Sensor_ID,Date_and_Time,Temperature,Humidity,Illumination) VALUES ('" +
		    first_name + "', '" + Date_and_Time + "', '" + Temp + "', '" + Hum + "', '"+ Illumination + "')";
			connection.query(query, (err, result) => {
		    if (err) {
		        throw err;
		    }
		});

    	var today = new Date();
    	io.sockets.emit(first_name, {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:Date_and_Time , temp:Temp,hum:Hum}); 
		

		 connection.query("SELECT * FROM sensors ORDER BY id DESC LIMIT 1", function (err, result, fields) {
		 if (err) throw err;
		 result.forEach(function(value) {
		 var m_time = value.Date_and_Time.toString().slice(4,24);
   		 console.log('temp', {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:m_time , temp:value.Temperature,hum:value.Humidity,illu:value.Illumination}); 
   		 io.sockets.emit('temp', {date: today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear(), time:m_time , temp:value.Temperature,hum:value.Humidity,illu:value.Illumination}); 
	 });
	 
	});
	}

});

client.on("connect",function(){	
	console.log("connected  "+ client.connected);
});

//handle errors
client.on("error",function(error){
console.log("Can't connect" + error);
process.exit(1)});

var options={
retain:true,
qos:1};

console.log("subscribing to topics");
client.subscribe(topic_list,{qos:1}); //topic list
console.log("end of script");
