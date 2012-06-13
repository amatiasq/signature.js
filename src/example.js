// Signature - New class registration

function Integer() { Number.call(this) }
Integer.prototype = new Number();

signature.Type.registerClass(Integer, 'Integer', function(val) {
	return typeof val === 'number' && Math.round(val) === val;
});



// Interface

var IEmitter = Interface({

    on: signature(String, Function).returns(null),

    off: signature(String, Function).returns(null),

    emit: signature(String, '...').returns(String)
});

var Emitter = {
    handlers: {},

    on: function(signal, handler) {
        if (!this.handlers[signal])
            this.handlers[signal] = [];
        this.handlers[signal].push(handler);
    },

    off: function() { },

    emit: function(signal/*, data...*/) {
        if (!this.handlers[signal])
            return;

        var args = Array.prototype.slice.call(arguments, 1);

        var handlers = this.handlers[signal];
        for (var i = 0; i < handlers.length; i++) {
            handlers[i].apply(null, args);
        }
    }
};

IEmitter(Emitter);

Emitter.on('pepe', function(str1, str2, num) {
	console.log('Recived: ' + str1 + ' ' + str2 + ' ' + num)
});

setTimeout(function() {

    Emitter.emit('pepe', "hola", "mundo", 2)

}, 2000)
