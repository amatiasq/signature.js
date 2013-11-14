// jshint unused:false

// Disable possible strict violation message
// jshint -W040

define(function() {
	'use strict';

	function warn(message) {
		console.warn(message);
	}

	function type(obj) {
		var ctor = Object.prototype.toString.call(obj);
		return ctor.substr(8, ctor.length - 1).toLowerCase();
	}

	function toArray(obj) {
		Array.prototype.slice.call(obj);
	}

	function last(array) {
		return array[array.length - 1];
	}

	function isType(type, value) {
		// TODO :D
	}

	function returns(value) {
		this.data.returnType = value;
	}

	function clone() {
		var copy = createSignature();
		copy.data = this.data;
		return copy;
	}

	function impl(fn) {
		this.implementation = fn;
	}

	function test(data, args) {
		var min = this.data.min;
		var max = this.data.max;
		var types = this.data.types;
		var optionals = this.data.optionals;
		var isRest = this.data.isRest;
		var validableArgs = args.length < max ? args.length : max;
		var expected;

		if (args.length < min)
			return 'Not enought arguments, minimum is ' + min;

		if (!isRest && args.length > max)
			return 'Too many arguments, maximum is ' + max;

		for (var i = 0; i < validableArgs; i++) {
			expected = i < types.length ? types[i] : optionals[i - types.length];
			if (!isType(expected, args[i]))
				return 'Expected ' + expected + ' but --[' + args[i] + ']--(' + type(args[i]) + ')-- found.';
		}
	}

	function createSignature() {
		function sig() {
			var args = toArray(arguments);
			var error = sig.test(args);
			if (error) warn(error);

			if (sig.data.isRest) {
				var rest = args.slice(sig.data.max);
				args.length = sig.data.max;
				args.push(rest);
			}

			if (!sig.implementation) return;

			var result = sig.implementation.apply(this, args);
			if (sig.data.returnType)
				warn('Expected ' + sig.data.returnType + ' but --[' + result + ']--(' + type(result) + ')-- found.');

			return result;
		}

		sig.test = test;
		sig.returns = returns;
		sig.impl = impl;
		sig.clone = clone;
		return sig;
	}

	function signature() {
		var types = toArray(arguments);
		var optionals = type(last(types)) === 'array' ? types.pop() : [];
		var isRest = !!(last(types) === '...' ? types.pop() : false);
		var min = types.length;
		var max = types.length + optionals.length;
		var sig = createSignature();

		sig.data = {
			types: types,
			optionals: optionals,
			isRest: isRest,
			returnType: null,
			min: min,
			max: max,
		};
		return sig;
	}

	return signature;
});
