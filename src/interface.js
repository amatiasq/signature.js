var Interface = (function() {

	var ifaceFlag = {};
	var slice = Array.prototype.slice;

	function createInterface(parents, members, signatures) {
		return function Interface(obj) {
			if (Interface.isImplementedBy(obj))
				return;

			for (var i = 0, len = parents.length; i < len; i++)
				parents[i](obj);

			for (var i = 0, len = members.length; i < len; i++)
				validateMethod(obj, members[i], signatures[members[i]]);

			if (obj.hasOwnProperty('__interfaces__'))
				obj.__interfaces__.push(Interface);
			else
				obj.__interfaces__ = [Interface];
		}
	}

	function validateMethod(obj, method, signature) {
		if (typeof obj[method] !== 'function')
			throw new Error('Method --[' + method + ']-- is not implemented in the object');

		var sign = signature.clone();
		sign.method = method;

		obj[method] = sign.wrap(obj[method]);
	}


	function Interface(/* superinterfaces..., config */) {
		var superInterfaces = slice.call(arguments);
		var config = superInterfaces.pop();
		var members = [];

		for (var i in config)
			if (config.hasOwnProperty(i))
				members.push(i);

		var iface = createInterface(superInterfaces, members, config);
		iface.prototype = ifaceFlag;

		iface.replace = function(name, object) {
			for (var i = 0, len = members.length; i < len; i++)
				config[members[i]].replace(name, object);
			return this;
		};

		iface.isImplementedBy = function(obj) {
			var last = obj.__interfaces__;
			if (!last)
				return false;

			if (last.indexOf(this) !== -1)
				return true;

			var current = obj;
			while (current = Object.getPrototypeOf(current)) {
				if (current.__interfaces__ !== last) {
					last = current.__interfaces__;
					if (last.indexOf(this) !== -1)
						return true;
				}
			}
		};

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
		return clazz && clazz.prototype === ifaceFlag;
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
