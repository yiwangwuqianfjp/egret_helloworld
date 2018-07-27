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
var MachineHand = (function (_super) {
    __extends(MachineHand, _super);
    function MachineHand() {
        var _this = _super.call(this) || this;
        // 齿轮转动的角度
        _this.gearAngle = 360;
        /**
         * 手指旋转角度
         */
        _this.handR = 10;
        _this.createView();
        return _this;
    }
    MachineHand.prototype.createView = function () {
        this.width = 347;
        this.height = 643;
        // 吊钩
        var hookImage = this.createBitmapByName("clip_0_png");
        hookImage.x = this.width / 2 - hookImage.width / 2;
        this.addChild(hookImage);
        // 转动的齿轮
        var gearImage = this.createBitmapByName("gear_png");
        gearImage.anchorOffsetX = gearImage.width / 2;
        gearImage.anchorOffsetY = gearImage.height / 2;
        gearImage.y = hookImage.height - 90;
        gearImage.x = this.width / 2;
        this.addChild(gearImage);
        this.clockwiseAnimation = egret.Tween.get(gearImage, { loop: true }).
            to({ rotation: gearImage.rotation + this.gearAngle }, 3000);
        // this.anticlockwiseAnimation = egret.Tween.get(gearImage, { loop: true }).
        // to({ rotation: gearImage.rotation - this.gearAngle }, 3000);
        egret.Tween.pauseTweens(gearImage);
        this.gear = gearImage;
        // 左手指
        var space = 48;
        var figerWidth = 116;
        var letfFingerImage = this.createBitmapByName("clip_1_png");
        letfFingerImage.anchorOffsetX = letfFingerImage.width;
        letfFingerImage.y = this.height - 143 - 30;
        letfFingerImage.x = figerWidth + space;
        this.addChild(letfFingerImage);
        this.leftFinger = letfFingerImage;
        // 右手指
        var rightFingerImage = this.createBitmapByName("clip_1_png");
        rightFingerImage.anchorOffsetX = rightFingerImage.width;
        rightFingerImage.y = letfFingerImage.y;
        rightFingerImage.x = letfFingerImage.x + (this.width - figerWidth * 2) - 2 * space;
        rightFingerImage.scaleX = -1;
        this.addChild(rightFingerImage);
        this.rightFinger = rightFingerImage;
        // 房子
        var houseImage = this.createBitmapByName("house1_1_png");
        houseImage.anchorOffsetX = houseImage.width / 2;
        houseImage.anchorOffsetY = houseImage.height / 2;
        houseImage.x = this.width / 2;
        houseImage.y = this.height - houseImage.height / 2;
        this.house = houseImage;
        this.addChild(houseImage);
        // 重置深度
        this.setChildIndex(hookImage, this.getChildIndex(rightFingerImage));
    };
    /**
    * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
    * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
    */
    MachineHand.prototype.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    /**
     * 抓取房子
     */
    MachineHand.prototype.graspHouse = function (isLeft) {
        this.leftFinger.rotation = 0;
        this.rightFinger.rotation = 0;
        this.showHouse();
        // if(isLeft){
        //     this.clockwiseAnimation.play();
        //     this.anticlockwiseAnimation.pause();
        // }else{
        //     this.clockwiseAnimation.pause();
        //     this.anticlockwiseAnimation.play();
        // }
    };
    /**
     * 松开机械手
     */
    MachineHand.prototype.relaxHand = function () {
        egret.Tween.get(this.leftFinger).to({ rotation: this.handR }, 300);
        egret.Tween.get(this.rightFinger).to({ rotation: -this.handR }, 300);
    };
    MachineHand.prototype.showHouse = function () {
        this.addChild(this.house);
    };
    MachineHand.prototype.hideHouse = function () {
        this.removeChild(this.house);
    };
    /**
     * 房子是否出現,當房子出現不到一半或者沒有添加到父試圖上時,認為沒有出現
     */
    MachineHand.prototype.houseIsDisplay = function () {
        if (this.house.parent == null) {
            return false;
        }
        if (this.x < -this.width / 2) {
            return false;
        }
        if (this.x > this.stage.stageWidth - this.width / 2) {
            return false;
        }
        return true;
    };
    /**
     * 创建刚体的display
     */
    MachineHand.prototype.createDisplay = function (imgName) {
        var display;
        display = this.createBitmapByName(imgName);
        display.anchorOffsetX = display.width / 2;
        display.anchorOffsetY = display.height / 2;
        var point = this.house.localToGlobal(this.house.width / 2, this.house.height / 2);
        display.x = point.x;
        display.y = point.y;
        return display;
    };
    /**
     * 停止机械手
     */
    MachineHand.prototype.pause = function () {
        egret.Tween.pauseTweens(this.gear);
        egret.Tween.pauseTweens(this);
    };
    // 开动机械手
    MachineHand.prototype.run = function () {
        egret.Tween.resumeTweens(this.gear);
        if (this.animation) {
            egret.Tween.resumeTweens(this);
        }
        else {
            var display = this;
            display.y = -100;
            var duration = 6000;
            var oriX = display.x;
            var maxX = this.stage.stageWidth;
            var minX = -display.width;
            var totalDiff = (maxX - minX) * 2;
            var toMaxDuration = duration * (maxX - oriX) / totalDiff;
            var toMinDuration = duration * (maxX - minX) / totalDiff;
            var toOriDuration = duration * (oriX - minX) / totalDiff;
            this.animation = egret.Tween.get(display, { loop: true }).
                to({ x: maxX }, toMaxDuration).call(this.graspHouse).
                to({ x: minX }, toMinDuration).call(this.graspHouse).
                to({ x: oriX }, toOriDuration);
        }
    };
    /**
     * 停止机械手
     */
    MachineHand.prototype.stop = function () {
        egret.Tween.removeTweens(this);
        egret.Tween.removeTweens(this.gear);
    };
    /**
    * 放开房子
    */
    MachineHand.prototype.relaxHouse = function () {
        this.relaxHand();
        // 创建一个新的房子
        var display = this.createDisplay("house1_1_png");
        // 隐藏机械手抓着的房子
        this.hideHouse();
        // 机械手暂停
        this.pause();
        return display;
    };
    return MachineHand;
}(egret.Sprite));
__reflect(MachineHand.prototype, "MachineHand");
//# sourceMappingURL=MachineHand.js.map