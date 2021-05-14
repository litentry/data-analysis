const { off } = require("process");
var mysqlQuery = require("../db/mysqlQuery");
var theGraphApi = require("../thegraph/api");

const batchCountPerCallTheGraph = 50;

mysqlQuery.queryNftContracts((d) => {
    if (!d) { return; }

    var contractPendingFetch = d;
    console.log("contractPendingFetch:", contractPendingFetch);

    contractPendingFetch.forEach(c => {

        var nft_object_token_id_max = c.nft_object_token_id_max;
        console.log("nft_object_token_id_max:", nft_object_token_id_max);

        var asset_contract_address = c.address;
        var nft_contract_id = c.id;
        var startTokenId = nft_object_token_id_max;
        var apiUrl = c.apiUrl;
        var apiName = c.apiName;
        //retrieve 
        retrieveTheGraph(apiUrl, apiName, nft_contract_id, asset_contract_address, startTokenId, batchCountPerCallTheGraph);

    })
});

function retrieveTheGraph(apiUrl, apiName, nft_contract_id, asset_contract_address, startTokenId, batchCountPerCallTheGraph) {
    console.log("run retrieveTheGraph: ", apiUrl, "\t", apiName, "\t", asset_contract_address, "\t", startTokenId, '\t', batchCountPerCallTheGraph);

    theGraphApi.callApi(apiUrl, apiName, asset_contract_address, startTokenId, batchCountPerCallTheGraph, (json) => {

        // {
        //     "data": {
        //       "kittyOwners": [
        //         {
        //           "contract": "0x06012c8cf97bead5deae237070f9587f8e7a266d",
        //           "owner": "0xb367b96bd9af396dc5281cfdcd9e9571f670832f",
        //           "tokenId": "800001"
        //         }]
        //     }
        // }
        var data = json.data;
        if (data && data.kittyOwners && data.kittyOwners.length > 0) {
            var arr = [];
            data.kittyOwners.forEach(t => arr.push(t.tokenId));
            var distinctTokenIds = Array.from(new Set(arr));
            console.log("distinctTokenIds:", distinctTokenIds);
            saveTokenIds(nft_contract_id, distinctTokenIds);

            var maxTokeId = distinctTokenIds[distinctTokenIds.length - 1];
            updateContractMaxTokenId(nft_contract_id, maxTokeId);

            if (data.kittyOwners.length < batchCountPerCallTheGraph) {
                //stop
                console.log("fetch count < batchCountPerCallTheGraph, reach the end and stop retrieve");
                return;
            } else {
                startTokenId = maxTokeId;
                retrieveTheGraph(apiUrl, apiName, nft_contract_id, asset_contract_address, startTokenId, batchCountPerCallTheGraph);
            }
        } else {
            console.log("fetch no data , stop retrieve");
        }
    });

}



function saveTokenIds(nft_contract_id, distinctTokenIds) {

    var addObjSql = "INSERT INTO `nft_token`(`id`, `nft_contract_id`, `token_id`) VALUES ";
    var addObjSqlParams = [];

    var values = "";
    for (let index = 0; index < distinctTokenIds.length; index++) {
        const tokenId = distinctTokenIds[index];
        if (values) { values += ","; }
        values += "(0," + nft_contract_id + ",'" + tokenId + "')";
    }
    mysqlQuery.query(addObjSql + values, addObjSqlParams, (results, fields) => {
        // console.log(results);
    });



}

function updateContractMaxTokenId(nft_contract_id, maxTokenId) {

    var updateSql = "UPDATE  `nft_contract` SET `nft_object_token_id_max`= ? WHERE id= ? ";
    var sqlParams = [maxTokenId, nft_contract_id];
    mysqlQuery.query(updateSql, sqlParams, (results, fields) => {
        // console.log(results);
    });
}


