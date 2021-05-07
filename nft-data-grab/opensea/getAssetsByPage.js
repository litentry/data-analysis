const fetch = require('node-fetch');

exports.run = function (offset, limit, asset_contract_address, callback) {

  var url = 'https://api.opensea.io/api/v1/assets?order_direction=desc&offset=' + offset + '&limit=' + limit + '';
  if (asset_contract_address) {
    url += "&asset_contract_address=" + asset_contract_address;
  }
  const options = { method: 'GET' };

  fetch(url, options)
    .then(res => res.json())
    .then(json => {
      //console.log(json);
      if (callback) {
        callback(json);
      }
    })
    .catch(err => console.error('error:' + err));
}