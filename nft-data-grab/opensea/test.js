var api = require("./api");

var asset_contract_address = "0x06012c8cf97bead5deae237070f9587f8e7a266d";
// asset_contract_address='';
const token_id = "6000";
api.getSingleAsset(asset_contract_address, token_id).then((json) => {
    console.log("single asset:", json);
}, (error) => {
    console.log(error);
});