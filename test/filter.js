var test = require('tape')
var through2 = require('through2')
var filter = require('../filter')

var colors = [
  'chocolate',
  'azure',
  'beige',
  'aliceblue',
  'aquamarine',
  'chartreuse',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'cyan',
  'blueviolet',
  'burlywood',
  'cadetblue',
  'coral',
  'cornflowerblue',
  'brown',
  'aqua',
  'cornsilk',
  'crimson',
  'antiquewhite'
]

var colors_b = [
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'burlywood',
  'brown'
]

test('stream filtering', function (t) {
  var source = through2.obj()

  var values = []
  source.pipe(filter.stream('?color:pattern=^b')).on('data', function (d) {
    values.push(d.value.color)
  })
  .on('end', function () {
    t.deepEqual(values, colors_b)
    t.end()
  })

  function next(i) {
    if (i >= colors.length) return source.end()
    source.push({ key: i, value: { color: colors[i] } })
    setTimeout(function () {
      next(++i)
    }, Math.random())
  }

  next(0)

})