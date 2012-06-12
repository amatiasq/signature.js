(function(Type) {

	function array(args, start, end) {
		return Array.prototype.slice.call(args, start, end);
	}

	var var_args = '...',
		SignatureError = Error,
		SignatureDefinitionError = Error;

	function SignatureClass() { };
	SignatureClass.prototype = {

		constructor: SignatureClass,
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

		clone: function() {
			var clon = new SignatureClass();
			clon.types = this.types;
			clon.min = this.min;
			clon.max = this.max;
			clon.returnType = this.returnType;
			clon.implementation = null;
			return clon;
		},

		returns: function(type) {
			this.returnType = Type.normalize(type);
		}
	};


	function dataToSignature(data) {
		var funct = data.exec.bind(data);
		funct.data = data;
		funct.impl = proto.impl;
		funct.returns = proto.returns;
		return funct;
	}

	var proto = {

		impl: function(funct) {
			this.data.impl(funct);
			return this;
		},

		returns: function(type) {
			this.data.returns(type);
			return this;
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

})(signature.Type);
