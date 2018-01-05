const fs = require('fs')
const tape = require('tape')
const spawn = require('tape-spawn')
const net = require('net')
const Web3 = require('web3')
const process = require('process')
const color = require('colors')
const child_process = require('child_process')

const useLocalSolc = true

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:4242"))

function invokeCompiler(input) {
    if (useLocalSolc) {
        var result = child_process.spawnSync('solc', ['--optimize', '--standard-json', '-'], {input: input, encoding: 'utf-8'})
        if (result.status != 0) {
            console.log("Error invoking compiler:".red)
            console.log(result.output[2])
        }
        return result.output[1]
    } else {
        return require('solc').compileStandard(input)
    }
}

function checkForErrors(results) {
    if (!results) {
        console.log("Error invoking compiler (results is invalid).")
        process.exit(1)
    }
    var anyError = false
    if (results.errors) {
        for (var e of results.errors) {
            if (e.severity != 'warning') {
                console.log(e.formattedMessage.red)
                anyError = true
            }
        }
    }
    if (anyError) {
        process.exit(1)        
    }
}


function compile() {
    const solc = require('solc')
    function readFile(name) {
        return fs.readFileSync(name, {encoding: 'utf-8'})
    }

    const compilerInput_runner = {
        'language': 'Solidity',
        'sources': {
            'scryptFramework.sol': {'content': readFile('contracts/scryptFramework.sol')},
            'scryptRunner.sol': {'content': readFile('contracts/scryptRunner.sol')}
        }
    }
    
    runnerCode = Buffer(fs.readFileSync(__dirname+'/offchain_evm'))
    runnerABI = JSON.parse(fs.readFileSync(__dirname+'/offchain_abi.json'))
}

async function deployContract(c_code, c_abi, c_addr, b_account, c_gas, bool_log) {
    //commented out parts don't work with old web3
  //var block = await web3.eth.getBlockNumber()
  //  if (bool_log) console.log("At block " + block)
    var contract
    if (c_addr) {
        contract = web3.eth.contract(c_abi).new({from: b_account, data: c_code, gas: c_gas});
    } else {
        console.log("Deploying new contract")
        contract = web3.eth.contract(c_abi).new({from: b_account, data: c_code, gas: c_gas});
    }
    //if (bool_log) console.log("contract deployed at ".blue + contract.options.address.blue)
    return contract
}

async function setupAccount(_account) {
    console.log("Account setup...".green)
    var account = _account ? _account : await web3.eth.personal.newAccount('')
    console.log("Using account: ".cyan + account.cyan)
    await web3.personal.unlockAccount(account, '', '0x1000000')
    //await web3.miner.start(2)
    //var account = "0x292248f34a6e929dd4820535b41219ba81d79255"
    return account
}

console.log("Compiling contracts...".green)
compile()

module.exports = {
    setupAccount: setupAccount,
    deployContract: deployContract,
}