var through2 = require('through2')
var qss = require('./querystring')
var context = require('./context')

exports.value = function (q) {
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
