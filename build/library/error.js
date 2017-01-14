var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports"], function (require, exports) {
    "use strict";
    // https://github.com/Microsoft/TypeScript/issues/12123
    var PlayerError = (function (_super) {
        __extends(PlayerError, _super);
        function PlayerError(message, code) {
            var _this = _super.call(this, message) || this;
            _this.code = code || null;
            // Set the prototype explictilly
            Object.setPrototypeOf(_this, PlayerError.prototype);
            return _this;
        }
        return PlayerError;
    }(Error));
    exports.PlayerError = PlayerError;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2Vycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0lBS0EsdURBQXVEO0lBQ3ZEO1FBQWlDLCtCQUFLO1FBSWxDLHFCQUFZLE9BQWUsRUFBRSxJQUFhO1lBQTFDLFlBRUksa0JBQU0sT0FBTyxDQUFDLFNBT2pCO1lBTEcsS0FBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDO1lBRXpCLGdDQUFnQztZQUNoQyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUksRUFBRSxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7O1FBRXZELENBQUM7UUFFTCxrQkFBQztJQUFELENBZkEsQUFlQyxDQWZnQyxLQUFLLEdBZXJDO0lBZlksa0NBQVciLCJmaWxlIjoibGlicmFyeS9lcnJvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5leHBvcnQgaW50ZXJmYWNlIElQbGF5ZXJFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIGNvZGU6IG51bWJlciB8IG51bGw7XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTIxMjNcclxuZXhwb3J0IGNsYXNzIFBsYXllckVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG5cclxuICAgIHB1YmxpYyBjb2RlOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb2RlPzogbnVtYmVyKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICB0aGlzLmNvZGUgPSBjb2RlIHx8IG51bGw7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgcHJvdG90eXBlIGV4cGxpY3RpbGx5XHJcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIFBsYXllckVycm9yLnByb3RvdHlwZSk7XHJcblxyXG4gICAgfVxyXG5cclxufVxyXG4iXX0=
