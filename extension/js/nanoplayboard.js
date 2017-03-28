// nanoplayboard.js

(function(ext) {
    var device = null;
    
    const BITRATE = 57600;
    const EXTENSION_NAME = 'nanoplayboard';

    ext.resetAll = function(){};

    ext.runNanoPlayBoard = function(){};

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
        d1 = r >> 1;
        d2 = ((r & 0x01) << 6) | (g >> 2);
        d3 = ((g & 0x03) << 5) | (b >> 3);
        d4 = (b & 0x07) << 4;
        device.send([0xF0, 0x10, 0X33, d1, d2, d3, d4, 0xF7]);
    }

    ext.readPotentiometer = function(){
        device.send([0xF0, 0x10, 0X40, 0xF7]);
    }

    ext.scaleToPotentiometer = function(toLow, toHigh){
        l1 = toLow & 0x7F
        l2 = toLow >> 7
        h1 = toHigh & 0x7F
        h2 = toHigh >> 7
        device.send([0xF0, 0x10, 0x41, l1, l2, h1, h2, 0xF7]);
    }

    ext.readLdr = function(){
        device.send([0xF0, 0x10, 0X50, 0xF7]);
    }

    ext.scaleToLdr = function(toLow, toHigh){
        l1 = toLow & 0x7F
        l2 = toLow >> 7
        h1 = toHigh & 0x7F
        h2 = toHigh >> 7
        device.send([0xF0, 0x10, 0x51, l1, l2, h1, h2, 0xF7]);
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
