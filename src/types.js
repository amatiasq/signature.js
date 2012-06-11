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

	var NullType = NativeType.extend({
		constructor: function() { },

		is: function(obj) {
			return obj === null || typeof obj === 'undefined';
		},

		toString: function() {
			return 'null';
		}
	});

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
			return typeof obj === this.type || obj instanceof this.clazz;
		}
	});

	var classes = [
		Boolean,
		Number,
		String,
		Function,

		null,
		Object,
		Array,
		Date
	];
	var types = [
		new TypeofType(Boolean, 'boolean'),
		new TypeofType(Number, 'number'),
		new TypeofType(String, 'string'),
		new TypeofType(Function, 'function'),

		new NullType(),
		new ObjectType(),
		new MultiIframeType(Array, 'Array'),
		new MultiIframeType(Date, 'Date')
	];
	var optional = [
		new TypeofType(Boolean, 'boolean').optional(),
		new TypeofType(Number, 'number').optional(),
		new TypeofType(String, 'string').optional(),
		new TypeofType(Function, 'function').optional(),

		null,
		new ObjectType().optional(),
		new MultiIframeType(Array, 'Array').optional(),
		new MultiIframeType(Date, 'Date').optional()
	];



	var CreatorInterface = Base.extend({
		priority: 10,
		canHandle: function(type) { },
		create: function(type) { },
	});
	CreatorInterface.FIRST_PRIORITY = 0;
	CreatorInterface.LAST_PRIORITY = 20;

	var Creators = {
		list: [],

		register: function(creator) {
			for (var i = 0, len = this.list.length; i < len; i++)
				if (this.list[i].priority <= creator.priority)
					break;
			this.list.splice(i, 0, creator);
		},

		get: function(clazz) {
			for (var i = 0, len = this.list.length; i < len; i++)
				if (this.list[i].canHandle(clazz))
					return this.list[i];
		}
	};

	function getClassIndex(clazz, args) {
		var index = classes.indexOf(clazz);

		if (index === -1) {
			var creator = Creators.get(clazz, args);
			index = classes.length;
			classes[index] = clazz;
			types[index] = creator.create(clazz, args);
			optional[index] = creator.create(clazz, args).optional();
		}

		return index;
	};

	Type.normalize = function(clazz) {
		if (clazz instanceof Type)
			return clazz;
		return this.fromClass(clazz);
	};

	Type.fromClass = function(clazz) {
		return types[getClassIndex(clazz)];
	};

	Type.optionalFromClass = function(clazz) {
		if (clazz === null)
			throw new Error('Null cannot be optional');

		return optional[getClassIndex(clazz)];
	};

	Type.registerClass = function(clazz, name, test) {
		getClassIndex(clazz, [ name, test ]);
	};

	Type.registerCreator = function(creator) {
		Creators.register(creator);
	};

	Type.CreatorInterface = CreatorInterface;


	var CustomTypeCreator = CreatorInterface.extend({
		canHandle: function(type) {
			return true;
		},
		create: function(clazz, args) {
			if (!args)
				args = [];
			return new CustomType(clazz, args[0], args[1]);
		}
	});

	Type.registerCreator(new CustomTypeCreator());


	return Type;

})();

/*
var Interface = (function() {

	var Interface = Base.extend({
		isImplementedBy: function() { }
	});

	var InterfaceType = Type.extend({
		isImpl: function(obj) {
			return this.clazz.isImplementedBy(obj);
		}
	});

	var InterfaceCreator = Type.CreatorInterface.extend({
		priority: Type.CreatorInterface.FIRST_PRIORITY,

		canHandle: function(clazz) {
			return Interface.isInterface(clazz);
		},

		create: function(iface) {
			return new InterfaceType(iface)
		}
	});

	Type.registerCreator(InterfaceCreator);

	return Interface;

})()
*/
