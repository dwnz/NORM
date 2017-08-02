const query = require('./services/query');

function Query(schema) {
    "use strict";

    this.schema = schema;
    this.whereArgs = null;

    this.where = function (filter, callback) {
        this.whereArgs = filter;

        if (callback) {
            return this.exec(callback);
        }

        return this;
    };

    this.orderby = function (filter, callback) {
        this.orderByArgs = filter;

        if (callback) {
            return this.exec(callback);
        }

        return this;
    };

    this.exec = function (callback) {
        var sql = "SELECT * FROM " + this.schema.table;
        var args = [];

        if (this.whereArgs) {
            sql += ' WHERE ';

            var index = 1;
            for (var item in this.whereArgs) {
                sql += ' ' + item + '=$' + index;
                args.push(this.whereArgs[item]);
                index++;
            }
        }

        if (this.orderByArgs) {
            sql += ' ORDER BY ';

            for (var item in this.orderByArgs) {
                sql += item + ' ' + this.orderByArgs[item] + ','
            }

            sql = sql.substring(0, sql.length - 1);
        }

        console.log("SQL:", sql, "ARGS:", args);

        query.query(sql, args, callback);
    };
}

function Model(table, schema) {
    this.table = table;
    this.schema = schema;

    this.query = new Query(this);

    this.create = function (model, callback) {
        var toInsert = {};
        var columns = 0;

        for (var item in this.schema) {
            toInsert[item] = this.schema[item];
            columns++;
        }

        for (var item in model) {
            toInsert[item].set(model[item]);
        }

        var sql = 'INSERT INTO ' + this.table;

        sql += '(';
        for (var column in toInsert) {
            if (!toInsert[column].auto) {
                sql += toInsert[column].name + ',';
            } else {
                columns--;
            }
        }
        sql = sql.substring(0, sql.length - 1);
        sql += ')';

        sql += 'VALUES (';
        for (var i = 0; i < columns; i++) {
            sql += '$' + (i + 1) + ',';
        }
        sql = sql.substring(0, sql.length - 1);
        sql += ')';

        var args = [];
        for (var item in toInsert) {
            var modelItem = toInsert[item];

            if (!modelItem.auto) {
                if ((modelItem.get() === null || modelItem.get() === undefined) && modelItem.required) {
                    throw new Error("Required field is missing value - " + item + "," + this.table);
                }
                args.push(toInsert[item].get());
            }
        }

        console.log(sql, args);

        query.query(sql, args, function () {
            console.log(arguments);
        });
    };
}

function Field(name, type, options) {
    "use strict";

    if (!options) {
        options = {};
    }

    this.name = name;
    this.type = type;
    this.required = options.required || false;
    this.auto = options.auto || false;
    this.value = null;
    this.dirty = false;

    this.set = function (value) {
        this.dirty = true;
        this.value = value;
    };

    this.get = function () {
        return this.value;
    }
}

var user = new Model('users', {
    id: new Field('id', Number, {auto: true}),
    login: new Field('login', String),
    avatarUrl: new Field('avatar_url', String),
    name: new Field('name', String)
});

/*user.create({
 //id: 1,
 name: "Daniel 2"
 });*/

user.query.where({id: 1}).orderby({login: 'DESC'}).exec(function (err, data) {
    console.log(data);
});