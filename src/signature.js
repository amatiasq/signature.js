(function(Type) {

	function array(args, start, end) {
		return Array.prototype.slice.call(args, start, end);
	}

	var var_args = '...',
		SignatureError = Base.extend.call(Error),
		SignatureDefinitionError = Base.extend.call(Error);

	var SignatureClass = Base.extend({

		returnType: Type.optionalFromClass(Object),

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

		exec: function() {
			var error = this.validateArguments(array(arguments));
			if (error)
				this.notify(error);

			if (this.implementation) {
				var result = this.implementation.apply(this, arguments);

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


			for (var i = 0; i < len; i++) {
				message = this.validateType(args[i], types[i]);

				if (message)
					return message + ". Argument index " + i + ".";
			}
		},

		validateReturnValue: function(value) {
			return this.validateType(value, this.returnType);
		},

		notify: function(message) {
			var caller = arguments.callee.caller.caller;
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
					return "Invalid arguments count: expected " + expected +
						" arguments at minimum, but " + recived + " recived.";

				case 'COUNT_MAX':
					return "Invalid arguments count: expected " + expected +
						" arguments at maximum, but " + recived + " recived.";

				case 'INVALID_TYPE':
					return "Invalid type: expected a " + expected.toString() +
						" but recived " + this.printObj(recived);

			}
		},

		printObj: function(value) {
			return "--[" + value + "]-- (" + (typeof value) + ")";
		},

		impl: function(funct) {
			// TODO: validate funct

			this.implementation = funct;
			return this;
		},

		returns: function(type) {
			this.returnType = Type.normalize(type);
		}
	});


	var proto = {

		returnType: Type.optionalFromClass(Object),
		implementation: null,

		impl: function(funct) {
			this.data.impl(funct);
			return this;
		},

		returns: function(type) {
			this.data.returns(type);
			return this;
		}
	};

	function opt(type) {
		return Type.optionalFromClass(type);
	}

	function signature() {
		var data = new SignatureClass().setTypes(array(arguments)),
			signature = data.exec.bind(data);

		signature.data = data;
		signature.impl = proto.impl;
		signature.returns = proto.returns;
		return signature;
	}

	signature.registerClass = function(clazz, name, test) {
		Type.registerClass(clazz, name, test);
	};

	signature.warn = function() {
		console.warn.apply(console, arguments);
	};

	window.signature = signature;
	window.opt = opt;

})(signature.Type);
