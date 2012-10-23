// Trigger API - Events
// ---------------------------------------

var Trigger = {
    
    /**
     * Dispatches an event on behalf of the current object.
     * @param {string} eventType the name of the event(s) to fire.
     * @param {object} extraParameters extra properties to add to the event object.
     * @see http://api.jquery.com/triggerHandler/
     * @example
     * module("MyTrigger")
     * .declare("MyTrigger").mixin("xs.Trigger")
     * .as({
     *     myMethod:function(){
     *         this.trigger({
     *             type:"myEvent",
     *             myEventData:"My event was fired!"
     *         });
     *     }
     * });
     *
     * var t = new MyTrigger();
     * t.bind("myEvent", function(event){
     *      console.log(e.myEventData);
     * });
     *
     * t.myMethod(); // Logs "My event was fired!"
    */
    trigger: function(){
        var proxy = $(this);
        return proxy.trigger.apply(proxy, $.makeArray(arguments));
    },
    
    /**
     * Binds an event with a function callback.
     * @param {string} eventType the name of the event(s) to bind to.
     * @param {object} [eventData] addtional data to dispatch with the event.
     * @param {function} handler callbcak function to be executed when the event fires.
     * @see http://api.jquery.com/bind/
     * @example
     * var group = new ui.Group() // ui.Group implements xs.Trigger
     * group.bind("childAdded", function(e){
     *    console.log("Child added to group!");
     * })
     * // Logs the message every time an item is added to a group.
     * @alias xs.Trigger.on
     */
    bind: function(){
        var proxy = $(this);
        return proxy.bind.apply(proxy, $.makeArray(arguments));
    },
    
    /**
    * Unbinds a previously binded event.
    * @param {string} [eventType] the name of the event(s) to unbind from.
    * @param {function} [handler] callback function to be unbinded.
    * @see http://api.jquery.com/unbind/
    * @example
    * var group = new ui.Group() // ui.Group implements xs.Trigger
    * group.bind("childAdded", function(e){
    *    console.log("Child added to group!");
    *    group.unbind("childAdded",arguments.callee);
    * })
    * // Logs the message when a child is added the first time and them unbinds
    * // the event, so it gets called only once.
    * @alias xs.Trigger.off
    */
    unbind: function(){
        var proxy = $(this);
        return proxy.unbind.apply(proxy, $.makeArray(arguments));
    },
    
    one: function(){
        var proxy = $(this);
        return proxy.one.apply(proxy, $.makeArray(arguments));
    }
};

Trigger.on = Trigger.bind;
Trigger.off = Trigger.unbind;
Trigger.once = Trigger.one;

/**
* @name xs.Trigger
* @class
* Mixin class that provides its implementor the ability to dispatch events.
**/
xs.Trigger = Base.extend(Trigger);