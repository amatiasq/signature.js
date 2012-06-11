var Integer = Base.extend.call(Number);

signature.registerClass(Integer, 'Integer', function(val) {
	return typeof val === 'number' && Math.round(val) === val;
});
