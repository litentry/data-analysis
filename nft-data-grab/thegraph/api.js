const fetch = require('node-fetch');



// kittyOwners
// https://api.thegraph.com/subgraphs/name/cuinf/cryptokitties

// polkamonOwners
// https://api.thegraph.com/subgraphs/name/cuinf/polkamon

// nftOwners
// https://api.thegraph.com/subgraphs/name/cuinf/zedhorse


//https://thegraph.com/explorer/subgraph/cuinf/cryptokitties?selected=playground
//https://api.thegraph.com/subgraphs/name/cuinf/cryptokitties
//POST
// query: "{↵  kittyOwners(first: 100, orderBy: tokenId, ↵    orderDirection: asc, where: {tokenId_gt: 800000}) {↵    ↵    owner↵    tokenId↵    contract↵  }↵}↵"
// variables: null 

exports.callApi = function (apiUrl, apiName, asset_contract_address, startTokenId, batchCountPerCallTheGraph, callback) {

  const url = apiUrl;
  const params = {
    query: "{  " + apiName + "(first: " + batchCountPerCallTheGraph + ", orderBy: tokenId,  orderDirection: asc, where: { tokenId_gt: " + startTokenId + " }) {   owner    tokenId    contract  } }",
    variables: null
  }
  const options = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  };

  fetch(url, options)
    .then(res => res.json())
    .then(json => {
      //console.log(json); 
      if (callback) {
        callback(json)
      }
    })
    .catch(err => console.error('error:' + err));
}

