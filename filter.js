var through2 = require('through2')
var qss = require('./querystring')
var context = require('./context')

module.exports = function (db) {

  return function createFilterStream(q) {
    // defer to createReadStream if an object is passed, at least for now
    if (typeof q !== 'string') return db.createReadStream(q)

    // grab top level `key` data, if any
    var key = query.key

    var filter = filterStream(q)

    // TODO: use key ltgt data, if any
    return db.createReadStream().pipe(filter)
  }
}

var filterStream = module.exports.stream = function (q) {
  var query = qss.parse(q)

  // TODO: make this suck less
  var schema = {
    properties: {
      // TODO: `allOf` w/ base value schema, allow base key schema as well
      value: query
    }
  }

  // TODO: context.compileAsync (if we allow external refs)
  var validate = context.compile(schema)

  return through2.obj(function (data, enc, cb) {
    if (validate(data)) {
      cb(null, data)
    }
    else {
      // TODO: allow a verbose mode to see filtered data?
      cb()
    }
  })
}
