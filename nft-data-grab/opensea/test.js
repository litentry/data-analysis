var getSingleAsset = require("./getSingleAsset");

var getAssetsByPage = require("./getAssetsByPage");

var asset_contract_address = "0x495f947276749ce646f68ac8c248420045cb7b5e";
// asset_contract_address='';
const offset = 0;
const limit = 1;

getAssetsByPage.run(offset, limit, asset_contract_address, (json) => {
    var assets = json.assets;
    if (assets && assets.length > 0) {
        assets.forEach(element => {
            console.log(element);
            // console.log("id:", element.id);
            // console.log("token_id:", element.token_id);
            // console.log("name:", element.name);
            // console.log("image_url:", element.image_url);
            // // console.log("image_preview_url:", element.image_preview_url);
            // // console.log("description:", element.description);
            // // console.log("external_link:", element.external_link);
            // console.log("asset_contract.address:", element.asset_contract.address);
            // // console.log("owner:", element.owner);

            // getSingleAsset.run(element.asset_contract.address, element.token_id, (json) => {
            //     console.log("single asset:", json);
            // })
        });
    }
});