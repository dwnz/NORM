const config = require('config');

const {
    Pool
} = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'kustompage',
});

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

exports.query = function (query, params, callback) {
    if (!callback) {
        callback = params;
        params = [];
    }

    pool.connect((err, client, done) => {
        if (err) {
            throw err;
        }

        client.query(query, params, function (err, res) {
            done();

            if (err) {
                return callback(err);
            }

            callback(err, res.rows === null ? [] : res.rows);
        });
    });
};