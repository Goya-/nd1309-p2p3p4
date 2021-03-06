const express = require('express');
const simpleChain = require('./simpleChain');
const bodyParser = require('body-parser');
const notaryService = require('./NotaryService').NotaryService;
const Validator = require('jsonschema').Validator;
const v = new Validator();
const Blockchain =simpleChain.Blockchain;

let blockchain = new Blockchain();
let notary = new notaryService();

const PORT = 8000;
let app = express();

app.use(bodyParser.json());

// get block, return block json
app.get(
    '/block/:height',(req,res)=>{
    blockchain.getBlock(req.params.height)
        .then(result => res.send(result))
        .catch(blockHeight => res.send({ error:'Blockheight '+ blockHeight + ' is out of index.'}))       
});

// post block, return new block json
app.post(
    '/block',(req,res)=>{ 
    const reqSchema = {
        "type": "object",    
        "properties": {
            "address": {"type":"string"},
            "star":{
                "type": "object",
                "required":["dec","ra","story"],
                "properties": {
                    "dec": {
                        "type": "string",
                        "pattern": "^(\-?\\d+)°\\s(\-?\\d+)'\\s(\-?\\d+(\.\\d+)?)\"$"
                    },
                    "ra": {
                        "type": "string",
                        "pattern": "^\\d+h\\s\\d+m\\s\\d+(\.\\d+)?s$"
                    },
                    "story": {
                        "type": "string",
                        "pattern": "^[\x20-\x7F]{1,250}$"
                    }
                }
            },
        }
    }
    const validatorResult = v.validate(req.body, reqSchema);
    // console.log("validator result", validatorResult);
    if (validatorResult.valid) {
        blockchain.addBlock(req.body.address, req.body.star)
            .then(result => res.send(result))
            .catch(reject => res.send(reject));
    } else {
        res.send(`
        error, request should like :
        {
            "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            "star":{
                "dec": "-26° 29' 24.9"",
                "ra": "16h 29m 1.0s",
                "story": "Found star using https://www.google.com/sky/(max 250 words)"
            }
        }       
        `);
    }
});

app.post(
    '/requestValidation',(req,res)=>{
        if(req.body.hasOwnProperty("address")){
            notary.requestValidation(req.body.address)
                .then(resolve => res.send(resolve))
                .catch(reject=> res.send(reject));
        } else {
            res.send('error:request should like {"address":"XXXXXXXXXXXXX"}');
        }
    }
);

app.post(
    '/message-signature/validate',(req,res)=>{
        if (req.body.hasOwnProperty("address") && req.body.hasOwnProperty("signature")){
            notary.validateMessage(req.body.address,req.body.signature)
                .then(resolve =>res.send(resolve))
                .catch(reject => {
                    res.send(reject)
                });
        } else {
            res.send('error:request should like {"address":"XXXXXXX","signature":"xxxxxxxxx"}');
        }
    }
);

app.get(
    '/stars/address::ADDRESS',(req,res)=>{
        blockchain.getBlocksByAddress(req.params.ADDRESS).then(result=>res.send(result));
    }
);

app.get(
    '/stars/hash::HASH', (req, res) => {
        blockchain.getBlocksByHash(req.params.HASH).then(result => res.send(result));
    }
);

app.get('/validationPool',(req,res)=>{
    notary.getValidationPool().then(resolve=>res.send(resolve))
})
app.listen(PORT,() => console.log('run server on port '+PORT));