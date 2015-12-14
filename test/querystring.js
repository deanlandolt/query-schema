var qss = require('../querystring')
var test = require('tape')

function log(m, v) {
  console.log(m + ':', JSON.stringify(v, null, '  '))
}

function eq(t, q, s, m) {
  var parsed = qss.parse(q)

  log('query', q)
  log('parsed', parsed)
  log('schema', s)

  t.deepEqual(parsed, s, m)
}

function throws(t, q, m) {
  t.throws(function () {
    qss.parse(q)
  }, m)
}

test('empty', function (t) {
  eq(t, '?', {})
  // eq(t, '?()', {})
  // eq(t, '?(((())))', {})

  t.end()
})

test('constants', function (t) {
  eq(t, '?year=2003', {
    properties: {
      year: {
        constant: '2003'
      }
    }
  }, 'value as string literal')

  eq(t, '?year=%32%30%30%33', {
    properties: {
      year: {
        constant: '2003'
      }
    }
  }, 'escaped characters in string literal')

  eq(t, '?year=%2B2003', {
    properties: {
      year: {
        constant: '+2003'
      }
    }
  }, 'escaped + in string literal')

  throws(t, '?year=:+2000x', 'invalid number')

  eq(t, '?name=Kill+Bill', {
    properties: {
      name: {
        constant: 'Kill Bill'
      }
    }
  }, 'plus-encoded space in string literal')

  eq(t, '?name=Kill%20Bill', {
    properties: {
      name: {
        constant: 'Kill Bill'
      }
    }
  }, 'escaped space in string literal')

  eq(t, '?name=Kill Bill', {
    properties: {
      name: {
        constant: 'Kill Bill'
      }
    }
  }, 'unescaped space in string literal')

  eq(t, '?name=Kill :/@!*^$&', {
    properties: {
      name: {
        constant: 'Kill :/@!*^$&'
      }
    }
  }, 'unescaped non-delimiter in string literal body')

  throws(t, '?name=K(ill')
  throws(t, '?name=Kill)')

  t.end()
})

test('number literals', function (t) {
  eq(t, '?year=:2003', {
    properties: {
      year: {
        constant: 2003
      }
    }
  }, ':2003')

  eq(t, '?year=:+2003', {
    properties: {
      year: {
        constant: 2003
      }
    }
  }, ':+2003')

  eq(t, '?year=:-2003', {
    properties: {
      year: {
        constant: -2003
      }
    }
  }, ':-2003')

  eq(t, '?year=:20.03', {
    properties: {
      year: {
        constant: 20.03
      }
    }
  }, ':-2E3')

  eq(t, '?year=:2e3', {
    properties: {
      year: {
        constant: 2000
      }
    }
  }, ':2e3')

  eq(t, '?year=:-2E3', {
    properties: {
      year: {
        constant: -2000
      }
    }
  }, ':-2E3')

  t.end()
})

test('negated constants', function (t) {
  eq(t, '?year!=2003', {
    properties: {
      year: {
        not: {
          constant: '2003'
        }
      }
    }
  })

  eq(t, '?year!=:null', {
    properties: {
      year: {
        not: {
          constant: null
        }
      }
    }
  }, 'null literal')

  eq(t, '?year!=(false,:false,(),(()))', {
    properties: {
      year: {
        not: {
          constant: [ 'false', false, [], [[]] ]
        }
      }
    }
  }, 'tuple')

  t.end()
})

test('constraints', function (t) {
  eq(t, '?year:lte=2003', {
    properties: {
      year: {
        lte: '2003'
      }
    }
  })

  eq(t, '?genres:minItems=:2', {
    properties: {
      genres: {
        minItems: 2
      }
    }
  })

  eq(t, '?genres:contains=(Kill+Bill)', {
    properties: {
      genres: {
        contains: [ 'Kill Bill' ]
      }
    }
  })

  t.end()
})

test('conjunctions', function (t) {
  eq(t, '?name=Kill+Bill;year:gt=2003', {
    allOf: [
      {
        properties: {
          name: {
            constant: 'Kill Bill'
          }
        }
      },
      {
        properties: {
          year: {
            gt: '2003'
          }
        }
      }
    ]
  })

  t.end()
})

test('nested constraints', function (t) {
  eq(t, '?director/firstName=Quentin;director/lastName:length=9', {
    allOf: [
      {
        properties: {
          director: {
            properties: {
              firstName: {
                constant: 'Quentin'
              }
            }
          }
        }
      },
      {
        properties: {
          director: {
            properties: {
              lastName: {
                length: '9'
              }
            }
          }
        }
      }
    ]
  })

  eq(t, '?director/firstName:pattern=^Q;director/firstName:minLength=5', {
    allOf: [
      {
        properties: {
          director: {
            properties: {
              firstName: {
                pattern: '^Q'
              }
            }
          }
        }
      },
      {
        properties: {
          director: {
            properties: {
              firstName: {
                minLength: '5'
              }
            }
          }
        }
      }
    ]
  })

  t.end()
})

