// nanoplayboard.js

(function(ext) {

    var START_SYSEX              = 0xF0,
        END_SYSEX                = 0xF7;

    var COMMAND                  = 0x10;

    var BUZZER_PLAY_TONE         = 0x20,
        BUZZER_STOP_TONE         = 0x21;

    var RGB_ON                   = 0x22,
        RGB_OFF                  = 0x23,
        RGB_TOGGLE               = 0x24,
        RGB_SET_COLOR            = 0x25,
        RGB_SET_INTENSITY        = 0x26;

    var POTENTIOMETER_READ       = 0x27,
        POTENTIOMETER_SCALE_TO   = 0x28;

    var LDR_READ                 = 0x29,
        LDR_SCALE_TO             = 0x30;

    var LEDMATRIX_PRINT_CHAR     = 0x31,
        LEDMATRIX_PRINT_PATTERN  = 0x32,
        LEDMATRIX_PRINT_STRING   = 0x33,
        LEDMATRIX_PRINT_IN_LAND  = 0x34,
        LEDMATRIX_STOP_PRINT     = 0x35;

    var SERVO_TO                 = 0x36,
        SERVOS_GO_FORWARD        = 0x37,
        SERVOS_GO_BACKWARD       = 0x38,
        SERVOS_GO_RIGHT          = 0x39,
        SERVOS_GO_LEFT           = 0x40,
        SERVOS_SET_SPEED         = 0x41;

    var ROTARY_ENCODER_READ      = 0x42;

    var ULTRASOUND_READ          = 0x43,
        ULTRASOUND_SCALE_TO      = 0x44;

    var DHT_READ_TEMPERATURE     = 0x45,
        DHT_READ_HUMIDITY        = 0x46;

    var BUTTON_TOP_IS_PRESSED    = 0x47,
        BUTTON_DOWN_IS_PRESSED   = 0x48,
        BUTTON_LEFT_IS_PRESSED   = 0x49,
        BUTTON_RIGHT_IS_PRESSED  = 0x50;

    var ACCELEROMETER_GET_X      = 0x51,
        ACCELEROMETER_GET_Y      = 0x52,
        ACCELEROMETER_GET_Z      = 0x53;

    const BITRATE = 57600;
    const EXTENSION_NAME = 'nanoplayboard';
    var device = null;

    var servoValues = {"servo 1":0, "servo 2":1};

    ext.resetAll = function(){};

    ext.runNanoPlayBoard = function(){};

    ext.buzzerPlayTone = function(frequency, duration) {
        var f1 = frequency & 0x7F
        var f2 = frequency >> 7
        var d1 = duration & 0x7F
        var d2 = duration >> 7
        device.send([START_SYSEX, COMMAND, BUZZER_PLAY_TONE, f1, f2, d1, d2, END_SYSEX]);
    }

    ext.buzzerStopTone = function(){
        device.send([START_SYSEX, COMMAND, BUZZER_STOP_TONE, END_SYSEX]);
    }

    ext.rgbOn = function(){
        device.send([START_SYSEX, COMMAND, RGB_ON, END_SYSEX]);
    }

    ext.rgbOff = function(){
        device.send([START_SYSEX, COMMAND, RGB_OFF, END_SYSEX]);
    }

    ext.rgbToggle = function(){
        device.send([START_SYSEX, COMMAND, RGB_TOGGLE, END_SYSEX]);
    }

    ext.rgbSetColor = function(r, g, b){
        var d1 = r >> 1;
        var d2 = ((r & 0x01) << 6) | (g >> 2);
        var d3 = ((g & 0x03) << 5) | (b >> 3);
        var d4 = (b & 0x07) << 4;
        device.send([START_SYSEX, COMMAND, RGB_SET_COLOR, d1, d2, d3, d4, END_SYSEX]);
    }

    ext.readPotentiometer = function(){
        device.send([START_SYSEX, COMMAND, POTENTIOMETER_READ, END_SYSEX]);
    }

    ext.scaleToPotentiometer = function(toLow, toHigh){
        var l1 = toLow & 0x7F
        var l2 = toLow >> 7
        var h1 = toHigh & 0x7F
        var h2 = toHigh >> 7
        device.send([START_SYSEX, COMMAND, POTENTIOMETER_SCALE_TO, l1, l2, h1, h2, END_SYSEX]);
    }

    ext.readLdr = function(){
        device.send([START_SYSEX, COMMAND, LDR_READ, END_SYSEX]);
    }

    ext.scaleToLdr = function(toLow, toHigh){
        var l1 = toLow & 0x7F
        var l2 = toLow >> 7
        var h1 = toHigh & 0x7F
        var h2 = toHigh >> 7
        device.send([START_SYSEX, COMMAND, LDR_SCALE_TO, l1, l2, h1, h2, END_SYSEX]);
    }

    ext.ledMatrixPrintString = function(message) {
        var bytes = [START_SYSEX, COMMAND, LEDMATRIX_PRINT_STRING, message.length];
        for(var i = 0; i < message.length; i++) {
            bytes.push(message.charCodeAt(i) & 0x7F);
        }
        bytes.push(END_SYSEX);
        device.send(bytes);
    }

    ext.ledMatrixPrintNumber = function(number) {
        var n = number & 0x7F;
        device.send([START_SYSEX, COMMAND, LEDMATRIX_PRINT_IN_LAND, n, END_SYSEX]);
    }

    ext.ledMatrixStopPrint = function() {
        device.send([START_SYSEX, COMMAND, LEDMATRIX_STOP_PRINT, END_SYSEX]);
    }

    ext.readUltrasound = function() {
        device.send([START_SYSEX, COMMAND, ULTRASOUND_READ, END_SYSEX]);
    }

    ext.buttonIsPressed = function(button){
        switch(button) {
            case "left":
                device.send([START_SYSEX, COMMAND, BUTTON_LEFT_IS_PRESSED, END_SYSEX]);
                break;

            case "right":
                device.send([START_SYSEX, COMMAND, BUTTON_RIGHT_IS_PRESSED, END_SYSEX]);
                break;

            case "down":
                device.send([START_SYSEX, COMMAND, BUTTON_DOWN_IS_PRESSED, END_SYSEX]);
                break;
        }
    }

    ext.servoTo = function(servoId, degrees){
        var id = typeof servoId == "string"?servoValues[servoId]:servoId;
        id = id & 0x7F;
        var d1 = degrees & 0x7F;
        var d2 = degrees >> 7;
        device.send([START_SYSEX, COMMAND, SERVO_TO, id, d1, d2, END_SYSEX]);
    }

    ext.map = function(nextID, x, in_min, in_max, out_min, out_max) {
        var value = (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        responseValue(nextID, value);
    }

    function processData(bytes) {
        var nextID = 0;
        var data;
        var value;

        trace(bytes);

        switch(bytes[2]) {
            case POTENTIOMETER_READ:
            case POTENTIOMETER_SCALE_TO:
            case LDR_READ:
            case LDR_SCALE_TO:
            case ULTRASOUND_READ:
                data = bytes.slice(4,8);
                value = parseFirmataUint16(data);
                break;

            case BUTTON_TOP_IS_PRESSED:
            case BUTTON_DOWN_IS_PRESSED:
            case BUTTON_LEFT_IS_PRESSED:
            case BUTTON_RIGHT_IS_PRESSED:
                data = bytes.slice(4,6);
                value = parseFirmataByte(data);
                break;
        }

        responseValue(nextID, value);
    }

    function parseFirmataByte(data) {
        return (data[0] & 0x7F) | ((data[1] & 0x01) << 7);
    }

    function parseFirmataUint16(data) {
        var rawBytes = [];
        rawBytes[0] = parseFirmataByte(data.slice(0,2));
        rawBytes[1] = parseFirmataByte(data.slice(2,4));
        return (rawBytes[1] << 8) | rawBytes[0];
    }

    // Extension API interactions
    var potentialDevices = [];
    ext._deviceConnected = function(dev) {
        potentialDevices.push(dev);

        if (!device) {
            tryNextDevice();
        }
    }

    function tryNextDevice() {
        // If potentialDevices is empty, device will be undefined.
        // That will get us back here next time a device is connected.
        device = potentialDevices.shift();
        if (device) {
            device.open({ stopBits: 0, bitRate: BITRATE, ctsFlowControl: 0 }, deviceOpened);
        }
    }

    function deviceOpened(dev) {
        if (!dev) {
            // Opening the port failed.
            tryNextDevice();
            return;
        }
        device.set_receive_handler(EXTENSION_NAME, processData);
    };

    ext._deviceRemoved = function(dev) {
        if(device != dev) return;
        device = null;
    };

    ext._shutdown = function() {
        if(device) device.close();
        device = null;
    };

    ext._getStatus = function() {
        if(!device) return {status: 1, msg: 'nanoplayboard disconnected'};
        return {status: 2, msg: 'nanoplayboard connected'};
    }

    var descriptor = {};
    ScratchExtensions.register(EXTENSION_NAME, descriptor, ext, {type: 'serial'});
})({});
