function Integer() { Number.call(this) }
Integer.prototype = new Number();

signature.Type.registerClass(Integer, 'Integer', function(val) {
	return typeof val === 'number' && Math.round(val) === val;
});


var Interface = (function() {

	function Interface() { };
	Interface.prototype = {};

	var Type = signature.Type;

	var InterfaceType = Type.extend({
		isImpl: function(obj) {
			return this.doImplements(obj);
		},

		doImplements: function(obj) {
			return true;
		}
	});

	InterfaceType.isInterface = function(clazz) {
		if (!clazz.prototype)
			return false;

		return clazz.prototype instanceof Interface || clazz.prototype === Interface.prototype;
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
