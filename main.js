const Web3 = require('web3');
const byz = require('./swap');
const BigNumber = require('bignumber.js');

const readable = (n) => {
    return n.dividedBy(new BigNumber(1e8)).toString();
}
const byzQtyForEvent = (evt) => {
    return new BigNumber(evt.returnValues[1]).multipliedBy(5);
}
const byzQtyForEvents = (evts) => {
    let total = new BigNumber(0)
    for(var i=0; i< evts.length; i++) {
        total = total.plus(byzQtyForEvent(evts[i]));
    }
    return total;
}

const getByzData = (options, cb) => {
    let web3Inner = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io:443'))

    let address = options.address || "0x0000000000000000000000000000000000000000";
    let nEvents = options.events || 5;

    var liveSwap = new web3Inner.eth.Contract(byz.abi, byz.swapAddress, {
        from:  address, // default from address
        gasPrice: '5000000000' // default gas price in wei, 5 gwei in this case
    });
    liveSwap.getPastEvents("DidSwap",
    {
        fromBlock: 0,
        toBlock: 'latest'
    })
    .then((res,y) => {
        let swapEvents = res.filter((item) => { return item.event == "DidSwap"});
        let mySwaps = swapEvents.filter((evt) => { return evt.returnValues[0].toLowerCase() == address.toLowerCase() });
        
        let totalSwapped = new BigNumber(0);
        for(var i=0;i<mySwaps.length;i++) {
            let evt = mySwaps[i];
            totalSwapped = new BigNumber(evt.returnValues[1]).plus(totalSwapped);
        }
        console.log(mySwaps);
        console.log(totalSwapped / new BigNumber(1e8));
        console.log(`BYZ: ${readable(byzQtyForEvents(mySwaps))}`);
        cb(
            {
                byzBalance: readable(byzQtyForEvents(mySwaps)),
                events: swapEvents.reverse().slice(0, nEvents),
                totalSwapped: readable(new BigNumber(swapEvents[0].returnValues.totalSwapped))
            }
        );
    });
}

let lastEventBlocknum = -1;
const updateLoop = () => {
    console.log('updateLoop');
    getByzData({}, (data) => {
        console.log(`${data.events[0].blockNumber} == ${lastEventBlocknum}`)
        if(data.events[0].blockNumber == lastEventBlocknum) {
            // No new event
            console.log("No news today :[");
        }
        else {
            // Some new event
            console.log(`Total swapped: ${data.totalSwapped}`);
            console.log(`Latest Event ${JSON.stringify(data.events[0])}`);
            lastEventBlocknum = data.events[0].blockNumber;
        }
        setTimeout(updateLoop, 5000);
    });
}
updateLoop();