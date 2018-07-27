var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = this && this.__extends || function __extends(t, e) { 
 function r() { 
 this.constructor = t;
}
for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
r.prototype = e.prototype, t.prototype = new r();
};
var Coin = (function (_super) {
    __extends(Coin, _super);
    function Coin() {
        var _this = _super.call(this) || this;
        _this.createView();
        return _this;
    }
    Coin.prototype.createView = function () {
        var data = RES.getRes("coin_json");
        var txtr = RES.getRes("coin_png");
        var mcFactory = new egret.MovieClipDataFactory(data, txtr);
        var role = new egret.MovieClip(mcFactory.generateMovieClipData("coin"));
        role.gotoAndPlay(1, 3);
        role.x = 300;
        role.y = 600;
        this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, function (e) {
            role.gotoAndPlay(1, 3);
        }, this);
    };
    return Coin;
}(egret.DisplayObjectContainer));
__reflect(Coin.prototype, "Coin");
//# sourceMappingURL=Coin.js.map