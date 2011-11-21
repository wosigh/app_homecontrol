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

*Neither the name of the Enlightened Linux Solutions nor the names of its 
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

// TODO:
//
// - Add ability to search songs from the music library
// - Add ability to browse the music library
//

var exec = require('child_process').exec;

exports.setup = function(cb) {
	var child = exec("totem --help", function(error, stdout, stderr) {
		if(error)
			cb(false);
		else
			cb(true);
	});
};

exports.execute = function(req, res) {
	console.log("Executing totem command: " + req.params[0]);

	var child = exec("pgrep totem", function(error, stdout, stderr) {
		if(stdout.length > 0) {
			var execute_string = "";

			if(req.params[0] == "play") {
				var execute_string = "totem --play;";
			} else if(req.params[0] == "pause") {
				var execute_string = "totem --pause;";
			} else if(req.params[0] == "play-pause") {
				var execute_string = "totem --play-pause;";
			} else if(req.params[0] == "seek-fwd") {
				var execute_string = "totem --seek-fwd;";
			} else if(req.params[0] == "seek-bwd") {
				var execute_string = "totem --seek-bwd;";
			} else if(req.params[0] == "mute") {
				var execute_string = "totem --mute;";
			} else if(req.params[0] == "fullscreen") {
				var execute_string = "totem --fullscreen;";
			} else if(req.params[0] == "volume") {
				var execute_string = "totem --volume-" + 
					req.param("volume") + ";";
			}

			var child = exec(execute_string, function(error, stdout, stderr) {
				res.header('Content-Type', 'text/javascript');

				if(error !== null) {
					res.send('null');
				} else {
					res.send({status: "running"});
				}
			});
		} else {
			res.send({status: "closed"});
		}
	});
};