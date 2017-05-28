var messagesParser = require('./messagesParser');
var fs = require('fs');

var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var deviceCapabilities; 
var menuVibrationTime = 5;
var weDidSoftwareVersionRequestAlready = false;

var icons = {};

function readIcon(name) {
	fs.readFile(name, "utf8", function(err, data) {
		if(!err) {
			icons[name] = data;
		}
	});
}

readIcon("test36.png");
readIcon("test128.png");

function HandleBtWriteError(err, bytesWritten) {
	if(err) {
		console.error("WAS ERROR");
	}
}

btSerial.listPairedDevices(function(allTheThings) {
	var liveViewDevices = allTheThings.filter(function(e){ return e.name == "LiveView" });
	if(liveViewDevices.length == 0) console.error("No devices found!");
	else {
		for(var i = 0; i < liveViewDevices.length; i++) {
			btSerial.connect(liveViewDevices[i].address, 1, function() {
				btSerial.on('data', function(buffer) {
					var decMessages = messagesParser.Decode(buffer);
					for(var i = 0; i < decMessages.length; i++) {
						handleMessage(decMessages[i]);
					}
				});
				btSerial.write(new Buffer(messagesParser.EncodeSetVibrate(100, 100)), HandleBtWriteError);
				btSerial.write(new Buffer(messagesParser.EncodeGetCaps()), HandleBtWriteError);
			}, function() {
				console.log('nope');
			});
		}
	}
});

function handleMessage(msg) {
	if(msg instanceof messagesParser.Result) {
		if(msg.code !== messagesParser.RESULT_OK) {
			console.error("RESULT WAS NOT OK: " + msg.toString());
		}
		return;
	} 

	btSerial.write(new Buffer(messagesParser.EncodeAck(msg.messageId)), HandleBtWriteError);

	if(msg instanceof messagesParser.GetMenuItems) {
		console.log("GetMenuItems");
		btSerial.write(new Buffer(messagesParser.EncodeGetMenuItemResponse(0, true, 0, "Moo", icons["test36.png"])), HandleBtWriteError);
	} else if (msg instanceof messagesParser.GetMenuItem) {
		console.log("GetMenuItem");
		//todo fix me
	} else if (msg instanceof messagesParser.DisplayCapabilities) {
		console.log("DisplayCapabilities");
		deviceCapabilities = msg

		btSerial.write(new Buffer(messagesParser.EncodeSetMenuSize(4)), HandleBtWriteError)
		btSerial.write(new Buffer(messagesParser.EncodeSetMenuSettings(menuVibrationTime, 0)), HandleBtWriteError)
	} else if (msg instanceof messagesParser.GetTime) {
		console.log("GetTime");
		btSerial.write(new Buffer(messagesParser.EncodeGetTimeResponse(Math.floor(new Date().getTime() / 1000) - (new Date().getTimezoneOffset() * 60), true)), HandleBtWriteError);
	} else if (msg instanceof messagesParser.DeviceStatus) {
		console.log("DeviceStatus");
		btSerial.write(new Buffer(messagesParser.EncodeDeviceStatusAck()), HandleBtWriteError);
		if(!weDidSoftwareVersionRequestAlready)
			btSerial.write(new Buffer(messagesParser.EncodeGetSwVersion()), HandleBtWriteError);
	} else if (msg instanceof messagesParser.GetAlert) {
		console.log("GetAlert");
		btSerial.write(new Buffer(messagesParser.EncodeGetAlertResponse(20, 4, 15, "TIME", "HEADER", "01234567890123456789012345678901234567890123456789", testPng)), HandleBtWriteError)
	} else if (msg instanceof messagesParser.Navigation) {
		console.log("Navigation");
		btSerial.write(messagesParser.EncodeNavigationResponse(messagesParser.RESULT_EXIT), HandleBtWriteError);
		if (msg.navType == NAVTYPE_DOWN) {
			if (! msg.wasInAlert)
				btSerial.write(messagesParser.EncodeDisplayPanel("Text will scroll sideways", "But using newlines\nis also an elegant\nsolution\nfor text display.", icons["test36.png"], false), HandleBtWriteError);
		}
	} else if (msg instanceof messagesParser.GetSwVersion) {
		weDidSoftwareVersionRequestAlready = true;
		console.log("Detected software version: " + msg.version);
	}
	else {
		console.log("Unknown event!");
	}
}

console.log("Waiting...");	

const NAVTYPE_UP		= 0
const NAVTYPE_DOWN		= 1
const NAVTYPE_LEFT		= 2
const NAVTYPE_RIGHT		= 3
const NAVTYPE_SELECT		= 4
const NAVTYPE_MENUSELECT	= 5