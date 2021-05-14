
var mysql = require('mysql');
//create mysql connection pool
var pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'Mysql-2019',
    database: 'nftsea',
    charset: 'utf8mb4'
});

exports.query = function (sql, arr, callback) {
    var promise = new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            if (err) { throw err; return; }
            connection.query(sql, arr, function (error, results, fields) {
                connection.release();
                if (error) { reject(error) }
                resolve(results);
            });
        });

    });
    return promise;

};

exports.queryNftContracts = function () {

    var self = this;
    var promise = new Promise(function (resolve, reject) {

        var sql = 'SELECT * from nft_contract';
        var arr = [];
        self.query(sql, arr).then(function (results) {
            // console.log(results);
            var contractPendingFetch = [];
            if (results && results.length > 0) {
                console.log("get row count:" + results.length);
                console.log('id', "\t", "address");
                for (let index = 0; index < results.length; index++) {
                    const row = results[index];
                    console.log(row.id, "\t", row.address);
                    contractPendingFetch.push({ ...row });
                }
            }
            console.log(contractPendingFetch);
            resolve(contractPendingFetch);


        }, function (error) {
            reject(error);
        });

    });
    return promise;

}

exports.queryNftObjectCount = function (nft_contract_id, callback) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {

        var sql = 'SELECT count(id) as count from nft_object where nft_contract_id=? ';
        var arr = [nft_contract_id];

        self.query(sql, arr).then(function (results) {
            var objectCount = 0;
            if (results && results.length > 0) {
                objectCount = results[0].count;
            }
            resolve(objectCount);
        }, function (error) {
            reject(error);
        });

    });
    return promise;
}
