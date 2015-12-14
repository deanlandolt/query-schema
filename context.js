var ajv = require('ajv')

var defaults = {
  allErrors:        true, // false
  removeAdditional: false, // false
  verbose:          true, // false
  format:           'fast', // 'fast'
  formats:          {}, // {}
  schemas:          {}, // {}
  meta:             true, // true
  validateSchema:   'log', // true
  inlineRefs:       true, // true
  missingRefs:      true, // true
  uniqueItems:      true, // true
  unicode:          true, // true
  beautify:         false, // false
  errorDataPath:    'object', // 'object'
  jsonPointers:     true, // false
  messages:         true, // true
  v5:               true, // true
}

try {
  var SetAssociativeCache = require('sacjs')
  defaults.cache = new SetAssociativeCache({
    assoc: 4,
    size: 10000,
    algorithm: 'lru'
  })
}
catch (err) {
}

// TODO: export a function
var context = module.exports = ajv(defaults)

// support format comparison on basic strings (no format defined)
context.addFormat('undefined', {
  validate: function () { return true },
  compare: function (a, b) { return a > b ? 1 : (a < b ? -1 : 0) },
})

// ltgt macros
function ltgtKeyword(op) {
  var minimum = op[0] === 'g'
  var exclusive = op[2] !== 'e'

  context.addKeyword(op, {
    macro: function (value) {
      var suffix = (minimum ? 'in' : 'ax') + 'imum'

      var valKey, excKey
      if (typeof value === 'number') {
        valKey = 'm' + suffix
        excKey = 'exclusiveM' + suffix
      }
      // TODO: else if (typeof value === '...')?
      else {
        valKey = 'formatM' + suffix
        excKey = 'exclusiveFormatM' + suffix
      }

      var schema = {}
      schema[valKey] = value
      schema[excKey] = exclusive
      return schema
    }
  })
}

ltgtKeyword('gte')
ltgtKeyword('gt')
ltgtKeyword('lt')
ltgtKeyword('lte')

// eq, ne macros
context.addKeyword('eq', {
  macro: function (schema) {
    return { constant: schema }
  }
})
context.addKeyword('ne', {
  macro: function (schema) {
    return { not: { eq: schema } }
  }
})

// size macro
context.addKeyword('size', {
  macro: function (schema) {
    return {
      minLength: schema,
      maxLength: schema,
      minItems: schema,
      maxItems: schema,
      minProperties: schema,
      maxProperties: schema
    }
  }
})


try {
  var semver = require('semver')

  context.addFormat('semver', {
    validate: function (v) {
      return semver.valid(v, true)
    },
    compare: function (a, b) {
      return semver.compare(a, b, true)
    }
  })

  context.addFormat('semver-range', {
    validate: function (r) {
      return !!semver.validRange(r)
    },
    compare: function (a, b) {
      function cmp(v, r) {
        return semver.gtr(v, r) ? 1 : (semver.ltr(v, r) ? -1 : 0)
      }

      // one value must be a discrete version (for now)
      if (semver.valid(a, true)) return cmp(a, b)
      if (semver.valid(b, true)) return cmp(b, a)

      throw new Error('Cannot compare two ranges')
    }
  })

  context.addFormat('semver+strict', {
    validate: semver.valid,
    compare: semver.compare
  })
}
catch (err) {
}

