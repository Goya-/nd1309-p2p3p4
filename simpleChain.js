/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB, { valueEncoding: 'json' });

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    this.hash = "",
      this.height = 0,
      this.body = data,
      this.time = 0,
      this.previousBlockHash = ""
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
class Blockchain {
  constructor() {
    let self = this;
    db.get('data', function (err, value) {
      if (value == undefined) {
        db.put('data', {
          "length": 0,
          "blocks": []
        }, function (err) {
          if (err) { return console.error("something wrong with", err) }
        });
        self.addBlock(new Block("First block in the chain - Genesis block"));
      } else if (err) {
        console.log("samething error", err)
      } else if (value != null) {
        console.log("chain is exists, read from database...")
      }
    })
  }

  // Add new block
  addBlock(newBlock) {
    console.log('add', newBlock)

    db.get('data', function (err, data) {
      if (data == undefined) return console.log('first init chain')
      if (err) return console.log('Add new block err', err)
      // Current Chain before add Block
      let tempChain = data;
      // Block height
      newBlock.height = tempChain.length;
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0, -3);
      // previous block hash
      if (tempChain.length > 0) {
        newBlock.previousBlockHash = tempChain.blocks[tempChain.length - 1].hash;
      }
      // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      // Adding block object to chain
      tempChain.blocks.push(newBlock);
      tempChain.length += 1;
      // Update data asynchronously
      db.put('data', tempChain, function (err) {
        if (err) {
          return console.log('Ooops!', err)
        } else {
          return console.log('Update Chain to ', tempChain)
        }
      })
    })
  }

  // Get block height
  getBlockHeight() {
    db.get('data', function (err, value) {
      console.log("getBlockHeight result is " + value.length - 1);
    })
  }

  // get block
  getBlock(blockHeight) {
    db.get('data', function (err, data) {
      if (err) return console.log('Get block is err', err);
      let block = data.blocks[blockHeight]
      if (block == undefined) return console.log('Blockheight ' + blockHeight + ' is out of index.');
    })
  }

  // validate block
  validateBlock(blockHeight) {
    db.get('data', function (err, data) {
      if (err) return console.log('Read chain when validateBlock is err', err);
      // get block object
      let block = data.blocks[blockHeight]
      if (block == undefined) return console.log('Blockheight ' + blockHeight + ' is out of index.');
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash === validBlockHash) {
        console.log('Block #' + blockHeight + ' is valid')
      } else {
        console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
      }
    })
  }

  // Validate blockchain
  validateChain() {
    let errorLog = [];
    db.get('data', function (err, data) {
      if (err) return console.log('Read chain when validateChain is err', err);
      let height = data.length;
      for (var i = 0; i < height - 1; i++) {
        let blockHash = data.blocks[i].hash;
        let previousHash = data.blocks[i + 1].previousBlockHash;
        if (blockHash !== previousHash) {
          errorLog.push(i);
        }
      }
      if (errorLog.length > 0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: ' + errorLog);
      } else {

        console.log('No errors detected');
      }
    })
  }

  // modify block's body to test
  setBlockBodyForTest(index, bodyString) {
    db.get('data', function (err, data) {
      if (err) return console.log('Read chain when validateChain is err', err);
      let templateChain = data;
      let block = templateChain.blocks[index];
      if (block == undefined) return console.log('Block # ' + index + ' is out of index.');

      block.body = bodyString;
      console.log('old hash is ' + block.hash)
      block.hash = SHA256(JSON.stringify(block)).toString();
      console.log('new hash is ' + block.hash)


      // Update data asynchronously
      db.put('data', templateChain, function (err) {
        if (err) {
          return console.log('Ooops!', err)
        } else {
          return console.log('Update Block #' + index + ' body to ' + bodyString)
        }
      })
    })
  }
}
module.exports = { Block, Blockchain }