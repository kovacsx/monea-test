
var express = require("express");
var bodyParser = require("body-parser");
var uuid = require("uuid");
var path = require("path");
var mongoose = require("mongoose");

//
// Globals
//

var port = 5000;

//
// Schemas & models
//

// ToDo...


//
// Data objects
//

var userattrs = {
//	"kovacs" : {"password" : "password", "created" : "123123123", "first_name" : "K", "last_name" : "K", "id" : 1},
//	"janis" : {"password" : "123", "created" : "12312312312", "first_name" : "J", "last_name" : "Z", "id" : 2}
};

var userids = {
//	1 : "kovacs",
//	2 : "janis"
}

var sessions = {
// "123" : "1"
};


//
// Init app
//

var router = express();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//mongoose.connect("mongodb://localhost/monea-test-db");

//
// Helpers
//

function validateToken(req, res) {

	var token = req.get("Authorization");
	console.log("Token:", token);

	if(token == undefined) {
		res.status(400).json({"error" : "wrong data!"});
		return false;
	}

	if(sessions[token] == undefined) {
		res.status(404).json({"error" : "invalid token!"});
		return false;
	}

	return true;
}

function fillUserData(resp, userData) {
	resp["first_name"] = userData["first_name"];
	resp["last_name"] = userData["last_name"];
	resp["created"] = userData["created"];
	resp["id"] = userData["id"];
}

//
// Routes
//

router.post("/login", (req, res) => {

	var user = req.body.username;
	var pwd = req.body.password;

	if(user == undefined || pwd == undefined) {
		res.status(400).json({"error" : "wrong data!"});
		return;
	}

	var userData = userattrs[user];
	if(userData == undefined) {
		res.status(404).json({"error" : "user does not exist!"});
		return;
	}

	if(userData["password"] != pwd) {
		res.status(401).json({"error" : "wrong password!"});
		return;
	}

	var resp = {};

	var token = uuid.v4();
	sessions[token] = "1";

	resp["token"] = token;
	resp["username"] = user;
	fillUserData(resp, userData);

	console.log("Login -> ", resp);

	res.status(201).json(resp);
});

router.get("/users", (req, res) => {

	console.log("GET users")

	if(!validateToken(req, res)) {
		return;
	}

	var data = [];

	for(var username in userattrs) {
		var userdata = {"username" : username};
		fillUserData(userdata, userattrs[username]);
		data.push(userdata);
	}

	res.status(200).json(data);

});

router.post("/users", (req, res) => {

	console.log("POST users")

	var username = req.body.username;
	var password = req.body.password;
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;

	if(username == undefined || password == undefined) {
		res.status(400).json({"error" : "wrong data!"});
		return;
	}

	if(userattrs[username] != undefined) {
		res.status(400).json({"error" : "user exists!"});
		return;
	}

	var allIds = Object.keys(userids);

	console.log("all ids: ", allIds);

	if(allIds.length > 20) {
		res.status(400).json({"error" : "too many users!"});
		return;
	}

	var userId = 1;

	if(allIds.length > 0) {
		var lastId = parseInt(allIds[allIds.length - 1].toString());
		userId = lastId + 1;

		if(userids[userId] != undefined) {
			res.status(500).json({"error" : "cannot create user id!"});
			return;
		}
	}

	console.log("create user with id: ",userId);

	var data = {
				"password" : password, 
				"first_name" : first_name,
				"last_name" : last_name,
				"id" : userId,
				"created" : "XXXXXXXX"
	};

	userattrs[username] = data;
	userids[userId] = username;

	data["username"] = username;
	data["id"] = userId;

	res.set("Location", "/users/" + userId.toString());

	res.status(201).json(data);

});

router.get("/users/:id", (req, res) => {

	var paramId = req.params["id"];
	console.log("GET user by id: ", paramId);

	if(!validateToken(req, res)) {
		return;
	}

	var userName = userids[paramId];

	if(userName == undefined) {
		res.status(404).json({"error" : "user id does not exist!"});
		return;
	}

	var userAttr = userattrs[userName];

	if(userAttr == undefined) {
		res.status(404).json({"error" : "user data does not exist!"});
		return;
	}

	var userData = {"username" : userName};
	fillUserData(userData, userAttr);
	res.status(200).json(userData);
});

router.delete("/users/:id", (req, res) => {
	var paramId = req.params["id"];
	console.log("Delete user by id: ", paramId);

	if(!validateToken(req, res)) {
		return;
	}

	var userName = userids[paramId];

	if(userName != undefined) {
		delete userattrs[userName];
	}

	delete userids[paramId];

	res.status(204);
	res.end();

});

//
// Run app
//

router.listen(port, () => {
  console.log("Example app listening on port: ", port);
});