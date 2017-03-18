// nanoplayboard.js

(function(ext) {
    var device = null;
    
    const BITRATE = 57600;

    ext.resetAll = function(){};

    ext.runNanoPlayBoard = function(){};

    ext.rgbToggle = function(){
        device.send([0xF0, 0x10, 0X32, 0xF7])
    }

    function processData(bytes) {
        trace(bytes);
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
        device.set_receive_handler('nanoplayboard',function(data) {
            processData(data);
        });
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
    ScratchExtensions.register('nanoplayboard', descriptor, ext, {type: 'serial'});
})({});