test('disjunctions', function (t) {
  eq(t, '?director/lastName=Tarentino,year:gt=2010', {
    anyOf: [
      {
        properties: {
          director: {
            properties: {
              lastName: {
                constant: 'Tarentino'
              }
            }
          }
        }
      },
      {
        properties: {
          year: {
            gt: '2010'
          }
        }
      }
    ]
  })

  t.end()
})

test('exclusive disjunction shorthand', function (t) {
  eq(t, '?^(year=2003,genres:contains=sci-fi)', {
    oneOf: [
      {
        properties: {
          year: {
            constant: '2003'
          }
        }
      },
      {
        properties: {
          genres: {
            contains: 'sci-fi'
          }
        }
      }
    ]
  })

  throws(t, '?^(year=2003;genres:contains=sci-fi)')

  t.end()
})

test('negation shorthand', function (t) {

  eq(t, '?!(year=2003,genres:contains=sci-fi)', {
    not: {
      anyOf: [
        {
          properties: {
            year: {
              constant: '2003'
            }
          }
        },
        {
          properties: {
            genres: {
              contains: 'sci-fi'
            }
          }
        }
      ]
    }
  })

  eq(t, '?!^(year=2003,genres:contains=sci-fi)', {
    not: {
      oneOf: [
        {
          properties: {
            year: {
              constant: '2003'
            }
          }
        },
        {
          properties: {
            genres: {
              contains: 'sci-fi'
            }
          }
        }
      ]
    }
  })

  throws(t, '?^!(year=2003,genres:contains=sci-fi)')

  t.end()
})

test('enum assignment', function (t) {
  eq(t, '?director/firstName=+(Quentin,(Ethan,Joel))', {
    properties: {
      director: {
        properties: {
          firstName: {
            enum: [ 'Quentin', [ 'Ethan', 'Joel' ] ]
          }
        }
      }
    }
  })

  eq(t, '?genres=+((sci-fi),(action,sci-fi))', {
    properties: {
      genres: {
        enum: [ [ 'sci-fi' ], [ 'action', 'sci-fi' ] ]
      }
    }
  })

  eq(t, '?genres=((sci-fi),(action,sci-fi))', {
    properties: {
      genres: {
        constant: [ [ 'sci-fi' ], [ 'action', 'sci-fi' ] ]
      }
    }
  })

  eq(t, '?genres!=((sci-fi),(action,sci-fi))', {
    properties: {
      genres: {
        not: {
          constant: [ [ 'sci-fi' ], [ 'action', 'sci-fi' ] ]
        }
      }
    }
  })

  // // TODO: do we even want this?
  // eq(t, '?genres=!+((sci-fi),(action,sci-fi))', {
  //   properties: {
  //     genres: {
  //       not: {
  //         constant: [ [ 'sci-fi' ], [ 'action', 'sci-fi' ] ]
  //       }
  //     }
  //   }
  // })

  t.end()
})

test('type/format constraints', function (t) {
  eq(t, '?genres:type=array', {
    properties: {
      genres: {
        type: 'array'
      }
    }
  })

  eq(t, '?year:format=year', {
    properties: {
      year: {
        format: 'year'
      }
    }
  })

  t.end()
})

test('items schema assignment', function (t) {
  eq(t, '?genres=*(:type=string;:maxItems=2)', {
    properties: {
      genres: {
        items: {
          allOf: [
            {
              type: 'string'
            },
            {
              maxItems: '2'
            }
          ]
        }
      }
    }
  })

  eq(t, '?=*(type=string)', {
    properties: {
      '': {
        items: {
          properties: {
            type: {
              constant: 'string'
            }
          }
        }
      }
    }
  }, 'empty string property key')

  t.end()
})

test('scoped assertions', function (t) {
  eq(t, '?director=(:minProperties=:3;firstName:pattern=^Q)', {
    properties: {
      director: {
        allOf: [
          {
            minProperties: 3
          },
          {
            properties: {
              firstName: {
                pattern: '^Q'
              }
            }
          }
        ]
      }
    }
  })

  throws(t, '?director=:minProperties=+3;firstName:pattern=^Q')

  t.end()
})

test('nested clauses', function (t) {
  eq(t, '?name=Kill+Bill;(director/lastName=Tarentino,(year:gt=2003;year:lte=2010));genres=(sci-fi,action)', {
    allOf: [
      {
        properties: {
          name: {
            constant: 'Kill Bill'
          }
        }
      },
      {
        anyOf: [
          {
            properties: {
              director: {
                properties: {
                  lastName: {
                    constant: 'Tarentino'
                  }
                }
              }
            }
          },
          {
            allOf: [
              {
                properties: {
                  year: {
                    gt: '2003'
                  }
                }
              },
              {
                properties: {
                  year: {
                    lte: '2010'
                  }
                }
              }
            ]
          }
        ]
      },
      {
        properties: {
          genres: {
            constant: [ 'sci-fi', 'action' ]
          }
        }
      }
    ]
  })

  t.end()
})
