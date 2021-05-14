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
