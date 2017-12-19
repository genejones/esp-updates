var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var md5 = require('md5');

/* GET home page. */
router.get('/stats', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/esp-update', function(req, res, next) {
	//this function based on http://esp8266.github.io/Arduino/versions/2.0.0/doc/ota_updates/ota_updates.html#http-server
	var headers = req.headers;
	
	if(checkIfESP(req, res)){
		if (headers['X_ESP8266_STA_MAC'] && macArray[headers['X_ESP8266_STA_MAC']]){
			var fileName = macArray[headers['X_ESP8266_STA_MAC']];
			if (notModified){
				res.sendStatus(304);
			}
			else{
				res.sendFile(__dirname + filePath , { root : __dirname},   headers: {
					"Content-Type" : "application/octet-stream",
					'Content-Disposition" : "attachment; filename=' + filePath,
					'x-MD5:': getMd5ofFile(__dirname + filePath)
				});
			}
		}
		else{
			res.sendStatus(500);
		}
	}
});

function getMd5ofFile = function(fileName){
	fs.readFile(fileName, function(err, buf) {
		return(md5(buf));
	});
}


function checkIfESP(req, res){
	if(
		headers.hasOwnProperty('X_ESP8266_STA_MAC') &&
		headers.hasOwnProperty('X_ESP8266_AP_MAC') &&
		headers.hasOwnProperty('X_ESP8266_FREE_SPACE') &&
		headers.hasOwnProperty('X_ESP8266_SKETCH_SIZE') &&
		headers.hasOwnProperty('X_ESP8266_CHIP_SIZE') &&
		headers.hasOwnProperty('X_ESP8266_SDK_VERSION') &&
		headers.hasOwnProperty('X_ESP8266_VERSION')
	)
	{
		return true;
	}
	else{
		res.status = 403;
		res.send("This service is only for the ESP8266 updater.");
		console.log("only for ESP8266 updater! (header)\n");
		return false;
	}
};

var macArray = {
    "18:FE:AA:AA:AA:AA" => "DOOR-7-g14f53a19",
    "18:FE:AA:AA:AA:BB" => "TEMP-1.0.0"
};

module.exports = router;
