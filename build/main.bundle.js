'use strict';

var _swap = require('./swap');

var _swap2 = _interopRequireDefault(_swap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Web3 = require('web3');

var byz = _swap2.default;

var readable = function readable(n) {
    return n.dividedBy(new BigNumber(1e8)).toString();
};
var byzQtyForEvent = function byzQtyForEvent(evt) {
    return new BigNumber(evt.returnValues[1]).multipliedBy(5);
};
var byzQtyForEvents = function byzQtyForEvents(evts) {
    var total = new BigNumber(0);
    for (var i = 0; i < evts.length; i++) {
        total = total.plus(byzQtyForEvent(evts[i]));
    }
    return total;
};

var getByzData = function getByzData(options, cb) {
    var web3Inner = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io:443'));

    var address = options.address || "0x0";
    var nEvents = options.events || 5;

    var liveSwap = new web3Inner.eth.Contract(byz.abi, byz.swapAddress, {
        from: address, // default from address
        gasPrice: '5000000000' // default gas price in wei, 5 gwei in this case
    });
    liveSwap.getPastEvents("DidSwap", {
        fromBlock: 0,
        toBlock: 'latest'
    }).then(function (res, y) {
        var swapEvents = res.filter(function (item) {
            return item.event == "DidSwap";
        });
        var mySwaps = swapEvents.filter(function (evt) {
            return evt.returnValues[0].toLowerCase() == address.toLowerCase();
        });

        var totalSwapped = new BigNumber(0);
        for (var i = 0; i < mySwaps.length; i++) {
            var evt = mySwaps[i];
            totalSwapped = new BigNumber(evt.returnValues[1]).plus(totalSwapped);
        }
        console.log(mySwaps);
        console.log(totalSwapped / new BigNumber(1e8));
        console.log('BYZ: ' + readable(byzQtyForEvents(mySwaps)));
        cb({
            byzBalance: readable(byzQtyForEvents(mySwaps)),
            events: swapEvents.reverse().slice(0, nEvents),
            totalSwapped: readable(new BigNumber(swapEvents[0].returnValues.totalSwapped))
        });
    });
};

getByzData({}, function (data) {
    console.log('Total swapped: ' + data.totalSwapped);
});
