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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztJQUNBLFlBQVksQ0FBQztJQUViLHVDQUEwRDtJQUFqRCw0QkFBQSxVQUFVLENBQUE7SUFDbkIseUNBQWdFO0lBQXZELDhCQUFBLFdBQVcsQ0FBQSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgeyBQbGF5ZXJDb3JlLCBJQ29yZU9wdGlvbnMgfSBmcm9tICcuL2xpYnJhcnkvY29yZSc7XG5leHBvcnQgeyBQbGF5ZXJTb3VuZCwgSVNvdW5kQXR0cmlidXRlcyB9IGZyb20gJy4vbGlicmFyeS9zb3VuZCc7XG4iXX0=
