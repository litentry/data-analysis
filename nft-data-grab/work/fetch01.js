const { off } = require("process");
var mysqlQuery = require("./../db/mysqlQuery");
var getAssetsByPage = require("./../opensea/getAssetsByPage");

const limitPerCall = 20;

function retrieveOpenSea(nft_contract_id, asset_contract_address, offset, limitPerCall, maxOffset) {
    console.log("run retrieveOpenSea: ", asset_contract_address, "\t", offset, '\t', limitPerCall, '\t', maxOffset);

    updateContractOffset(nft_contract_id, offset);

    getAssetsByPage.run(offset, limitPerCall, asset_contract_address, (json) => {

        var assets = json.assets;
        if (assets && assets.length > 0) {
            assets.forEach(asset => {
                saveData(nft_contract_id, asset);
            });
            if (assets.length < limitPerCall) {
                //stop
                console.log("fetch count < limitPerCall, reach the end and stop retrieveOpenSea");
                return;
            } else {
                if (offset + limitPerCall > maxOffset) {
                    console.log("reach the maxOffset , stop retrieveOpenSea，Offset cannot exceed " + maxOffset);
                    return;
                }
                retrieveOpenSea(nft_contract_id, asset_contract_address, offset + limitPerCall, limitPerCall, maxOffset);
            }
        }
    });

}

mysqlQuery.queryNftContracts((d) => {
    if (!d) { return; }

    var contractPendingFetch = d;
    console.log("contractPendingFetch:", contractPendingFetch);

    contractPendingFetch.forEach(c => {
        if (c.fetch_object_completed && c.fetch_object_completed != 0) {
            console.log("fetch_object_completed==1, ignore fetch");
            return;
        };

        var offset = c.nft_object_fetch_offset;
        var maxOffset = c.nft_object_max_offset;
        console.log("nft_object fetch offset:", offset);
        console.log("nft_object max offset:", maxOffset);

        if (offset < maxOffset) {
            var asset_contract_address = c.address;
            var nft_contract_id = c.id;
            //retrieve 
            retrieveOpenSea(nft_contract_id, asset_contract_address, offset, limitPerCall, maxOffset);
        }
        else {
            console.log("nft_object offset < maxOffset",",ignore fetch");
        }
    })
});



function saveData(nft_contract_id, asset) {

    var id_opensea = asset.id;
    var name = asset.name || ''
    var token_id = asset.token_id;
    var image_url = asset.image_url || '';
    var image_preview_url = asset.image_preview_url || '';
    var image_thumbnail_url = asset.image_thumbnail_url || '';

    // var asset_contract_type = '';
    // var asset_contract_name = '';
    // var asset_contract_address = '';
    // if (asset.asset_contract) {
    //     asset_contract_address = asset.asset_contract.address || '';
    //     asset_contract_type = asset.asset_contract.asset_contract_type || '';
    //     asset_contract_name = asset.asset_contract.name || '';
    // }
    var owner_address = '';
    var owner_user = '';
    if (asset.owner) {
        owner_address = asset.owner.address || '';
        if (asset.owner.user) {
            owner_user = asset.owner.user.username || '';
        }
    }

    var last_sale = null;
    if (asset.last_sale) {
        // console.log(asset.last_sale);
        last_sale = asset.last_sale.event_timestamp;
    }
    var release_date = asset.listing_date;

    var addObjSql = "INSERT INTO `nft_object`(`id`, `nft_contract_id`, `name`, `token_id`, `image_url`, `image_preview_url`, `image_thumbnail_url`, `owner_address`, `owner_user`, `last_sale`, `release_date`) VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    var addObjSqlParams = [nft_contract_id,
        name, token_id,
        image_url,
        image_preview_url,
        image_thumbnail_url,
        owner_address,
        owner_user,
        last_sale,
        release_date];
    mysqlQuery.query(addObjSql, addObjSqlParams, (results, fields) => {
        // console.log(results);
    });


    var asset_contract = '';
    if (asset.asset_contract) {
        asset_contract = JSON.stringify(asset.asset_contract);
    }
    var owner = ''; if (asset.owner) {
        owner = JSON.stringify(asset.owner);
    }
    var traits = '';
    if (asset.traits) {
        traits = JSON.stringify(asset.traits);
    }
    var addObjExtSql = 'INSERT INTO `nft_object_ext`(`id`, `asset_contract`, `owner`, `traits`, `id_opensea`) VALUES (0, ?, ?, ?, ?)';

    var addObjExtSqlParams = [asset_contract, owner, traits, id_opensea];
    mysqlQuery.query(addObjExtSql, addObjExtSqlParams, (results, fields) => {
        // console.log(results);
    });
}

function updateContractOffset(nft_contract_id, offset) {

    var updateSql = "UPDATE  `nft_contract` SET `nft_object_fetch_offset`= ? WHERE id= ? ";
    var sqlParams = [offset, nft_contract_id];
    mysqlQuery.query(updateSql, sqlParams, (results, fields) => {
        // console.log(results);
    });
}


