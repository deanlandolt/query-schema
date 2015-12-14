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

