var Interface = (function() {

	var ifaceFlag = {};
	var slice = Array.prototype.slice;
	var ifaceProp = '__interfaces__';

	function createInterface(parents, members, signatures) {
		return function Interface(obj) {
			if (Interface.isImplementedBy(obj))
				return;

			for (var i = 0, len = parents.length; i < len; i++)
				parents[i](obj);

			for (var i = 0, len = members.length; i < len; i++)
				validateMethod(obj, members[i], signatures[members[i]]);

			if (obj.hasOwnProperty(ifaceProp))
				obj[ifaceProp].push(Interface);
			else
				obj[ifaceProp] = [Interface];
		}
	}

	function validateMethod(obj, method, signature) {
		if (typeof obj[method] !== 'function')
			throw new Error('Method --[' + method + ']-- is not implemented in the object');

		var sign = signature.clone().setName(method);
		obj[method] = sign.impl(obj[method]);
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

		iface.setName = function(name) {
			this._name = name;
			this.replace(name, this);

			for (var i = 0, len = members.length; i < len; i++)
				config[members[i]].setClass(name);

			return this;
		};

		iface.toString = function() {
			return '[interface ' + (this._name || 'Interface') + ']';
		}

		iface.isImplementedBy = function(current) {
			if (current === null || typeof current === 'undefined')
				return false;

			var list = current[ifaceProp];
			if (!list)
				return false;

			if (list.indexOf(this) !== -1)
				return true;

			while (current = Object.getPrototypeOf(current))
				if (current[ifaceProp] !== list)
					return this.isImplementedBy(current);
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
		},

		toString: function() {
			return this.clazz.toString();
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
