var test = require('tape')
var through2 = require('through2')
var ValueFilter = require('../filter').value

var colors = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen'
]

var queries = {
  'name=white': [
    'white'
  ],
  'name=+(yellow,white)': [
    'white',
    'yellow'
  ],
  'name=(yellow,white)': [
  ],
  'name=yellow,(name:pattern=^white)': [
    'white',
    'whitesmoke',
    'yellow'
  ],
  'name:pattern=^bl': [
    'black',
    'blanchedalmond',
    'blue',
    'blueviolet',
  ],
  'name:pattern=^blue': [
    'blue',
    'blueviolet'
  ],
  'name:pattern=^brown': [
    'brown'
  ],
  'name:pattern=brown': [
    'brown',
    'rosybrown',
    'saddlebrown',
    'sandybrown'
  ],
  'name:pattern=^b.*d$': [
    'blanchedalmond',
    'burlywood'
  ],
  'name:gt=white': [
    'whitesmoke',
    'yellow',
    'yellowgreen'
  ],
  'name:gte=white': [
    'white',
    'whitesmoke',
    'yellow',
    'yellowgreen'
  ],
  'name:lt=bl': [
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque'
  ],
  'name:lte=aqua': [
    'aliceblue',
    'antiquewhite',
    'aqua'
  ],
  'name:lt=aqua': [
    'aliceblue',
    'antiquewhite'
  ],
  'name_len:gte=:15': [
    'lightgoldenrodyellow',
    'mediumaquamarine',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred'
  ],
  'name_len:gt=:15': [
    'lightgoldenrodyellow',
    'mediumaquamarine',
    'mediumspringgreen'
  ],
  'name_len:lt=:4': [
    'red',
    'tan'
  ],
  'name_len:lte=:4': [
    'aqua',
    'blue',
    'cyan',
    'gold',
    'gray',
    'lime',
    'navy',
    'peru',
    'pink',
    'plum',
    'red',
    'snow',
    'tan',
    'teal'
  ],
  'name_len:lt=:4,name:pattern=^r': [
    'rebeccapurple',
    'red',
    'rosybrown',
    'royalblue',
    'tan'
  ],
  'name_len:lt=:4;name:pattern=^r': [
    'red'
  ],
  'name_len:lt=:4;(name:pattern=^r,name=tan)': [
    'red',
    'tan'
  ]
}

function run(t, qs, expected) {
  var source = through2.obj()

  var values = []
  source.pipe(ValueFilter('?' + qs)).on('data', function (d) {
    values.push(d.value.name)
  })
  .on('error', t.end)
  .on('end', function () {
    t.deepEqual(values, expected)
    t.end()
  })

  function next(i) {
    if (i >= colors.length) return source.end()

    var color = colors[i]
    source.push({ key: i, value: {
      name: color,
      name_len: color.length
    } })
    process.nextTick(function () {
      next(++i)
    })
  }

  next(0)
}

test('stream filtering', function (t) {
  t.test('empty query', function (t) {
    t.test('', function (t) {
      run(t, '', colors)
    })
  })

  Object.keys(queries).forEach(function (qs) {
    t.test(qs, function (t) {
      run(t, qs, queries[qs])
    })
  })
})