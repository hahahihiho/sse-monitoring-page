
const ethers = require("ethers");
const tx_util = require("../modules/ethers-tx-util");

const url = "http://127.0.0.1:8545";
const ws_url = "ws://127.0.0.1:8545";

const INFO = tx_util.configUtils.get_additional_info("contract"); // get info from ./config/contract_info.json

const providers = {}

// create provider when it is necessary
function getProvider(url){
    const protocol_type = url.split(":")[0]
    if(providers[protocol_type] == undefined || !providers[protocol_type].isConnected()){
        providers[protocol_type] = new tx_util.ethersUtils.ProviderModule(url)
    }
    return providers[protocol_type]
}

async function getData(){
    const provider = getProvider(url)
    const data = {};
    const contract = new ethers.Contract(INFO.test.usdc.address,INFO.test.usdc.abi,provider);
    const centreBalance = await contract.balanceOf("0x95bf7e307bc1ab0ba38ae10fc27084bc36fcd605");
    data["centre's usdc balance"] = centreBalance/1e6;
    return data
}

function listening(sendEventsToAll){
    const ws_provider = getProvider(ws_url)
    const filter = {
        address : INFO.test.usdc.address,
        topics : [
            ethers.utils.id("Transfer(address,address,uint256)")
        ]
    }
    const listener = ws_provider.on(filter,(...args) => {
        // future : 5초내로 또 불렸을시 호출하지 않게(너무 자주 update되지 않게)
        getData().then(data => sendEventsToAll(data));
    })
    return listener;
}

// run only when it is directly run
if (typeof require !== 'undefined' && require.main === module) {
    getData();
}

module.exports = {
    getData,
    listening,
};

