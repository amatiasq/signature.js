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

		for (i = 0, len = validValues.length; i < len; i++)
			for (j = 0, len = validValues[i].length; j < len; j++)
				callback(Object, validValues[i][j], ++count);

		for (i = 1, len = types.length; i < len; i++)
			for (j = 0, jlen = validValues[i].length; j < jlen; j++)
				callback(types[i], validValues[i][j], ++count);

		callback(SampleClass, new SampleClass, ++count);
		callback(SampleClass, new SubClass, ++count);
		callback(SubClass, new SubClass, ++count);
	}

	eachInvalidValue(function(a, b, count) { eachInvalidValue.count = count });
	function eachInvalidValue(callback) {
		var count = 0,
			i, len, j, jlen, k, klen;

		for (i = 1, len = types.length; i < len; i++)
			for (j = 0, jlen = validValues.length; j < jlen; j++)
				if (j !== i)
					for (k = 0, klen = validValues[j].length; k < klen; k++)
						callback(types[i], validValues[j][k], ++count);

		callback(SubClass, new SampleClass, ++count);
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
	});

	describe("return value validation", function() {

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
});
