(function() {

	window.dummyCounter = 0;

	function empty() {
		dummyCounter++
	};
	function chain() {
		dummyCounter++; return this;
	};


	function dummyIface(obj) {
		dummyCounter++;
		return obj
	}
	dummyIface.setName = chain;

	function Interface() {
		dummyCounter++;
		return dummyIface;
	}


	function dummySig() {
		dummyCounter++
	}
	dummySig.returns = chain;

	function signature() {
		dummyCounter++;
		return dummySig
	}

	signature.Type = {
		registerClass: empty
	};


	window.Interface = Interface;
	window.signature = signature;
	window.opt = empty

})()
