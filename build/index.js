(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./library/core", "./library/sound"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require("./library/core");
    exports.PlayerCore = core_1.PlayerCore;
    var sound_1 = require("./library/sound");
    exports.PlayerSound = sound_1.PlayerSound;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7O0lBRWIsdUNBQTBEO0lBQWpELDRCQUFBLFVBQVUsQ0FBQTtJQUNuQix5Q0FBZ0U7SUFBdkQsOEJBQUEsV0FBVyxDQUFBIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydCB7IFBsYXllckNvcmUsIElDb3JlT3B0aW9ucyB9IGZyb20gJy4vbGlicmFyeS9jb3JlJztcbmV4cG9ydCB7IFBsYXllclNvdW5kLCBJU291bmRBdHRyaWJ1dGVzIH0gZnJvbSAnLi9saWJyYXJ5L3NvdW5kJztcbiJdfQ==
