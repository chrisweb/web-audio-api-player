(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "./library/core", "./library/sound"], function (require, exports) {
    'use strict';
    var core_1 = require("./library/core");
    exports.PlayerCore = core_1.PlayerCore;
    var sound_1 = require("./library/sound");
    exports.PlayerSound = sound_1.PlayerSound;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9zb3VyY2UvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYix1Q0FBMEQ7SUFBakQsNEJBQUEsVUFBVSxDQUFBO0lBQ25CLHlDQUFnRTtJQUF2RCw4QkFBQSxXQUFXLENBQUEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IHsgUGxheWVyQ29yZSwgSUNvcmVPcHRpb25zIH0gZnJvbSAnLi9saWJyYXJ5L2NvcmUnO1xuZXhwb3J0IHsgUGxheWVyU291bmQsIElTb3VuZEF0dHJpYnV0ZXMgfSBmcm9tICcuL2xpYnJhcnkvc291bmQnO1xuIl19
