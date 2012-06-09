
if (typeof signature === 'function')
	console.error("types.js should be loaded after signature.js");

var signature = {};

signature.Type = (function() {

	var Type = Base.extend({

		constructor: function(clazz) {
			this.base();
			this.name = clazz.name;
			this.clazz = clazz;
			this.isOptional = false;
		},

		optional: function() {
			this.isOptional = true;
			return this;
		},

		is: function(obj) {
			if (this.isOptional && (obj === null || typeof obj === 'undefined'))
				return true;
			return this.isImpl(obj);
		},

		isImpl: function(obj) {
			return obj instanceof this.clazz;
		},

		toString: function() {
			return "[class " + this.name + "]"
		}
	});

	var CustomType = Type.extend({
		constructor: function(clazz, name, test) {
			this.base(clazz);
			this.name = name || this.name;
			this.isImpl = test || this.isImpl;
		}
	});
	var NativeType = Type.extend();

	var ObjectType = NativeType.extend({
		constructor: function() {
			this.base(Object);
			this.name = "Object";
		},

		isImpl: function() {
			return true;
		}
	});

	var MultiIframeType = NativeType.extend({
		constructor: function(clazz, name) {
			this.base(clazz);
			this.name = name;
			this.text = "[object " + name + "]";
		},

		objectToString: Object.prototype.toString,

		isImpl: function(obj) {
			return (
				obj instanceof this.clazz ||
				this.objectToString.call(obj) === this.text
			);
		}
	});

	var TypeofType = NativeType.extend({
		constructor: function(clazz, type) {
			this.base(clazz);
			this.type = type;
			this.name = this.type.charAt(0).toUpperCase() + this.type.substr(1)
		},

		isImpl: function(obj) {
			return typeof obj === this.type;
		}
	});

	var classes = [
		Boolean,
		Number,
		String,
		Function,

		Object,
		Array,
		Date
	];
	var types = [
		new TypeofType(Boolean, 'boolean'),
		new TypeofType(Number, 'number'),
		new TypeofType(String, 'string'),
		new TypeofType(Function, 'function'),

		new ObjectType(Object, 'Object'),
		new MultiIframeType(Array, 'Array'),
		new MultiIframeType(Date, 'Date')
	];
	var optional = [
		new TypeofType(Boolean, 'boolean').optional(),
		new TypeofType(Number, 'number').optional(),
		new TypeofType(String, 'string').optional(),
		new TypeofType(Function, 'function').optional(),

		new ObjectType(Object, 'Object').optional(),
		new MultiIframeType(Array, 'Array').optional(),
		new MultiIframeType(Date, 'Date').optional()
	];

	function getClassIndex(clazz, type, optional) {
		var index = classes.indexOf(clazz);

		if (index === -1) {
			index = classes.length;
			classes[index] = clazz;
			types[index] = type || new CustomType(clazz);
			optional[index] = optional || new CustomType(clazz).optional();
		}

		return index;
	}

	Type.normalize = function(clazz) {
		if (clazz instanceof Type)
			return clazz;
		return this.fromClass(clazz);
	};

	Type.fromClass = function(clazz) {
		return types[getClassIndex(clazz)];
	};

	Type.optionalFromClass = function(clazz) {
		return optional[getClassIndex(clazz)];
	};

	Type.registerClass = function(clazz, name, test) {
		getClassIndex(
			clazz,
			new CustomType(clazz, name, test),
			new CustomType(clazz, name, test).optional()
		);
	};

	return Type;

})();
