# @query/schema

[![build status](https://travis-ci.org/deanlandolt/query-schema.svg?branch=master)](https://travis-ci.org/deanlandolt/query-schema)

This lib provides a querystring-safe format with a syntax that maps coherently to JSON Schema.

The aim is to define a concise but fully generic notation for defining filters and projections over any collection, index or stream of events, making it possible to describe arbitrarily complex queries over any stream of JSON-serializable objects.


## Query syntax

Simple queries look something like this:

```js
qss.parse('?name=The+Big+Lebowski;year=1998')
```

This parses to a JSON Schema that can be used to records in a given indexed collection. The resulting (v5) JSON Schema should look something like this:

```js
{
  properties: {
    name: {
      constant: 'The Big Lebowski'
    },
    year: {
      constant: '1998'
    }
  }
}
```

Note how the `+` character decodes to a space per the standard `x-www-form-urlencoded` behavior.

NB: the actual JSON Schema that's output is a bit less pleasant (we still need to do some term rewriting to us to CNF, or close to it.)


### Nested properties

Nested properties can also be specified as paths in a schema string using the `/` delimiter:

```js
qss.parse('?year=2003;director/firstName=Quentin')
```

The resulting parsed query object:

```js
{
  properties: {
    director: {
      properties: {
        firstName: {
          constant: 'Quentin'
        }
      }
    },
    year: {
      constant: '2003'
    }
  }
}
```


### Property constraints

Property constraints are values set at the schema level, which is done using the `:` delimiter in property paths:

```js
qss.parse('?director/firstName=Quentin;year:gte=2003')
```

The resulting JSON Schema:

```js
{
  properties: {
    director: {
      properties: {
        firstName: {
          constant: 'Quentin'
        }
      }
    },
    year: {
      gte: '2003'
    }
  }
}
```

The above output isn't *quite* JSON Schema as is: note the `gte` keyword where the schema for the `year` property. This is one of a handful of custom schema keywords defined as macros for convenience.

The resulting JSON Schema, after expanding the `gte` macro:

```js
{
  properties: {
    director: {
      properties: {
        firstName: {
          constant: 'Quentin'
        }
      }
    },
    year: {
      formatMinimum: '2003',
      formatMinimumExclusive: false
    }
  }
}
```

This schema should work in any v5 JSON Schema validator.


### Schema keyword macros

#### `lt`, `gt`, `lte`, `gte`

The standard `ltgt` options are defined as schema macros which transform into the JSON Schema (v5) `format*` keywords with appropriate values. For instance the `gte` macro is defined like this:

```js
context.addKeyword('gt', {
  macro: function (schema, parentSchema) {
    return {
      formatMinimum: schema,
      formatMinimumExclusive: true
    }
  }
})
```

#### `eq`, `ne`

A macro is also defined for the `eq` keyword, aliasing the `constant` keyword:

```js
context.addKeyword('eq', {
  macro: function (schema, parentSchema) {
    return { constant: schema }
  }
})
```

The `ne` macro is also defined, based on the `eq` macro and the standard JSON Schema `not` keyword:

```js
context.addKeyword('ne', {
  macro: function (schema, parentSchema) {
    return { not: { eq: schema } }
  }
})
```

#### `size`

The `size` macro is defined to expand into the standard JSON Schema `*Length` keywords. The `size` of both strings and arrays can be asserted, as well as the total number of object keys, using this one macro:

```js
context.addKeyword('size', {
  macro: function (schema, parentSchema) {
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
```


### Key constraints

A stream of "index" records (e.g. level's `createReadStream`) is a sequence of objects containing `key` and `value` fields. By default query paths target the `value` keys, but this may not always be what you want. There are times where you may want to reference the `key` field, e.g. if this data isn't contained in the `value` record, or to constrain the resulting stream by some `ltgt` range on the keys.

To set constraints on `key` fields, or other more general constraints, use a property path which begins with the string `:`:

```js
qss.parse('?:key:gte=a;:key:lt=n;year:gt=2003')
```

```js
{
  key: {
    gt: 'a',
    lt: 'b'
  },
  properties: {
    year: {
      gt: '2003'
    }
  }
}
```


### Type/format enforcement

The `type` keyword can be used to filter properties by type. For example, if property `name` could be a string or an object, you could target only `string`-typed names with this query:

```js
qss.parse('?name:type=string')
```

This results in the value schema (the JSON Schema describing the `value` records):

```js
{
  properties: {
    name: {
      type: 'string'
    }
  }
}
```
You can also restrict a query to values matching a given format:

```js
qss.parse('?year:format=year')
```

This schema should filter out any records with date values which don't adhere to the standard JSON Schema 'year' format:

```js
{
  properties: {
    name: {
      format: 'year'
    }
  }
}
```

You could even define custom formats for added flexibility:

```js
qss.parse('?version:format=semver;dependencies:additionalProperties:format=semver-range')
```

For example if you were validating a stream of `package.json` sources, this query would filter out records with an invalid semver `version` or `dependencies` with invalid `semver-range` values:

```js
{
  properties: {
    version: {
      format: 'semver'
    },
    dependencies: {
      additionalProperties: {
        format: 'semver-range'
      }
    }
  }
}
```

Simple union types can also be specified with an array:

```js
qss.parse('?name:type=(string,integer,boolean)')
```

The resulting value schema:

```js
{
  properties: {
    name: {
      type: [ 'string', 'integer', 'boolean' ]
    }
  }
}
```


### Logical Connectives

Complex union types can be specified with comma-separated union clauses:

```js
qss.parse('?name:type=string,(name:type=integer;name:minimum=10),name:type=boolean')
```

Like just about anything else, this can also be constructed by specifying the appropriate JSON Schema structure directly:

```js
qss.parse('?name:anyOf=((:type=string),(:type=integer;:minimum=10),(:type=boolean))')
```

Concise forms are available for the other logical relations, as well as syntax sugar for negation and enumeration, where it aids legibility.


**NB: see tests for more syntax and usage examples**


### Default values

TODO


## Stream filters

```js
var FilterStream = require('@query/schema/filter').value('year:gt=2003')

db.createReadStream(...).pipe(FilterStream).on('data', function (data) {
  // for all records:
  //  data.value.year > '2003'
})
```

You can also provide a base schema when wrapping the underlying level instance, and the appropriate hooks will be added to validate all writes against this schema.

