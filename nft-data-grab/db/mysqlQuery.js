
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

    pool.getConnection(function (err, connection) {
        if (err) { throw err; return; }
        connection.query(sql, arr, function (error, results, fields) {
            connection.release();
            if (error) throw error;
            callback && callback(results, fields);
        });
    });
};

exports.queryNftContracts = function (callback) {
    var sql = 'SELECT * from nft_contract';
    var arr = [];
    this.query(sql, arr, (results, fields) => {
        var contractPendingFetch = [];
        if (results && results.length > 0) {
            console.log("get row count:" + results.length);
            console.log('id', "\t", "address");
            for (let index = 0; index < results.length; index++) {
                const row = results[index];
                // console.log(row.id, "\t", row.address);
                contractPendingFetch.push({ ...row });
            }
        }
        if (callback) {
            callback(contractPendingFetch);
        }
    });
}

exports.queryNftObjectCount = function (nft_contract_id, callback) {

    var sql = 'SELECT count(id) as count from nft_object where nft_contract_id=? ';
    var arr = [nft_contract_id];

    this.query(sql, arr, (results, fields) => {
        var objectCount = 0;
        if (results && results.length > 0) {
            objectCount = results[0].count;
        }
        if (callback) {
            callback(objectCount);
        }
    });
}
