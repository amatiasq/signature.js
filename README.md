This is a library to create and validate function signatures



## Validate a argument ##

```javascript
var sample = signature(Boolean)
sample()
// Warning: Invalid arguments count: expected 1 arguments at minimum, but 0 recived.
sample(null)
//Warning: Invalid type: expected a [class Boolean] but recived --[null]-- (object). Argument index 0.

// valid
sample(true)
sample(false)
sample(new Boolean(true))
```

## Validate a optional argument ##

```javascript
var sample = signature(opt(Boolean))
sample("hi")
// Warning: Invalid type: expected a [class Boolean] but recived --[hi]-- (string). Argument index 0.

// valid
sample()
sample(null)
sample(true)
sample(false)
sample(new Boolean(true))
```

## Check for extra arguments ##

```javascript
var sample = signature(Boolean)
sample(true, false, true)
// Warning: Invalid arguments count: expected 1 arguments at maximum, but 3 recived.
```

## Custom classes ##

```javascript
function MyClass() { }
var sample = signature(MyClass)

sample()
// Invalid arguments count: expected 1 arguments at minimum, but 0 recived.

sample("hi")
// Warning: Invalid type: expected a [class MyClass] but recived --[hi]-- (string). Argument index 0.

// valid
sample(new MyClass())

// valid
function SubClass() { }
SubClass.prototype = new MyClass()
sample(new SubClass())

// optional we can set a custom validation
signature.registerClass(MyClass, 'MyClass', function(obj) {
  return obj instanceof MyClass && obj.isValid();
})
```

## Set implementation to call ##

```javascript
sample = signature(String);
sample.impl(function(message) {
  console.log(message);
})

sample("hello world");
// Log: hello world

// validation doesn't brokes execution
sample(123456)
// Warning: Invalid type: expected a [class String] but recived --[1]-- (number). Argument index 0.
// Log: 123456
```

## Validate return value ##

```javascript
sample = signature().returns(Boolean)

sample.impl(function() { return "hi";	})
sample()
// Warning: Invalid type: expected a [class Boolean] but recived --[hi]-- (string)

// valid
sample.impl(function() { return true });
sample()
```


## Methods are chainable ##

```javascript
var sample = signature(String, Number).returns(Boolean).impl(
                function(name, count) { return true })
```


FUTURE:
  - interfaces
