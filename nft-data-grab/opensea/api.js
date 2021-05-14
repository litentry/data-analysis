const fetch = require('node-fetch');

exports.getSingleAsset = function (asset_contract_address, token_id) {
  var promise = new Promise(function (resolve, reject) {

    const url = 'https://api.opensea.io/api/v1/asset/' + asset_contract_address + '/' + token_id + '/';
    const options = { method: 'GET' };

    console.log(url);
    fetch(url, options)
      .then(res => res.json())
      .then(json => {
        //console.log(json); 
        resolve(json);
      })
      .catch(err => {
        console.error('error:' + err);
        reject(error);
      }
      );
  });
  return promise;
}

exports.getAssetsByBatch = function (asset_contract_address, token_id_array) {
  var promise = new Promise(function (resolve, reject) {

    var urlParam = "?asset_contract_address=" + asset_contract_address + "&";
    var tokenIdStr = "";
    for (let index = 0; index < token_id_array.length; index++) {
      const t = token_id_array[index];
      if (tokenIdStr) { tokenIdStr += "&"; }
      tokenIdStr += "token_ids=" + t;
    }
    const url = 'https://api.opensea.io/api/v1/assets' + urlParam + tokenIdStr;

    const options = { method: 'GET' };

    console.log(url);
    fetch(url, options)
      .then(res => res.json())
      .then(json => {
        //console.log(json); 
        resolve(json);
      })
      .catch(err => {
        console.error('error:' + err);
        reject(error);
      }
      );
  });
  return promise;
}
