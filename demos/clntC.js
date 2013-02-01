
var SEP = require('../lib/sep');
var nmCln = require('../lib/iwebpp.io');

// iwebpp-ws library
var WebSocket = require('wspp');
var WebSocketServer = WebSocket.Server;

// msgpack library
var msgpack = require('msgpack-js');


// client C
var nmclnsC = new nmCln({
    srvinfo: {
        timeout: 20,
        endpoints: [{ip: 'www.iwebpp.com', port: 51686}, {ip: 'www.iwebpp.com', port: 51868}],
        turn: [
            {ip: 'www.iwebpp.com', agent: 51866, proxy: 51688} // every turn-server include proxy and agent port
        ]
    },
    usrinfo: {domain: '51dese.com', usrkey: 'C'},
    /*conmode: {mode: SEP.SEP_MODE_CS, srvtype: SEP.SEP_TYPE_SRV_HTTPP, srvapp: function(req, res){
        console.log('test hole punch server logics...');
        res.send('test hole punch server logics...');
    }}*/ // c/s mode as httpp server
    conmode: {mode: SEP.SEP_MODE_CS, srvtype: SEP.SEP_TYPE_SRV_WSPP}
});

nmclnsC.on('ready', function(){
    console.log('name-nmclnsC ready');
 
    // ask for all user info
    nmclnsC.getAllUsrs(function(err, usrs){
        if (!err) {
            ///console.log('got User info answer:'+usrs.length+','+JSON.stringify(usrs));
        } else {
            console.log(err);    
        }
    });

    // ask for all Logins info
    /*nmclnsC.getCllLogins(function(err, logins){
        if (!err) {
            console.log('got Logins answer:'+JSON.stringify(logins));
        } else {
            console.log(err);    
        }
    });
    */

    // ask for user-specific Logins info
    nmclnsC.getUsrLogins({domain: '51dese.com', usrkey: 'B'}, function(err, logins){
        if (!err) {
            ///console.log('nmclnsB Logins answer:'+logins.length+','+JSON.stringify(logins));
          
            // ask for client-specific Logins info
           nmclnsC.getClntSdps(logins[logins.length-1].to.gid, function(err, sdps){
                if (!err) {
                    ///console.log('nmclnsC SDPs answer:'+JSON.stringify(sdps));
                      						 
                    // try to setup STUN connection to peer
                    var peerinfo = {
					    gid: sdps[sdps.length-1].from.gid,
					  vpath: sdps[sdps.length-1].from.vpath,
					   
					    lip: sdps[sdps.length-1].from.localIP,
					  lport: sdps[sdps.length-1].from.localPort,
						     
					 natype: sdps[sdps.length-1].to.natype, 
							
					     ip: sdps[sdps.length-1].rel.clntIP, 
					   port: sdps[sdps.length-1].rel.clntPort
				    };
				    
                   nmclnsC.offerStun({endpoint: peerinfo}, function(err, stun){
                        console.log('C setup stun to peer:'+JSON.stringify(peerinfo));
                        
                        if (err || !stun) return console.log(err+',setup STUN to peer failed');
                        
						// try to connect to peer													
                       nmclnsC.createConnection({endpoint: peerinfo}, function(err, socket){
                            console.log('C connected to peer:'+JSON.stringify(peerinfo));
                            
                            if (err || !socket) return console.log(err+',connect to peer failed');
                            
                            socket.on('message', function(message, flags) {
					            // flags.binary will be set if a binary message is received
                                // flags.masked will be set if the message was masked
                                var data = (flags.binary) ? msgpack.decode(message) : JSON.parse(message);
                                console.log(JSON.stringify(data));
							});
							
							setInterval(function(){
							    socket.send(msgpack.encode('Hello, This Tom Zhou. :)'), {binary: true, mask: true});
							}, 2000);
                        });
                    });
                    
                    // create TURN session
                    nmclnsC.offerTurn({endpoint: peerinfo}, function(err, turn){
                        console.log('C setup turn to peer:'+JSON.stringify(peerinfo));
                        console.log('TURN:'+JSON.stringify(turn));
                        
                        if (err || !turn) return console.log(err+',setup TURN to peer failed');
                        
						// try to connect to peer
						var turninfo = {
					       vpath: turn.vpath,
					     
					         lip: turn.srvIP,
					       lport: turn.proxyPort,
							
					          ip: turn.srvIP, 
					        port: turn.proxyPort						
						};													
                        nmclnsC.createConnection({endpoint: turninfo}, function(err, socket){
                            console.log('C connected to peer via TURN:'+JSON.stringify(turninfo));
                            
                            if (err || !socket) return console.log(err+',connect to turn failed');
                            
                            socket.on('message', function(message, flags) {
					            // flags.binary will be set if a binary message is received
                                // flags.masked will be set if the message was masked
                                var data = (flags.binary) ? msgpack.decode(message) : JSON.parse(message);
                                console.log(JSON.stringify(data));
							});
							
							setInterval(function(){
							    socket.send(msgpack.encode('Hello, This Tom Zhou on TURN. :)'), {binary: true, mask: true});
							}, 2000);
                        });
                    });                    
                } else {
                    console.log(err);    
                }
            });
        } else {
            console.log(err);    
        }
    });
});
