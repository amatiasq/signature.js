var Interface = (function() {

	var ifaceFlag = {};
	var slice = Array.prototype.slice;

	function createInterface(parent, members, signatures) {
		function Interface(obj) {
			if (Interface.isImplementedBy(obj)

			for (var i = 0, len = parent.length; i < len; i++)
				parent[i](obj);

			for (var i = 0, len = members.length; i < len; i++)
				validateMethod(obj, members[i], signatures[members[i]]);
		}
	}

	function validateMethod(obj, method, signature) {
		if (typeof obj[method] !== 'function')
			throw new Error('Method --[' + method ']-- is not implemented in the object');

		obj[method] = signature.clone().impl(obj[method]);
	}


	function Interface(/* superinterfaces..., config */) {


		var superInterfaces = slice.call(arguments);
		var config = superInterfaces.pop();
		var members = [];

		for (var i in config)
			if (config.hasOwnProperty(i))
				members.push(config);

		var iface = createInterface(superInterfaces, members, config);
		iface.prototype = ifaceFlag;

		return iface;
	}

	var Type = signature.Type;

	var InterfaceType = Type.extend({
		isImpl: function(obj) {
			return this.clazz.isImplementedBy(obj);
		},

		doImplements: function(obj) {
			return true;
		}
	});

	InterfaceType.isInterface = function(clazz) {
		return clazz.prototype && clazz.prototype === ifaceFlag;
	};

	Type.registerCreator({
		priority: Type.CreatorInterface.FIRST_PRIORITY,

		canHandle: function(clazz) {
			return InterfaceType.isInterface(clazz);
		},

		create: function(iface) {
			return new InterfaceType(iface)
		}
	});

	return Interface;

})();
