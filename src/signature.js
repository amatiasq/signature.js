(function(Type) {

	function array(args, start, end) {
		return Array.prototype.slice.call(args, start, end);
	}

	var var_args = '...',
		SignatureError = Error,
		SignatureDefinitionError = Error,
		signatureFlag = {};

	function SignatureClass() { };
	SignatureClass.prototype = {

		constructor: SignatureClass,
		returnType: Type.optionalFromClass(Object),
		name: '',
		classname: '',

		setName: function(name) {
			this.name = name;
		},

		setClass: function(classname) {
			this.classname = classname;
		},

		setTypes: function(classes) {
			var min = 0,
				max = 0,
				type,
				types = [];

			for (var i = 0, len = classes.length; i < len; i++) {
				type = classes[i];

				if (type === var_args) {
					if (i !== len - 1)
						throw new SignatureDefinitionError('Only the las argument can be var_args');

					max = Infinity;
					break;
				}

				type = types[i] = Type.normalize(type);
				max++;

				if (!type.isOptional)
					min++;
			}

			this.types = types;
			this.min = min;
			this.max = max;
			return this;
		},

		exec: function(scope, args) {
			var error = this.validateArguments(args);
			if (error)
				this.notify(error);

			if (this.implementation) {
				var result = this.implementation.apply(scope, args);

				error = this.validateReturnValue(result);
				if (error)
					this.notify(error);

				return result;
			}
		},

		validateArguments: function(args) {
			var len = args.length,
				types = this.types,
				message;

			if (len < this.min)
				return this.generateMessage('COUNT_MIN', this.min, len);
			if (len > this.max)
				return this.generateMessage('COUNT_MAX', this.max, len);


			for (var i = 0, len = this.types.length; i < len; i++) {
				message = this.validateType(args[i], types[i]);

				if (message)
					return message + ". Argument index " + i + ".";
			}
		},

		validateReturnValue: function(value) {
			return this.validateType(value, this.returnType);
		},

		notify: function(message) {
			var caller = arguments.callee.caller.caller.caller;
			var at = "\nAt function: " + (caller ? caller.toString() : "(anonymous)");
			signature.warn(message + at);
		},

		validateType: function(value, type) {
			if (!type.is(value))
				return this.generateMessage('INVALID_TYPE', type, value);
		},

		generateMessage: function(type, expected, recived) {
			switch (type) {

				case 'COUNT_MIN':
					return this.toString() + " Invalid arguments count: expected " + expected +
						" arguments at minimum, but " + recived + " recived.";

				case 'COUNT_MAX':
					return this.toString() + " Invalid arguments count: expected " + expected +
						" arguments at maximum, but " + recived + " recived.";

				case 'INVALID_TYPE':
					return this.toString() + " Invalid type: expected a " + expected.toString() +
						" but recived " + this.printObj(recived);

			}
		},

		replace: function(name, object) {
			for (var i = 0, len = this.types.length; i < len; i++)
				this.types[i] = this.deferredToType(this.types[i], name, object);

			this.returnType = this.deferredToType(this.returnType, name, object);
		},

		deferredToType: function(original, name, object) {
			if (!(original instanceof DeferredType) || original.name !== name)
				return original;

			var result = Type.fromClass(object);

			if (original.isOptional)
				result.optional();

			return result;
		},

		printObj: function(value) {
			return "--[" + value + "]-- (" + (typeof value) + ")";
		},

		impl: function(funct) {
			// TODO: validate funct

			this.implementation = funct;
			return this;
		},

		wrap: function(method) {
			if (!this.implementation)
				return this.impl(method);

			var base = this.implementation;
			this.implementation = function wrapper() {
				var original = this.base;
				this.base = base;
				var result = method.apply(this, arguments);
				this.base = original;
				return result;
			};
		}

		clone: function() {
			var clon = new SignatureClass();
			clon.name = this.name;
			clon.classname = this.classname;
			clon.types = this.types;
			clon.min = this.min;
			clon.max = this.max;
			clon.returnType = this.returnType;
			clon.implementation = null;
			return clon;
		},

		returns: function(type) {
			this.returnType = Type.normalize(type);
		},

		toString: function() {
			var name;
			if (this.name && this.classname)
				name = this.classname + '.' + this.name;
			else if (this.name)
				name = this.name;
			else
				name = 'Signature';
			return '[signature ' + name + ']';
		}
	};


	function dataToSignature(data) {
		function funct() { data.exec(this, array(arguments)); }
		funct.prototype = signatureFlag;
		funct.data = data;

		for (var i in proto)
			funct[i] = proto[i];

		return funct;
	}

	var proto = {

		impl: function(funct) {
			this.data.impl(funct);
			return this;
		},

		wrap: function(method) {
			this.data.wrap(method);
			return this;
		},

		returns: function(type) {
			this.data.returns(type);
			return this;
		},

		replace: function(name, object) {
			this.data.replace(name, object);
			return this;
		},

		setName: function(name) {
			this.data.setName(name);
			return this;
		},

		setClass: function(classname) {
			this.data.setClass(classname);
			return this;
		},

		toString: function() {
			return this.data.toString();
		},

		clone: function() {
			return dataToSignature(this.data.clone());
		}
	};

	function opt(type) {
		return Type.optionalFromClass(type);
	}

	function signature() {
		return dataToSignature(new SignatureClass().setTypes(array(arguments)));
	}

	signature.Type = Type;

	signature.warn = function() {
		console.warn.apply(console, arguments);
	};

	window.signature = signature;
	window.opt = opt;



	// SIGNATURE TYPE

	Type.registerCreator({
		priority: Type.CreatorInterface.DEFAULT_PRIORITY,

		canHandle: function(clazz) {
			return clazz && clazz.prototype === signatureFlag;
		},

		create: function(obj) {
			return Type.fromClass(Function);
		}
	});


	// DEFERRED TYPE

	var DeferredType = Type.extend({
		constructor: function(name) {
			Type.call(this, { name: name });
			this.clazz = null;
		},

		isImpl: function(obj) {
			if (!window[this.name])
				throw new Error("Expected type is not a class, is a string: " + this.name);

			var clazz = this.clazz = window[this.name];
			var type = Type.fromClass(clazz);

			if (this.isOptional)
				type.optional();

			this.isImpl = function(obj) {
				return type.isImpl(obj)
			};

			return this.isImpl(obj);
		}
	});

	Type.registerCreator({
		priority: Type.CreatorInterface.DEFAULT_PRIORITY,

		canHandle: function(clazz) {
			return typeof clazz === 'string' || clazz instanceof String;
		},

		create: function(name) {
			return new DeferredType(name);
		}
	});



})(signature.Type);
