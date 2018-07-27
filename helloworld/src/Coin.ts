

class Coin extends egret.DisplayObjectContainer {

    public constructor() {
        super();
        this.createView();
    }

    private createView(): void {
        var data = RES.getRes("coin_json");
        var txtr = RES.getRes("coin_png");
        var mcFactory:egret.MovieClipDataFactory = new egret.MovieClipDataFactory(data,txtr);
        var role:egret.MovieClip = new egret.MovieClip(mcFactory.generateMovieClipData("coin"));
        role.gotoAndPlay(1,3);
        role.x = 300;
        role.y = 600;
        this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, function (e:egret.TouchEvent):void {
            role.gotoAndPlay(1, 3);
        }, this);
    }
}