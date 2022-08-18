
const ethers = require("ethers");
const tx_util = require("../modules/ethers-tx-util");

const url = "http://127.0.0.1:8545";
const ws_url = "ws://127.0.0.1:8545";

async function getData(){
    const provider = new ethers.providers.JsonRpcProvider(url);
    console.log("connected on: ", provider.connection);
    const data = {};
    const contracts = [];
    const INFO = tx_util.get_additional_info("contract");
    const contract = new ethers.Contract(INFO.test.usdc.address,INFO.test.usdc.abi,provider);
    const centreBalance = await contract.balanceOf("0x95bf7e307bc1ab0ba38ae10fc27084bc36fcd605");
    // console.log((centreBalance/10e6));
    data["centre's usdc balance"] = centreBalance/1e6;
    return data
}

function listening(sendEventsToAll){
    const INFO = tx_util.get_additional_info("contract");
    const ws_provider = new ethers.providers.WebSocketProvider(ws_url)
    const filter = {
        address : INFO.test.usdc.address,
        topics : [
            ethers.utils.id("Transfer(address,address,uint256)")
        ]
    }
    const listener = ws_provider.on(filter,(...args) => {
        // 5초내로 또 불렸을시 호출하지 않게(너무 자주 update되지 않게)
        getData().then(data => sendEventsToAll(data));
    })
    return listener;
}

// run only when it is called
if (typeof require !== 'undefined' && require.main === module) {
    getData();
}

module.exports = {
    getData,
    listening
};

