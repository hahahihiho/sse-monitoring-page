# What is this project about

1. monitoring page
2. Update client side page when the server send data to user
3. subscribing blockchain node

## How to run test
* Command
    ```sh
    $ npx hardhat node # run local node
    $ node index.js # run page
    ```
* Page
    * open http://127.0.0.1:3000

* Test
    1. send GET request to http://127.0.0.1:3000/test
    2. Send transaction
    `$ npx hardhat run ./scripts/test-sample.js`

## How to use this app
* create .js file on the `/projects` directory by referring to the `/projects/test-sample.js`
