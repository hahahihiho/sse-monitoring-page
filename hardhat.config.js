require("@nomiclabs/hardhat-waffle"); // ethers
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork : "localhost",
  networks : {
    hardhat:{
      // accounts : account_balance_list,
      forking:{
        url : "https://rpc.ftm.tools/",
      }
    },
    localhost : {
      url : "http://127.0.0.1:8545",
    }
  },
  solidity: "0.8.9",
};
