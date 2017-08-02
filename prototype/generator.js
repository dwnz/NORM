const query = require('./services/query');
const async = require('async');

var model = 'var model = {';

query.query("select * from information_schema.tables where table_schema = 'public'", function (err, tables) {
    async.each(
        tables,
        CreateTableDetails,
        function () {
            model += '}; module.exports = model;';
            console.log(model);
            console.log("DONE!");
        }
    )
});

function CreateTableDetails(table, callback) {
    var output = '';

    async.waterfall([
        function GetSchema(next) {
            query.query('SELECT \
            a.attname as Column, \
            pg_catalog.format_type(a.atttypid, a.atttypmod) as Datatype \
            FROM \
            pg_catalog.pg_attribute a \
            WHERE \
            a.attnum > 0 \
            AND NOT a.attisdropped \
            AND a.attrelid = ( \
                SELECT c.oid \
            FROM pg_catalog.pg_class c \
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace \
            WHERE c.relname ~ \'^(' + table.table_name + ')$\' \
            AND pg_catalog.pg_table_is_visible(c.oid) \
            )', function (err, data) {
                next(err, data);
            });
        },

        function CreateJS(tableInfo, next) {
            console.log(tableInfo);

            output += table.table_name + ': new Model(\'' + table.table_name + '\',{';

            for (var i = 0; i < tableInfo.length; i++) {
                output += '   ' + tableInfo[i].column + ': new Field(\'' + tableInfo[i].column + '\', ' + GetType(tableInfo[i]);

                if (tableInfo[i].column === 'id') {
                    output += '      ,{auto: true}'
                }

                output += '),';
            }

            output = output.substring(0, output.length - 1);
            output += '}),';

            model += output;

            return callback(null);
        }
    ]);
}

function GetType(tableInfo) {
    switch (tableInfo.datatype) {
        case 'integer':
            return 'Number';

        case 'timestamp without time zone':
            return 'Date';

        default:
            return 'String';
    }
}
