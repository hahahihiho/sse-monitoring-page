require("dotenv").config();
const ethers = require("ethers");

async function getTokens() {
    let accounts = await hre.ethers.getSigners();
    const rich = "0xdDf169Bf228e6D6e701180E2e6f290739663a784";
    const to = "0x95bf7e307bc1ab0ba38ae10fc27084bc36fcd605";
    const usdc = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75";
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [rich],
    });
    let signer = await hre.ethers.getSigner(rich);
    let token = await hre.ethers.getContractAt("IERC20Metadata", usdc, signer);
    // await accounts[0].sendTransaction({to:rich,value:ethers.utils.parseEther("1")})

    let decimal = await token.decimals();
    await token.transfer(to, '1'+'0'.repeat(decimal))
    let balance = await token.balanceOf(to);
    console.log(balance/1e6);
}
getTokens()
// const sendTx = {
//     to : "0x3D81181729C22C934396DFBa6E543b369ccdB0Ce",
//     gasPrice: 100_000_000_000,
//     value : 10_000e18
// }
// const tx = await wallet.sendTransaction(sendTx);
// console.log(tx);
