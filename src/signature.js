(function() {
  'use strict';

  var handlers = [];
  function push(value) {
    handlers.push(value);
  }

  function register() {
    Array.prototype.slice.call(arguments).forEach(push);
    handlers.sort(sorter);
  }

  function validate(type, value) {
    for (var i = 0; i < handlers.length; i++)
      if (handlers[i].canHandle(type))
        return handlers[i].handler(type, value);

    return false;
  }

  function test(types, optionals, isRest, args) {
    if (args.length < types.length)
      return 'Not enought arguments';

    if (!isRest && args.length > types.length + optionals.length)
      return 'Too many arguments';

    var error;
    args.some(function(value, index) {
      var type = index < types.length ?
        types[index] :
        optionals[index - types.length];

      if (validate(type, value))
        return;

      error = 'Argument ' + index + ' not valid. Expected ' +
        print(type) + ' but received ' + print(value);
      return true;
    });

    return error;
  }

  function signature_creator() {
    var types = Array.prototype.slice.call(arguments);
    var isRest = types[types.length - 1] === '...' ? !!types.pop() : false;
    var optionals = Array.isArray(types[types.length - 1]) ? types.pop() : [];
    signature.test = test.bind(null, types, isRest, optionals);

    function signature() {
      var args = Array.prototype.slice.call(arguments);
      var error = signature.test(args);
      if (error) throw new Error(error);
    }

    return signature;
  }

  window.signature = signature_creator;

  register(
    null_handler(),
    object_handler(),
    array_handler(),
    typeof_handler(),
    toString_handler(),
    instanceOf_handler(),
    prototype_handler(),
    ducktype_handler(),
  );

  return;


  function print(obj) {
    return '--[' + obj + ']--(' + (typeof obj) + ')--';
  }

  function sorter(a, b) {
    return b.priority - a.priority;
  }

  function equals(expected) {
    return function(value) {
      return value === expected;
    };
  }

  function null_handler() {
    return {
      priority: 1.1,
      canHandle: equals(null),
      handler: function(type, value) {
        if (value !== null)
          return 'Expected null, received ' + print(obj) + ' instead.';
      }
    };
  }

  function object_handler() {
    return {
      priority: 1,
      canHandle: equals(Object),
      handler: function() {
        return;
      }
    };
  }

  function array_handler() {
    return {
      priority: 1,
      canHandle: equals(Array),
      handler: function(type, value) {
        return Array.isArray(value);
      }
    };
  }

  function typeof_handler() {
    var typeOfNatives = {
      'Boolean': 'boolean',
      'Number': 'number',
      'String': 'string',
      'Function': 'function',
    };

    return {
      priority: 1,
      canHandle: function(type) {
        return typeOfNatives.hasOwnProperty(type.name);
      },
      handler: function(type, value) {
        return typeof value === typeOfNatives[type.name];
      }
    };
  }

  function toString_handler() {
    var natives = {
      'Date': '[object Date]',
      'Regex': '[object Regex]',
    };

    return {
      priority: 0.9,
      canHandle: function(type) {
        return natives.hasOwnProperty(type.name);
      },
      handler: function(type, value) {
        return Object.prototype.toString.call(value) === natives[type.name];
      }
    };
  }

  function instanceOf_handler() {
    return {
      priority: 0.1,
      canHandle: function(type) {
        return typeof type === 'function';
      },
      handler: function(type, value) {
        return value instanceof type;
      }
    };
  }

  function basic_handler() {
    return {
      priority: 0,
      canHandle: function() {
        return true;
      },
      handler: function(type, value) {
        if (type.isPrototypeOf(value))
          return true;

        Object.
      }
    };
  }

  function ducktype_handler() {
    return {
      priority: -0.1,
      canHandle: function()
    };
  }

})();
