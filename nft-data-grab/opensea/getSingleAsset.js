const fetch = require('node-fetch');

exports.run = function (asset_contract_address, token_id, callback) {

  const url = 'https://api.opensea.io/api/v1/asset/' + asset_contract_address + '/' + token_id + '/';
  const options = { method: 'GET' };

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
