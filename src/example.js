function Integer() { Number.call(this) }
Integer.prototype = new Number();

signature.registerClass(Integer, 'Integer', function(val) {
	return typeof val === 'number' && Math.round(val) === val;
});
