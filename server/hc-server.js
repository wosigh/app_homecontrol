#!/usr/bin/node

/*

BSD LICENSED

Copyright (c) 2011, Janne Julkunen
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, 
this list of conditions and the following disclaimer in the documentation 
and/or other materials provided with the distribution.

* Neither the name of the Enlightened Linux Solutions nor the names of its 
contributors may be used to endorse or promote products derived from this 
software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.

*/

var addr = "127.0.0.1";

var port_ssd = 1900;
var port_http = 3000;

var os = require("os");
var net = require('net');
var dgram = require('dgram');
var express = require('express');
var form = require('connect-form');

var hcdata = require('./lib/data-types.js');

var loaded = [];

var modules = ["app/banshee", "app/frontrow", "app/itunes", "app/mpd", 
	"app/quicktime", "app/rhythmbox", "app/totem",
	"sys/1-wire", "sys/input", "sys/sound"/*, "sys/surveillance"*/];

//
// HANDLE ARGUMENTS
//

if(process.argv.length > 2) {
	switch(process.argv[2]) {
		case "-p":
			if((!process.argv[3]) || (isNaN(parseInt(process.argv[3])))) {
				console.log("The given port number is not a valid number!");
				return;
			} else {
				port_http = parseInt(process.argv[3]);
			}

			if((process.argv[4]) && (!isNaN(parseInt(process.argv[4])))) {
				port_ssd = parseInt(process.argv[4]);
			}
			break;
	
		case "-h":
		default:
			console.log("Usage: hc-server.js -h | -p <http_port> [<ssd_port>]");
			return;
	}	
}

console.log("Home Control server: starting");
console.log("Listening on a port: " + port_http);
console.log("SSD listening port: " + port_ssd);

//
// CREATE SSD SERVER
//

var socket = net.createConnection(80, 'www.google.com');

socket.on('connect', function() {

	addr = socket.address().address;

	var ssd_srv = dgram.createSocket("udp4");

	ssd_srv.on("message", function (msg, rinfo) {
		console.log("Received SSD message: " + rinfo.address + ":" + rinfo.port);
	
		if(msg.slice(0, 8) == "M-SEARCH") {
			var message = new Buffer(
				"HTTP/1.1 200 OK\r\n" +
				"LOCATION: http://" + addr + ":" + port_http + "/\r\n" +
				"SERVER: Home Control\r\n" +
				"ST: " +
				"EXT: " +
				"\r\n"
			);

			console.log("Sending SSD message: " + addr + ":" + port_http);

			var client = dgram.createSocket("udp4");

			client.send(message, 0, message.length, rinfo.port, rinfo.address);
			
			client.close();
		}
	});

	ssd_srv.bind(port_ssd);

	try {
		ssd_srv.addMembership('239.255.255.250');
	} catch (error) {
		console.log("Automatic discovery: disabled");
	}

	socket.end();
});

//
// CREATE HTTP SERVER
//

var http_srv = express.createServer(
	form({ keepExtensions: true })
);

http_srv.get("/modules", function(req, res) {
	res.send({request: req.param("id"), modules: loaded});
});

//
// SETUP HTTP MODULES
//

for(var i = 0; i < modules.length; i++) {
	var osType = os.type().toLowerCase();

	var module = require("./lib/" + modules[i]);

	module.setup(function(module, moduleCategory, moduleID, moduleName, moduleType) {
		if((moduleID) && (moduleName) && (moduleCategory)) {
			console.log("Loading " + moduleCategory + " module: " + moduleName);

			http_srv.get("/" + moduleID + "/*", function(moduleExecute, req, res) {
				// Make sure that the request is still a live

				try { var addr = req.socket.address().address; } catch(error) { return; }

				var url = {command: req.params[0], arguments: function(arg) {
					return req.param(arg);
				}};

				moduleExecute(function(moduleID, moduleState, statusObject) {
					res.header('Content-Type', 'text/javascript');

					if(req.param("refresh" == "true"))
						statusObject.reset(addr);
					
					res.send(statusObject.getStatus(addr, moduleState));
				}, url, addr);
			}.bind(this, module.execute));

			http_srv.post("/" + moduleID + "/*", function(moduleExecute, req, res) {
				// Make sure that the request is still a live

				try { var addr = req.socket.address().address; } catch(error) { return; }

				var url = {command: req.params[0], arguments: function(arg) {
					return req.param(arg);
				}};

				moduleExecute(function(moduleID, moduleState, statusObject) {
					res.header('Content-Type', 'text/javascript');

					if(req.param("refresh" == "true"))
						statusObject.reset(addr);

					res.send(statusObject.getStatus(addr, moduleState));
				}, url, addr);
			}.bind(this, module.execute));

			loaded.push({id: moduleID, name: moduleName, type: moduleType,
				category: moduleCategory, platform: osType});
		}	
	}.bind(this, module, modules[i].slice(0, 3)), osType);
}

http_srv.listen(port_http);

