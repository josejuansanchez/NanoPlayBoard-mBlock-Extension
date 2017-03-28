// nanoplayboard.js

(function(ext) {
    const BITRATE = 57600;
    const EXTENSION_NAME = 'nanoplayboard';
    var device = null;

    ext.resetAll = function(){};

    ext.runNanoPlayBoard = function(){};

    ext.buzzerPlayTone = function(frequency, duration) {
        var f1 = frequency & 0x7F
        var f2 = frequency >> 7
        var d1 = duration & 0x7F
        var d2 = duration >> 7
        device.send([0xF0, 0x10, 0X20, f1, f2, d1, d2, 0xF7]);
    }

    ext.buzzerStopTone = function(){
        device.send([0xF0, 0x10, 0X21, 0xF7]);
    }

    ext.rgbOn = function(){
        device.send([0xF0, 0x10, 0X30, 0xF7]);
    }

    ext.rgbOff = function(){
        device.send([0xF0, 0x10, 0X31, 0xF7]);
    }

    ext.rgbToggle = function(){
        device.send([0xF0, 0x10, 0X32, 0xF7]);
    }

    ext.rgbSetColor = function(r, g, b){
        var d1 = r >> 1;
        var d2 = ((r & 0x01) << 6) | (g >> 2);
        var d3 = ((g & 0x03) << 5) | (b >> 3);
        var d4 = (b & 0x07) << 4;
        device.send([0xF0, 0x10, 0X33, d1, d2, d3, d4, 0xF7]);
    }

    ext.readPotentiometer = function(){
        device.send([0xF0, 0x10, 0X40, 0xF7]);
    }

    ext.scaleToPotentiometer = function(toLow, toHigh){
        var l1 = toLow & 0x7F
        var l2 = toLow >> 7
        var h1 = toHigh & 0x7F
        var h2 = toHigh >> 7
        device.send([0xF0, 0x10, 0x41, l1, l2, h1, h2, 0xF7]);
    }

    ext.readLdr = function(){
        device.send([0xF0, 0x10, 0X50, 0xF7]);
    }

    ext.scaleToLdr = function(toLow, toHigh){
        var l1 = toLow & 0x7F
        var l2 = toLow >> 7
        var h1 = toHigh & 0x7F
        var h2 = toHigh >> 7
        device.send([0xF0, 0x10, 0x51, l1, l2, h1, h2, 0xF7]);
    }

    ext.ledMatrixPrintString = function(message) {
        var bytes = [0xF0, 0x10, 0x62, message.length];
        for(var i = 0; i < message.length; i++) {
            bytes.push(message.charCodeAt(i) & 0x7F);
        }
        bytes.push(0xF7);
        device.send(bytes);
    }

    ext.ledMatrixPrintNumber = function(number) {
        var n = number & 0x7F;
        device.send([0xF0, 0x10, 0x63, n, 0xF7]);
    }

    ext.ledMatrixStopPrint = function() {
        device.send([0xF0, 0x10, 0x64, 0xF7]);
    }

    function processData(bytes) {
        var nextID = 0;
        var data;
        var value;

        trace(bytes);

        switch(bytes[2]) {
            case 0x40:
            case 0x41:
            case 0x50:
            case 0x51:
                data = bytes.slice(4,8);
                value = parseFirmataUint16(data);
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
