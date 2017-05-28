var struct = require('bufferpack')

function debugWritePayload(payload) {
	console.log("payload:" + payload.toString('hex'))
}

function getByte(buffer, index) {
	var result = Buffer.allocUnsafe(1);
	buffer.copy(result, 0, index, index + 1);
	return result;
}

function byteSubstr(buffer, start, stop) {
	var result = Buffer.allocUnsafe(stop - start);
	buffer.copy(result, 0, start, stop);
	return result;
}

function DecodeLVMessage(msg) {
	//debugWritePayload(msg);
	var unpacked = struct.unpack(">BBL", byteSubstr(msg, 0, 6));
    var messageId = unpacked[0], 
    	headerLen = unpacked[1], 
    	payloadLen = unpacked[2];

	var msgLength = 2 + headerLen + payloadLen;
	var payload = byteSubstr(msg, 2 + headerLen, msgLength);

	if (headerLen != 4)
		throw Error("Unexpected header length %i" % headerLen)
	if (payloadLen != payload.length) {
		debugWritePayload(payload);
		throw Error(`Payload length is not as expected ${payloadLen} != ${payload.length}`)
    }
	return { messageId: messageId, payload: payload, msgLength: msgLength };
}

function Decode(msg){
	result = []
	consumed = 0
	while (consumed < msg.length) {
		var decoded = DecodeLVMessage(Buffer.from(msg, consumed))
		consumed += decoded.msgLength

		if (decoded.messageId === MSG_GETCAPS_RESP)
			result.push(new DisplayCapabilities(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_SETLED_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_SETVIBRATE_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_DEVICESTATUS_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_SETSCREENMODE_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_CLEARDISPLAY_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_SETSTATUSBAR_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_DISPLAYTEXT_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_DISPLAYBITMAP_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_DISPLAYPANEL_ACK)
			result.push(new Result(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_GETMENUITEMS)
			result.push(new GetMenuItems(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_GETMENUITEM)
			result.push(new GetMenuItem(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_GETTIME)
			result.push(new GetTime(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_GETALERT)
			result.push(new GetAlert(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_DEVICESTATUS){
			result.push(new DeviceStatus(decoded.messageId, decoded.payload))
		} else if (decoded.messageId === MSG_NAVIGATION)
			result.push(new Navigation(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_GETSCREENMODE_RESP)
			result.push(new GetScreenMode(decoded.messageId, decoded.payload))
		else if (decoded.messageId === MSG_GETSWVERSION_RESP)
			result.push(new GetSwVersion(decoded.messageId, decoded.payload))
		else {
			console.error("Unknown message id " + decoded.messageId);
			debugWritePayload(payload);
        }
    }
	//console.log("consumed: " + consumed + " total: " + msg.length + " decoded messages: " + result.length);
	//console.log(result);
	return result
}

function EncodeLVMessage(messageId, data){
	var result = Buffer.concat([struct.pack(">BBL", [messageId, 4, data.length]), new Buffer(data)]);
	//console.log("encoded LV Message: ", result);
	return result;
}

/**
 * Pack a GetCapabilities message
 */
function EncodeGetCaps(){
	return EncodeLVMessage(MSG_GETCAPS, Buffer.concat([struct.pack(">B", [CLIENT_SOFTWARE_VERSION.length]), new Buffer(CLIENT_SOFTWARE_VERSION)]))
}

/**
 * Pack a SetVibrate message
 * @param {number} delayTime in ms
 * @param {number} onTime in ms
 */
function EncodeSetVibrate(delayTime, onTime){
	return EncodeLVMessage(MSG_SETVIBRATE, struct.pack(">HH", [delayTime, onTime]))
}

/**
 * Pack a SetLED message wih the provided rgb values and timings
 * @param {number} Value for Red component 
 * @param {number} Value for Green component
 * @param {number} Value for Blue component
 * @param {number} delayTime in ms
 * @param {number} onTime in ms
 */
function EncodeSetLED(r, g, b, delayTime, onTime){
	return EncodeLVMessage(MSG_SETLED, struct.pack(">HHH", [((r & 0x31) << 10) | ((g & 0x31) << 5) | (b & 0x31), delayTime, onTime]))
}

/**
 * Pack a SetMenuSize message with the provided menuSize
 * @param {number} menuSize 
 */
function EncodeSetMenuSize(menuSize){
	return EncodeLVMessage(MSG_SETMENUSIZE, struct.pack(">B", [menuSize]))
}

function EncodeGetSwVersion() {
	return EncodeLVMessage(MSG_GETSWVERSION, struct.pack(">B", [1]))
}

function EncodeAck(ackMessageId){
	return EncodeLVMessage(MSG_ACK, struct.pack(">B", [ackMessageId]))
}

function EncodeDeviceStatusAck(){
	return EncodeLVMessage(MSG_DEVICESTATUS_ACK, struct.pack(">B", [RESULT_OK]))
}

function EncodeGetMenuItemResponse(menuItemId, isAlertItem, unreadCount, text, itemBitmap){
	payload = struct.pack(">BHHHBB", [!isAlertItem, 0, unreadCount, 0, menuItemId + 3, 0])	 //final 0 is for plaintext vs bitmapimage (1) strings
	payload += struct.pack(">H", [0]) 		// unused string
	payload += struct.pack(">H", [0]) 	    // unused string
	payload += struct.pack(">H", [text.length]) + text
	payload += itemBitmap

	return EncodeLVMessage(MSG_GETMENUITEM_RESP, payload)
}

function EncodeDisplayPanel(topText, bottomText, bitmap, alertUser){

	id = 80
	if (!alertUser)
		id |= 1

	payload = struct.pack(">BHHHBB", [0, 0, 0, 0, id, 0])	// final 0 is for plaintext vs bitmapimage (1) strings
	payload += struct.pack(">H", [len(topText)]) + topText
	payload += struct.pack(">H", [0]) 			// unused string
	payload += struct.pack(">H", [len(bottomText)]) + bottomText
	payload += bitmap

	return EncodeLVMessage(MSG_DISPLAYPANEL, payload)
}

function EncodeDisplayBitmap(x, y, bitmap){
	// Only works if you have sent SetMenuItems(0)
	// Meaning of byte 2 is unknown, but /is/ important!
	return EncodeLVMessage(MSG_DISPLAYBITMAP, struct.pack(">BBB", [x, y, 1]) + bitmap)
}

function EncodeSetStatusBar(menuItemId, unreadAlerts, itemBitmap) {
	// Note that menu item#0 is treated specially if you have non-zero unreadAlerts...
	// Its value will be automatically updated from the other menu items... e.g. if item #3 currently has 20, and is changed to 200 with this call, item#0 will automatically be set to 180 (200-20). Slightly annoying!

	payload = struct.pack(">BHHHBB", [0, 0, unreadAlerts, 0, menuItemId + 3, 0])
	payload += struct.pack(">H", [0])
	payload += struct.pack(">H", [0])
	payload += struct.pack(">H", [0])
	payload += itemBitmap
	
	return EncodeLVMessage(MSG_SETSTATUSBAR, payload)
}

function EncodeGetTimeResponse(time, is24HourDisplay){
	return EncodeLVMessage(MSG_GETTIME_RESP, struct.pack(">LB", [time, !is24HourDisplay]))
}

function EncodeNavigationResponse(result){
	return EncodeLVMessage(MSG_NAVIGATION_RESP, struct.pack(">B", [result]))
}

function EncodeSetScreenMode(brightness, auto){
	// Only works if you have sent SetMenuItems(0)
	v = brightness << 1
	if (auto)
		v |= 1
	return EncodeLVMessage(MSG_SETSCREENMODE, struct.pack(">B", [v]))
}

function EncodeGetScreenMode(){
	// Only works if you have sent SetMenuItems(0)
	return EncodeLVMessage(MSG_GETSCREENMODE, "")
}

function EncodeClearDisplay(){
	// Only works if you have sent SetMenuItems(0)
	return EncodeLVMessage(MSG_CLEARDISPLAY, "")
}

function EncodeSetMenuSettings(vibrationTime, initialMenuItemId){
	// This message is never acked for some reason. 
	// vibrationTime is in units of approximately 100ms

	return EncodeLVMessage(MSG_SETMENUSETTINGS, struct.pack(">BBB", [vibrationTime, 12, initialMenuItemId])) // 12 is "font size" - doesn't seem to change anything though!
}

function EncodeGetAlertResponse(totalCount, unreadCount, alertIndex, timestampText, headerText, bodyTextChunk, bitmap){
	var payload = struct.pack(">BHHHBB", [0, totalCount, unreadCount, alertIndex, 0, 0])	// final 0 is for plaintext vs bitmapimage (1) strings
	payload += struct.pack(">H", [len(timestampText)]) + timestampText
	payload += struct.pack(">H", [len(headerText)]) + headerText
	payload += struct.pack(">H", [len(bodyTextChunk)]) + bodyTextChunk
	payload += struct.pack(">B", [0])
	payload += struct.pack(">L", [len(bitmap)]) + bitmap

	return EncodeLVMessage(MSG_GETALERT_RESP, payload)
}

function EncodeDisplayText(s){
	// FIXME: doesn't seem to do anything!
	return EncodeLVMessage(MSG_DISPLAYTEXT, struct.pack(">B", [0]) + s)
}

function DisplayCapabilities(messageId, msg){
	var unpacked = struct.unpack(">BBBBBBBBBB", Buffer.from(msg, 0, 10));
	this.width = unpacked[0],
	this.height = unpacked[1], 
	this.statusBarWidth = unpacked[2], 
	this.statusBarHeight = unpacked[3], 
	this.viewWidth = unpacked[4], 
	this.viewHeight = unpacked[5], 
	this.announceWidth = unpacked[6], 
	this.announceHeight = unpacked[7], 
	this.textChunkSize = unpacked[8], 
	this.idleTimer = unpacked[9],
	this.messageId = messageId
	this.softwareVersion = byteSubstr(msg, 11, msg.length).toString('utf8');
	if (this.idleTimer != 0)
		console.error(`DisplayCapabilities with non-zero idle timer ${idleTimer}`);
}

DisplayCapabilities.prototype.toString = function() {
	return "<DisplayCapabilities Width:%i Height:%i StatusBarWidth:%i StatusBarHeight:%i ViewWidth:%i ViewHeight:%i AnnounceWidth:%i AnnounceHeight:%i TextChunkSize:%i SoftwareVersion:%s>" % (this.width, this.height, this.statusBarWidth, this.statusBarHeight, this.viewWidth, this.viewHeight, this.announceWidth, this.announceHeight, this.textChunkSize, this.softwareVersion)
}

function Result(messageId, msg) {
	var _result = {
		messageId: messageId,
		code: struct.unpack(">B", msg)[0]
	}
}

Result.prototype.toString = function() {
	s = "UNKNOWN"
		if (_result.code == RESULT_OK)
			s = "OK"
		else if (_result.code == RESULT_ERROR)
			s = "ERROR"
		else if (_result.code == RESULT_OOM)
			s = "OOM"
		else if (_result.code == RESULT_EXIT)
			s = "EXIT"
		else if (_result.code == RESULT_CANCEL)
			s = "CANCEL"
		return `<Result MessageId:${this.messageId} Code:${s}>`;
}


function GetMenuItem(messageId, msg){
		this.messageId = messageId
		this.menuItemId = struct.unpack(">B", msg)[0]
}

GetMenuItem.prototype.toString = function() {
		return "<GetMenuItem MenuItemId:%i>" % this.menuItemId
}

function GetSwVersion(messageId, msg){
	this.messageId = messageId
	this.version = byteSubstr(msg, 1, msg.length).toString('utf8')
}

function GetMenuItems(messageId, msg){
		this.messageId = messageId
		unknown = struct.unpack(">B", msg)[0]
		if (unknown != 0)
			print >>sys.stderr, "GetMenuItems with non-zero unknown byte %i" % unknown
}

function GetTime(messageId, msg) {
		this.messageId = messageId
		unknown = struct.unpack(">B", msg)[0]
		if (unknown != 0)
			print >>sys.stderr, "GetTime with non-zero unknown byte %i" % unknown
}

function DeviceStatus(messageId, msg){
		this.messageId = messageId
		this.deviceStatus = struct.unpack(">B", getByte(msg, 0))[0]
		if (this.deviceStatus > 2)
			console.error("DeviceStatus with unknown value " + this.deviceStatus);
}

DeviceStatus.prototype.toString = function() {
		s = "UNKNOWN"
		if (this.deviceStatus == DEVICESTATUS_OFF)
			s = "Off"
		else if (this.deviceStatus == DEVICESTATUS_ON)
			s = "On"
		else if (this.deviceStatus == DEVICESTATUS_MENU)
			s = "Menu"

		return "<DeviceStatus Status:%s>" % s
}

function GetAlert(messageId, msg){
		this.messageId = messageId

		(this.menuItemId, this.alertAction, this.maxBodySize, a, b, c) = struct.unpack(">BBHBBB", msg)
		if (a != 0 || b != 0 || c != 0) 
			print >>sys.stderr, "GetAlert with non zero text values! %i %i %i" % (a, b, c)
		if (this.alertAction > ALERTACTION_PREV)
			print >>sys.stderr, "GetAlert with out of range action %i" % this.alertAction
}

GetAlert.prototype.toString = function() {
			s = "UNKNOWN"
		if (this.alertAction == ALERTACTION_CURRENT)
			s = "Current"
		else if (this.alertAction == ALERTACTION_FIRST)
			s = "First"
		else if (this.alertAction == ALERTACTION_LAST)
			s = "Last"
		else if (this.alertAction == ALERTACTION_NEXT)
			s = "Next"
		else if (this.alertAction == ALERTACTION_PREV)
			s = "Previous"

		return "<GetAlert MenuItemId:%i AlertAction:%s MaxBodyLength:%i>" % (this.menuItemId, s, this.maxBodySize)
}

function Navigation(messageId, msg) {
		this.messageId = messageId
		(byte0, byte1, navigation, this.menuItemId, menuId) = struct.unpack(">BBBBB", msg)
		if (byte0 != 0)
			print >>sys.stderr, "Navigation with unknown byte0 value %i" % byte0
		if (byte1 != 3)
			print >>sys.stderr, "Navigation with unknown byte1 value %i" % byte1
		if (menuId != 10 && menuId != 20)
			print >>sys.stderr, "Navigation with unexpected menuId value %i" % menuId
		if ((navigation != 32) && ((navigation < 1) || (navigation > 15)))
			print >>sys.stderr, "Navigation with out of range value %i" % navigation
			
		this.wasInAlert = menuId == 20

		if (navigation != 32){
			this.navAction = (navigation - 1) % 3
			this.navType = int((navigation - 1) / 3)
		}
		else {
			this.navAction = NAVACTION_PRESS
			this.navType = NAVTYPE_MENUSELECT
		}
}

Navigation.prototype.toString = function() {
	sA = "UNKNOWN"
		if (this.navAction == NAVACTION_PRESS)
			sA = "Press"
		else if (this.navAction == NAVACTION_DOUBLEPRESS)
			sA = "DoublePress"
		else if (this.navAction == NAVACTION_LONGPRESS)
			sA = "LongPress"

		sT = "UNKNOWN"
		if (this.navType == NAVTYPE_UP)
			sT = "Up"
		else if (this.navType == NAVTYPE_DOWN)
			sT = "Down"
		else if (this.navType == NAVTYPE_LEFT)
			sT = "Left"
		else if (this.navType == NAVTYPE_RIGHT)
			sT = "Right"
		else if (this.navType == NAVTYPE_SELECT)
			sT = "Select"
		else if (this.navType == NAVTYPE_MENUSELECT)
			sT = "MenuSelect"

		return "<Navigation Action:%s Type:%s MenuItemId:%i WasInAlert:%i>" % (sA, sT, this.menuItemId, this.wasInAlert)
}

function GetScreenMode (messageId, msg){
	this.messageId = messageId
	raw = struct.unpack(">B", msg)[0]
	this.auto = raw & 1
	this.brightness = raw >> 1
}

GetScreenMode.prototype.toString = function() {
	return "<GetScreenMode Auto:%i Brightness:%i>" % (this.auto, this.brightness)
}

const MSG_GETCAPS		= 1
const MSG_GETCAPS_RESP 	= 2

const MSG_DISPLAYTEXT		= 3
const MSG_DISPLAYTEXT_ACK	= 4

const MSG_DISPLAYPANEL	= 5
const MSG_DISPLAYPANEL_ACK	= 6

const MSG_DEVICESTATUS	= 7
const MSG_DEVICESTATUS_ACK 	= 8

const MSG_DISPLAYBITMAP	= 19
const MSG_DISPLAYBITMAP_ACK	= 20

const MSG_CLEARDISPLAY  	= 21
const MSG_CLEARDISPLAY_ACK 	= 22

const MSG_SETMENUSIZE		= 23
const MSG_SETMENUSIZE_ACK	= 24

const MSG_GETMENUITEM		= 25
const MSG_GETMENUITEM_RESP	= 26

const MSG_GETALERT		= 27
const MSG_GETALERT_RESP	= 28

const MSG_NAVIGATION		= 29
const MSG_NAVIGATION_RESP	= 30

const MSG_SETSTATUSBAR	= 33
const MSG_SETSTATUSBAR_ACK	= 34

const MSG_GETMENUITEMS	= 35

const MSG_SETMENUSETTINGS  	= 36
const MSG_SETMENUSETTINGS_ACK = 37

const MSG_GETTIME		= 38
const MSG_GETTIME_RESP	= 39

const MSG_SETLED 		= 40
const MSG_SETLED_ACK 		= 41

const MSG_SETVIBRATE 		= 42
const MSG_SETVIBRATE_ACK 	= 43

const MSG_ACK			= 44

const MSG_SETSCREENMODE	= 64
const MSG_SETSCREENMODE_ACK	= 65

const MSG_GETSCREENMODE	= 66
const MSG_GETSCREENMODE_RESP	= 67

const MSG_GETSWVERSION = 68
const MSG_GETSWVERSION_RESP = 69

const DEVICESTATUS_OFF	= 0
const DEVICESTATUS_ON		= 1
const DEVICESTATUS_MENU	= 2

const RESULT_OK		= 0
const RESULT_ERROR		= 1
const RESULT_OOM		= 2
const RESULT_EXIT		= 3
const RESULT_CANCEL		= 4

const NAVACTION_PRESS		= 0
const NAVACTION_LONGPRESS	= 1
const NAVACTION_DOUBLEPRESS	= 2

const NAVTYPE_UP		= 0
const NAVTYPE_DOWN		= 1
const NAVTYPE_LEFT		= 2
const NAVTYPE_RIGHT		= 3
const NAVTYPE_SELECT		= 4
const NAVTYPE_MENUSELECT	= 5

const ALERTACTION_CURRENT	= 0
const ALERTACTION_FIRST	= 1
const ALERTACTION_LAST	= 2
const ALERTACTION_NEXT	= 3
const ALERTACTION_PREV	= 4

const BRIGHTNESS_OFF		= 48
const BRIGHTNESS_DIM		= 49
const BRIGHTNESS_MAX		= 50

const CLIENT_SOFTWARE_VERSION = "0.0.3"

module.exports = {
	ByteSubst: byteSubstr,
	Decode: Decode,
	DecodeLVMessage: DecodeLVMessage, 
	DeviceStatus: DeviceStatus,
	DisplayCapabilities: DisplayCapabilities,
	EncodeAck: EncodeAck,
	EncodeLVMessage: EncodeLVMessage,
	EncodeDeviceStatusAck: EncodeDeviceStatusAck,
	EncodeGetAlertResponse: EncodeGetAlertResponse,
	EncodeGetCaps: EncodeGetCaps,
	EncodeGetMenuItemResponse: EncodeGetMenuItemResponse,
	EncodeGetSwVersion: EncodeGetSwVersion,
	EncodeGetTimeResponse: EncodeGetTimeResponse,
	EncodeNavigationResponse: EncodeNavigationResponse,
	EncodeSetLED: EncodeSetLED,
	EncodeSetMenuSize: EncodeSetMenuSize,
	EncodeSetMenuSettings: EncodeSetMenuSettings,
	EncodeSetVibrate: EncodeSetVibrate,
	GetByte: getByte,
	GetAlert: GetAlert,
	GetMenuItem: GetMenuItem,
	GetMenuItems: GetMenuItems,
	GetSwVersion: GetSwVersion,
	GetTime: GetTime,
	Navigation: Navigation,
	Result: Result
}