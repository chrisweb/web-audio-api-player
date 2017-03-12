var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2Vycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUtBLHVEQUF1RDtJQUN2RDtRQUFpQywrQkFBSztRQUlsQyxxQkFBWSxPQUFlLEVBQUUsSUFBYTtZQUExQyxZQUVJLGtCQUFNLE9BQU8sQ0FBQyxTQU9qQjtZQUxHLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQztZQUV6QixnQ0FBZ0M7WUFDaEMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztRQUV2RCxDQUFDO1FBRUwsa0JBQUM7SUFBRCxDQWZBLEFBZUMsQ0FmZ0MsS0FBSyxHQWVyQztJQWZZLGtDQUFXIiwiZmlsZSI6ImxpYnJhcnkvZXJyb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuZXhwb3J0IGludGVyZmFjZSBJUGxheWVyRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgICBjb2RlOiBudW1iZXIgfCBudWxsO1xyXG59XHJcblxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzEyMTIzXHJcbmV4cG9ydCBjbGFzcyBQbGF5ZXJFcnJvciBleHRlbmRzIEVycm9yIHtcclxuXHJcbiAgICBwdWJsaWMgY29kZTogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29kZT86IG51bWJlcikge1xyXG5cclxuICAgICAgICBzdXBlcihtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZSB8fCBudWxsO1xyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHByb3RvdHlwZSBleHBsaWN0aWxseVxyXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBQbGF5ZXJFcnJvci5wcm90b3R5cGUpO1xyXG5cclxuICAgIH1cclxuXHJcbn1cclxuIl19
