const { off } = require("process");
var mysqlQuery = require("../db/mysqlQuery");
var openseaApi = require("../opensea/api");

const batchCountPerTokenBatch = 100;



let run = async function () {

    var contractPendingFetch = await queryContracts();
    console.log("contractPendingFetch:", contractPendingFetch);

    for (let index = 0; index < contractPendingFetch.length; index++) {
        const c = contractPendingFetch[index];
        var apiName = c.apiName;
        var asset_contract_address = c.address;
        var nft_contract_id = c.id;
        console.log(apiName, "asset_contract_address:", asset_contract_address, nft_contract_id);

        var loop = true;
        //retrieve 
        while (loop) {
            var tokenList = await retrieveUnHandleToken(nft_contract_id);
            if (tokenList && tokenList.length > 0) {
                console.log(tokenList);

                for (let index = 0; index < tokenList.length; index++) {
                    const token = tokenList[index];
                    var token_id = token.token_id;
                    var tokenAsset = await retrieveOpenSea(asset_contract_address, token_id);
                    if (tokenAsset) {
                        saveTokenAssetData(nft_contract_id, tokenAsset);
                        updateTokenRetrieveStatus(token.id);
                    }
                }
            }
            else {
                console.log("there is not token pending handle, all finished.");
                loop = false;
            }
        }
    }
}

run();


function queryContracts() {
    var promise = new Promise(function (resolve, reject) {
        mysqlQuery.queryNftContracts().then((d) => {
            if (!d) { return; }
            resolve(d);
        });
    });
    return promise;
}
function retrieveUnHandleToken(nft_contract_id) {
    var sql = "SELECT * FROM `nft_token` WHERE nft_contract_id = " + nft_contract_id + " AND retrieve_detail_from_opensea = 0 ORDER BY	id 	LIMIT " + batchCountPerTokenBatch;
    var arr = [];
    var promise = new Promise(function (resolve, reject) {

        mysqlQuery.query(sql, arr).then((results) => {
            var tokens = [];
            if (results && results.length > 0) {
                console.log("get row count:" + results.length);
                for (let index = 0; index < results.length; index++) {
                    const row = results[index];
                    tokens.push({ ...row });
                }
            }
            resolve(tokens);
        })
    });
    return promise;
}


function saveTokenAssetData(nft_contract_id, asset) {

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

    var addObjSql = "INSERT INTO `nft_object_detail`(`id`, `nft_contract_id`, `name`, `token_id`, `image_url`, `image_preview_url`, `image_thumbnail_url`, `owner_address`, `owner_user`, `last_sale`, `release_date`) VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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


function retrieveOpenSea(asset_contract_address, token_id) {

    console.log("retrieveOpenSea: ", asset_contract_address, "\t", token_id);

    var promise = new Promise(function (resolve, reject) {

        openseaApi.getSingleAsset(asset_contract_address, token_id).then((json) => {

            var asset = json;
            if (asset) {
                resolve(asset);

            }
        }, (error) => {
            console.log(error);
            reject(error);
        });

    });
    return promise;

}


function updateTokenRetrieveStatus(id) {

    var updateSql = "UPDATE  `nft_token` SET `retrieve_detail_from_opensea`= ? WHERE id= ? ";
    var sqlParams = [1, id];
    mysqlQuery.query(updateSql, sqlParams, (results, fields) => {
        // console.log(results);
    });
}


