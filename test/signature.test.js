describe('signature function', function() {

	function test(message, funct) {
		function handler() {
			var expect = sinon.mock(signature).expects('warn');
			funct(expect)
			expect.verify();
			signature.warn.restore();
		}
		handler.toString = function() {
			return funct.toString();
		};

		it(message, handler);
	}

	function SampleClass() { }
	function SubClass() { }
	SubClass.prototype = new SampleClass();
	SubClass.prototype.constructor = SubClass;

	var types = [ Object, null, Boolean, Number, String, Function, Array, Date, SampleClass, SubClass ];

	var validValues = [
		[ {}, new Object() ],
		[ null, undefined ],
		[ true, false, new Boolean(), new Boolean(true), new Boolean(false) ],
		[ 0, 1, 2.3, -0, -1, -2.3, new Number(), new Number(1) ],
		[ "", "hi", "!$%&/()=", new String(), new String(""), new String("adf") ],
		[ function() { }, SampleClass, SubClass ],
		[ [], ['a',1,true], new Array(), new Array(1), new Array('a',1,true) ],
		[ new Date() ],
		[ ],
		[ ],
	];

	eachValidValue(function(a, b, count) { eachValidValue.count = count });
	function eachValidValue(callback) {
		var count = 0,
			i, len, j, jlen;

		// Every value except null ones should pass with Object
		for (i = 0, len = validValues.length; i < len; i++)
			if (i !== 1)
				for (j = 0, len = validValues[i].length; j < len; j++)
					callback(Object, validValues[i][j], ++count);

		// Test every type with it's valid values
		for (i = 1, len = types.length; i < len; i++)
			for (j = 0, jlen = validValues[i].length; j < jlen; j++)
				callback(types[i], validValues[i][j], ++count);

		// Test custom classes and subclasses
		callback(SampleClass, new SampleClass, ++count);
		callback(SampleClass, new SubClass, ++count);
		callback(SubClass, new SubClass, ++count);
	}

	eachInvalidValue(function(a, b, count) { eachInvalidValue.count = count });
	function eachInvalidValue(callback) {
		var count = 0,
			i, len, j, jlen, k, klen;

		// Object should fail with null values
		for (i = 0, len = validValues[1].length; i < len; i++)
			callback(Object, validValues[1][i], ++count);

		// Test each type with all values except itself
		for (i = 1, len = types.length; i < len; i++)
			for (j = 0, jlen = validValues.length; j < jlen; j++)
				if (j !== i)
					for (k = 0, klen = validValues[j].length; k < klen; k++)
						callback(types[i], validValues[j][k], ++count);

		// A superclass isn't a valid value
		callback(SubClass, new SampleClass, ++count);
	}

	forEachType(function(a, count) { forEachType.count = count });
	function forEachType(callback) {
		callback(Object, 1);
		for (var i = 2, len = types.length; i < len; i++)
			callback(types[i], i);
	}

	function expectCalled(spy, count, type, value) {
		if (spy.callCount !== count) {
			debugger;
			throw new Error('Type ' + (type && type.name) + " doesn't fail with value --[" + value + ']-- (' + (typeof value) + ')');
		}
	}



	it("should return a callable function", function() {
		expect(signature()).toBeFunction();
	});

	describe("with no arguments", function() {

		var sut = signature();

		test("should pass when called without arguments", function(fail) {
			fail.never();
			sut();
		});

		test("should fail when extra arguments are recived", function(fail) {
			fail.once();
			sut(true);
		});

		test("even if the argument is null or undefined", function(fail) {
			fail.twice();
			sut(null);
			sut(undefined);
		})
	});

	describe("with a single argument", function() {

		var sut = signature(Boolean);

		test("should pass when called without arguments", function(fail) {
			fail.once();
			sut();
		});

		test("should fail when extra arguments are recived", function(fail) {
			fail.once();
			sut(true, false);
		});

		test("should pass when a object of this type is sent", function(fail) {
			fail.never();

			eachValidValue(function(type, value, count) {
				signature(type)(value);
			});
		});

		test("should fail with any argument who is not the expected type", function(fail) {
			fail.exactly(eachInvalidValue.count);

			eachInvalidValue(function(type, value, count) {
				signature(type)(value);
				expectCalled(fail, count, type, value);
			});
		});
	});

	describe("with two arguments", function() {

		var sut = signature(Boolean, Number);

		test("should fail when less arguments are passed", function(fail) {
			fail.twice();
			sut();
			sut(true);
		});

		test("should fail when extra arguments are recived", function(fail) {
			fail.once();
			sut(true, 1, "adsf");
		});

		test("should pass when a object of this type is sent", function(fail) {
			fail.never();

			eachValidValue(function(type, value) {
				signature(Boolean, type)(true, value);
			});
		});

		test("should fail with any argument who is not the expected type", function(fail) {
			fail.exactly(eachInvalidValue.count);

			eachInvalidValue(function(type, value, count) {
				signature(Boolean, type)(true, value);
				expectCalled(fail, count, type, value);
			});
		});
	});

	describe("set implementation", function() {

		test("should allow us to set a function to be executed if the signature success", function(fail) {
			fail.never();
			var spy = sinon.spy();

			eachValidValue(function(type, value, count) {
				signature(type).impl(spy)(value);
				expectCalled(spy, count, type, value);
			});
		});

		test("should call the implementation even if the validation fails", function(fail) {
			fail.exactly(eachInvalidValue.count);
			var spy = sinon.spy();

			eachInvalidValue(function(type, value, count) {
				signature(type).impl(spy)(value);
				expectCalled(spy, count, type, value);
			});
		});

		test("should pass argument to the implementation class", function(fail) {
			fail.never();

			var spy = sinon.spy();
			spy.toString = function() { return 'sinon.spy()' };

			eachValidValue(function(type, value, count) {
				signature(type).impl(spy)(value);
				expect(spy).called.withExactly(value);
			});
		});

		test("should pass every arguments to implementation class", function(fail) {
			fail.never();

			var spy = sinon.spy();
			spy.toString = function() { return 'sinon.spy()' };

			eachValidValue(function(type, value, count) {
				signature(type, type, type).impl(spy)(value, value, value);
				expect(spy).called.withExactly(value, value, value);
			});
		});
	});

	describe("return value validation", function() {

		test("should fail if a value is expected and nothing is returned", function(fail) {
			fail.exactly(forEachType.count * 3);

			forEachType(function(type, count) {
				signature().returns(type).impl(function() { })();
				signature().returns(type).impl(function() { return null })();
				signature().returns(type).impl(function() { return undefined })();

				expectCalled(fail, count * 3, type);
			})
		})

		test("should pass if the returned value is of the expected type", function(fail) {
			fail.never();

			eachValidValue(function(type, value) {
				signature().returns(type).impl(function() { return value })();
			});
		});

		test("should fail with any incompatible value", function(fail) {
			fail.exactly(eachInvalidValue.count);

			eachInvalidValue(function(type, value, count) {
				signature().returns(type).impl(function() { return value })();
				expectCalled(fail, count, type, value);
			});
		})

	});

	describe("Deferred type - a type can be a string to be parsed deferred", function() {

		test("should pass if the type is defined on window", function(fail) {
			fail.never();

			eachValidValue(function(type, value) {
				if (type && window[type.name] === type)
					signature(type.name)(value);
			});
		})

		test("should throw error if the object is not on window and it was not specified", function(fail) {
			fail.never();

			eachValidValue(function(type, value) {
				if (type && window[type.name] !== type) {
					expect(function() {
						signature(type.name)(value);
					}).toThrowError();
				}
			});
		});

		test("should pass if the type is defined on window", function(fail) {
			fail.never();

			eachValidValue(function(type, value) {
				var name = (type && type.name) + "";
				var sut = signature(name);
				sut.replace(name, type);
				sut(value);
			});
		})
	});

	describe("Optional value", function() {

		it("should fail if we try to make null optional", function() {
			expect(function() {
				opt(null);
			}).toThrowError();
		});

		describe("As return value", function() {

			test("should pass with nullable values if it's optional", function(fail) {
				fail.never();

				forEachType(function(type) {
					signature().returns(opt(type)).impl(function() { });
					signature().returns(opt(type)).impl(function() { return null });
					signature().returns(opt(type)).impl(function() { return undefined });
				});
			});
		});

		describe("As argument", function() {

			test("should pass with any type if no value, null or undefined is passed", function(fail) {
				fail.never();

				forEachType(function(type) {
					var sign = signature(opt(type));

					sign();
					sign(null);
					sign(undefined);
				});
			});

			test("should fail if only the second of two arguments is optional and no argument is passed", function(fail) {
				fail.exactly(forEachType.count * 3);

				forEachType(function(type, count) {
					signature(type, opt(type))();
					signature(type, opt(type))(null, null);
					signature(type, opt(type))(undefined, undefined);

					expectCalled(fail, count * 3, type);
				});
			});

			test("should pass if many arguments are optional and one or many are not passed", function(fail) {
				fail.never();

				eachValidValue(function(type, value, count) {
					if (type === null)
						return;

					signature(type, opt(type))(value);
					signature(type, opt(type))(value, null);
					signature(type, opt(type))(value, undefined);
				});
			})

		});

	})
});
