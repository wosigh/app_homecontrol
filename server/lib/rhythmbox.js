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
// - Configurable favorites list
//

var exec = require('child_process').exec;

var favorites = '[{"name": "Goth Metal World", "type": "Radio", "url": "http://85.200.99.56:7999/listen.pls"},' +
	'{"name": "Amorphis - Skyforger", "type": "Song", "url": "/home/sconix/Music/Amorphis/Skyforger/01 - Sampo.mp3"}]';

exports.setup = function(cb) {
	var child = exec("rhythmbox --help", function(error, stdout, stderr) {
		if(error)
			cb(false);
		else
			cb(true);
	});
};

exports.execute = function(req, res) {
	console.log("Executing rhythmbox command: " + req.params[0]);

	var execute_string = "";

	if(req.params[0] == "play") {
		var execute_string = "rhythmbox-client --play;";
	} else if(req.params[0] == "pause") {
		var execute_string = "rhythmbox-client --pause;";
	} else if(req.params[0] == "next") {
		var execute_string = "rhythmbox-client --next;";
	} else if(req.params[0] == "prev") {
		var execute_string = "rhythmbox-client --previous;";
	} else if(req.params[0] == "mute") {
		var execute_string = "rhythmbox-client --mute;";
	} else if(req.params[0] == "url") {
		var execute_string = "rhythmbox-client --play-uri=" + req.param("url") + ";";
	} else if(req.params[0] == "queue") {
		var execute_string = "rhythmbox-client --enqueue \"" + req.param("url") + "\";";
	} else if(req.params[0] == "volume") {
		var execute_string = "rhythmbox-client --unmute;rhythmbox-client --set-volume " + 
			(req.param("volume") / 100) + ";";
	}

	execute_string += "rhythmbox-client --print-playing-format='%ta;%tt;%td;%te';";

	execute_string += "rhythmbox-client --print-volume";
	
	var child = exec(execute_string, function(error, stdout, stderr) {
		res.header('Content-Type', 'text/javascript');

		if(error !== null) {
			res.send('null');
		} else {
			var info = stdout.replace(/\n/g, ";").split(";");

			if(stdout.slice(0, 11) == "Not playing") {
				if(info[1].slice(0, 17) == "Playback is muted")
					var volume = 0;
				else
					var volume = Math.round(info[1].trim().slice(21, 28) / 10000);				
							
				if(req.params[0] == "status")
					res.send('{"status": "paused", "volume": "' + volume + '", "favorites":' + favorites + '}');				
				else
					res.send('{"status": "paused", "volume": "' + volume + '"}');
			} else {
				if(info[4].slice(0, 17) == "Playback is muted")
					var volume = 0;
				else
					var volume = Math.round(info[4].trim().slice(21, 28) / 10000);
 
				if(req.params[0] == "status") {
					res.send('{"status": "playing", "artist":"' + escape(info[0]) + 
						'", "title": "' + escape(info[1]) + '", "duration": "' + info[2] + 
						'", "elapsed": "' + info[3].trim() + '", "volume": "' +
						volume + '", "favorites":' + favorites + '}');
				} else {
					res.send('{"status": "playing", "artist":"' + escape(info[0]) + 
						'", "title": "' + escape(info[1]) + '", "duration": "' + info[2] + 
						'", "elapsed": "' + info[3].trim() + '", "volume": "' +
						volume + '"}');
				}
			}
		}
	});
};
