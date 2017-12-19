var fs = require('fs');
var wsse = require('wsse');
var request = require('request');
var querystring = require('querystring');
var backoff = require('backoff');

const express = require('express')
const app = express()

app.get('/count', function (req, res) {
  getSummaryStats(res);
})

app.listen(80, function () {
  console.log('Example app listening on port 80!');
})

var expBackoff = backoff.exponential({
    initialDelay : 1000,
    maxDelay : 300000
});

expBackoff.on('backoff', function(number, delay) {
    // Do something when backoff starts, e.g. show to the 
    // user the delay before next reconnection attempt. 
    console.log(number + ' ' + delay + 'ms');
});
 
expBackoff.on('ready', function(number, delay) {
    // Do something when backoff ends, e.g. retry a failed 
    // operation (DNS lookup, API call, etc.). If it fails 
    // again then backoff, otherwise reset the backoff 
    // instance. 
    getReport(reportID);
});
 
expBackoff.on('fail', function() {
    // Do something when the maximum number of backoffs is 
    // reached, e.g. ask the user to check its connection. 
    console.log('fail');
});

var wsseTokenToUse = '';
var reportID = '';

var report_suites = {};
var evars = {};
var props = {};
var events = {};

var updateWSSE = function(){
	var token = wsse({username:"gjones:Analog Devices", password:"a41f86a51b25338ac8a4beaf4719a89c"});
	wsseTokenToUse = token.getWSSEHeader({ nonceBase64: true });
	console.log(wsseTokenToUse);
};

//not including the date means the present date is used
var summaryForm = {
    "reportDescription":{
        "metrics":[
            {
                "id":"pageviews",
            },
            {
                "id":"visitors",
            },
            {
                "id":"visits"
            }
        ],
        "elements":[
            {
                "id":"reportsuite",
                "selected":[
                    "analog2014global"
                ]
            }
        ],
    }
};


var getSummaryStats = function(res){
    updateWSSE();
    console.log(summaryForm);
	var options = {
		headers: {
		  'Content-Type': 'application/x-www-form-urlencoded',
		  'X-WSSE': wsseTokenToUse
		},
		uri: 'https://api.omniture.com/admin/1.4/rest/?method=Report.Queue',
		form: summaryForm,
		method: 'POST',
		json: true
	};
	let outputFile = fs.createWriteStream('summaryStatsReportID.json'); 
	request(options, function (err, res, body) {
		if (!err){
			console.log(body);
            if (body.reportID){
                reportID = body.reportID;
                getReport(reportID);
            }
		}
		else{
			console.log(res.statusCode);
			console.log(err);
		}
	    
  }).pipe(outputFile);
};

var getReport = function(id){
    updateWSSE();
    console.log(summaryForm);
	var options = {
		headers: {
		  'Content-Type': 'application/x-www-form-urlencoded',
		  'X-WSSE': wsseTokenToUse
		},
		uri: 'https://api.omniture.com/admin/1.4/rest/?method=Report.Get',
		form: {reportID:id},
		method: 'POST',
		json: true
	};
	let outputFile = fs.createWriteStream('summaryStats.json'); 
	request(options, function (err, res, body) {
		if (!err){
			console.log(body);
            if (body.error && body.error == "report_not_ready"){
                expBackoff.backoff();
            }
            if (body.report){
                var data = body.report.data[0].counts;
                var pageviews = data[0];
                var visitors = data[1];
                var visits = data[2];
                console.log("Pageviews:"+pageviews+" Visitors:"+visitors+" Visits:"+visits);
                res.send(data);
            }
		}
		else{
			console.log(res.statusCode);
			console.log(err);
		}
	    
  }).pipe(outputFile);
};

getSummaryStats();