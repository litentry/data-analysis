const fetch = require('node-fetch');


//https://thegraph.com/explorer/subgraph/cuinf/cryptokitties?selected=playground
//https://api.thegraph.com/subgraphs/name/cuinf/cryptokitties
//POST
// query: "{↵  kittyOwners(first: 100, orderBy: tokenId, ↵    orderDirection: asc, where: {tokenId_gt: 800000}) {↵    ↵    owner↵    tokenId↵    contract↵  }↵}↵"
// variables: null 

exports.kittyOwners = function (asset_contract_address, startTokenId, batchCountPerCallTheGraph, callback) {

  const url = 'https://api.thegraph.com/subgraphs/name/cuinf/cryptokitties';
  const params = {
    query: "{  kittyOwners(first: " + batchCountPerCallTheGraph + ", orderBy: tokenId,  orderDirection: asc, where: { tokenId_gt: " + startTokenId + " }) {   owner    tokenId    contract  } }",
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

