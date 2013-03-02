
var WEBPP = require('../lib/iwebpp.io'),
    SEP = WEBPP.SEP;

var express = require('express');

// create name-client
var nmcln = new WEBPP({
    srvinfo: {
        timeout: 20,
        endpoints: [{ip: 'www.iwebpp.com', port: 51686}, {ip: 'www.iwebpp.com', port: 51868}],
        turn: [
            {ip: 'www.iwebpp.com', agent: 51866, proxy: 51688} // every turn-server include proxy and agent port
        ]
    },
    usrinfo: {domain: '51dese.com', usrkey: 'dese'},
    conmode: SEP.SEP_MODE_CS // c/s mode as httpp server
});

nmcln.on('ready', function(){
    console.log('name-client ready on vpath:'+nmcln.vpath);

/////////////////////////////////////////////////////////////////
// file share App
    var app = express();

    app.use(nmcln.vpath, express.directory(__dirname + '/dese'));
    app.use(nmcln.vpath, express.static(__dirname + '/dese'));
    app.use(nmcln.vpath, function(req, res){
        res.end('invalid path');
    });
/////////////////////////////////////////////////////////////////
    
    // hook app on business server
    nmcln.bsrv.srv.on('request', app);
    
    // monitor network performance
    nmcln.bsrv.srv.on('connection', function(socket){
    
        var intl = setInterval(function(){
            ///console.log('socket network performance:'+JSON.stringify(socket.netPerf));
            if (socket && socket.netPerf) {
	            var perf = socket.netPerf;
	                     
	            console.log('socket network bandwidth:'+JSON.stringify(perf.mbpsBandwidth)+' Mb/s');
	            console.log('socket network RTT:'+JSON.stringify(perf.msRTT)+' ms');
	            console.log('socket network SendRate:'+JSON.stringify(perf.mbpsSendRate)+' Mb/s');
	            console.log('socket network RecvRate:'+JSON.stringify(perf.mbpsRecvRate)+' Mb/s');
	            console.log('socket network CongestionWindow:'+JSON.stringify(perf.pktCongestionWindow));
	            console.log('socket network RecvACK:'+JSON.stringify(perf.pktRecvACK));
	            console.log('socket network RecvNACK:'+JSON.stringify(perf.pktRecvNAK)+'\n\n');
            }
        }, 6000); // every 6s
        
        socket.on('close', function(){            
            clearInterval(intl);
            console.log('socket closed');
        });
        socket.on('error', function(){            
            clearInterval(intl);
            console.log('socket error');
        });
        socket.on('end', function(){            
            clearInterval(intl);
            console.log('socket end');
        });
    });
        
    console.log('please access URL: http://iwebpp.com:51688'+nmcln.vpath);
});
