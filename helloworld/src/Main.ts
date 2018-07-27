
class Main extends egret.DisplayObjectContainer {
    
    /**
     * 加载进度界面
    */
    private loadingView: LoadingUI;

    //debug模式，使用图形绘制
    private isDebug: boolean = false;

    // 掉下去了
    private isFail: boolean = false;

    // 上次碰撞的刚体ID
    private hitID = 0;

    // 世界
    private world: p2.World;
    // 地基的宽度和高度
    private baseW = 8;
    private baseH = 4;

    // 刚体在物理世界的宽和高
    private boxWidth = 4;
    private boxHeight = 2;

    // 在世界中坐标的比例
    private factor = 50;

    // 滚动背景图
    private bgView: egret.DisplayObjectContainer;

    // 世界内的物体容器
    private worldContainer: egret.DisplayObjectContainer;

    // 机械手
    private machinehand: MachineHand;

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event: egret.Event) {
        // 设置加载进度界面
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);

        // 初始化Res资源加载库
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组
    */
    private onConfigComplete(event: RES.ResourceEvent): void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.loadGroup("preload");
    }

    /**
     * preload 资源组加载完成
    */
    private onResourceLoadComplete(event: RES.ResourceEvent): void {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            this.createGameScene();
        }

    }

    /**
     * preload资源组加载进度
    */
    private onResourceProgress(event: RES.ResourceEvent): void {
        if (event.groupName == "preload") {
            // this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }

    /**
      * 创建游戏场景
      * Create a game scene
      */
    private createGameScene() {

        this.setWorld();
        this.setWorldContainer();
        this.setBgView();
        this.setMachineHand();
        this.setBaseBody();
        this.exchangeMessageWithNative();
    }

    /**
     * 创建world
     */
    private setWorld(){
        var world: p2.World = new p2.World();
        world.sleepMode = p2.World.BODY_SLEEPING;
        world.defaultContactMaterial.restitution = 0;
        this.world = world;
    }

    /**
     * 设置世界里物体的容器
     */
    private setWorldContainer(){
        var worldContainer = new egret.DisplayObjectContainer();
        this.worldContainer = worldContainer;
        this.addChild(worldContainer);
        worldContainer.x = 0;
        worldContainer.y = 0;
        worldContainer.width = this.stage.stageWidth;
        worldContainer.height = this.stage.stageHeight;
    }

    /**
     * 设置背景
     */
    private setBgView(){
        // 天空背景
        var bottomImage: egret.Bitmap = this.createBitmapByName("house1_sky_0_png");
        var topImage: egret.Bitmap = this.createBitmapByName("house1_sky_1_png");
        var content: egret.DisplayObjectContainer = new egret.DisplayObjectContainer()
        bottomImage.y = topImage.measuredHeight;
        content.addChild(topImage);
        content.addChild(bottomImage);
        content.y = -topImage.measuredHeight;
        this.bgView = content;
        this.worldContainer.addChild(content);

        // 楼房背景
        var buildingImage: egret.Bitmap = this.createBitmapByName("house1_floor_png");// 640 535
        var buildingBgView = new egret.DisplayObjectContainer();
        buildingBgView.y = this.stage.stageHeight - 535;
        buildingBgView.x = 0;
        buildingBgView.addChild(buildingImage);
        this.worldContainer.addChild(buildingBgView);
    }

    /**
     * 添加机械手
    */

    private setMachineHand() {

        // 机械手
        var hand = new MachineHand();
        hand.x = (this.stage.stageWidth - hand.width) / 2;
        hand.y = - hand.height;
        this.machinehand = hand;
        this.addChild(hand);
        egret.Tween.get(hand).to({ y: - 100 }, 500, egret.Ease.backOut);
        this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, this.letHouseGo, this);
    }

    /**
     * 设置地基上的房子
     */
    private setBaseBody(){
        var baseBody = this.createBody(this.baseW, this.baseH, 0);
        var display = this.createDisplay("house1_0_png");
        baseBody.displays = [display];
        this.worldContainer.addChild(display);
        baseBody.position = [this.stage.stageWidth / 100, this.baseH * 0.5 + 128 / this.factor];
        this.world.addBody(baseBody);
        egret.Ticker.getInstance().register(this.worldChange, this);
    }

    /**
     * 与native通信
     */
    private exchangeMessageWithNative(){
        // 开始游戏 发消息给native
        egret.ExternalInterface.call("sendToNative", "游戏开始");
        // 接收native的消息
        egret.ExternalInterface.addCallback("sendToJS", function (message: string) {
            alert("收到native消息:" + message);
        });
    }

    /**
     * 放开房子
     */
    private letHouseGo() {
        if (this.machinehand.houseIsDisplay() == false) {
            return;
        }
        var boxBody = this.createBody(this.boxWidth, this.boxHeight);
        var display = this.machinehand.relaxHouse();
        boxBody.displays = [display];
        this.worldContainer.addChild(display);
        var positionX: number = display.x / this.factor;
        var positionY: number = (this.worldContainer.y + this.worldContainer.height - display.y + display.anchorOffsetY - 50) / this.factor;
        boxBody.position = [positionX, positionY];
        // 添加到世界
        this.world.addBody(boxBody);
    }

    /**
     * 创建刚体
     */
    private createBody(boxWidth: number, boxHeight: number, m: number = 1): p2.Body {
        //添加方形刚体
        var boxShape: p2.Shape = new p2.Box({ width: boxWidth, height: boxHeight });
        var boxBody: p2.Body = new p2.Body({
            mass: m,
            angularVelocity: 0,
            gravityScale: 2,
            damping: 0.7
        });
        boxBody.addShape(boxShape);
        return boxBody;
    }

    /**
     * 创建刚体的display
     */
    private createDisplay(imgName: string): egret.DisplayObject {
        var display: egret.DisplayObject;
        display = this.createBitmapByName(imgName);
        display.anchorOffsetX = display.width / 2;
        display.anchorOffsetY = display.height / 2;
        return display;
    }

    /**
     *  碰撞
    */
    private hit() {
        this.playSoundWithName("hit_mp3");
        var self = this;
        var count = this.world.bodies.length;
        egret.setTimeout(function () {
            let boxHieght = self.boxHeight;
            if (self.isFail == false) {
                self.machinehand.run();
            }
            egret.Tween.get(self.bgView).to({ y: self.bgView.y - self.factor }, 300);
            egret.Tween.get(self.worldContainer).to({ y: self.worldContainer.y + boxHieght * self.factor }, 300);
        }, 0, 1000);
        this.worldContainerShack();
    }

    /**
     * 震动
     */
    private worldContainerShack() {
        var oriY = this.worldContainer.y;
        var amplitude = 5;
        egret.Tween.get(this.worldContainer).to({ y: oriY + amplitude }, 100, egret.Ease.elasticInOut).to({ y: oriY }, 100, egret.Ease.elasticInOut);
    }

    /**
     * 掉下去了
     */
    private fail() {
        this.playSoundWithName("break_mp3");
        this.machinehand.stop();
        this.stage.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.letHouseGo, this);
        // 发消息给native
        egret.ExternalInterface.call("getResultSuccess", "游戏结束");
    }

    /**
     * 世界中物体的变化
     */
    private worldChange(dt: number) {
        if (dt < 10) {
            return;
        }
        if (dt > 1000) {
            return;
        }
        var world = this.world;
        var factor = this.factor;
        world.step(dt / 1000);
        var stageHeight: number = egret.MainContext.instance.stage.stageHeight;
        var l = world.bodies.length;
        this.testHit();
        this.testFallDown();
        for (var i: number = 0; i < l; i++) {
            var boxBody: p2.Body = world.bodies[i];
            var box: egret.DisplayObject = boxBody.displays[0];
            if (box) {
                box.x = boxBody.position[0] * factor;
                box.y = stageHeight - boxBody.position[1] * factor;
                box.rotation = 360 - (boxBody.angle + boxBody.shapes[0].angle) * 180 / Math.PI;
            }
        }
    }

    /**
     * 判断最上面的两个物体是否相撞
     * fallBody 正在掉落的物体
     * topBody 上一次落下的物体
     * count 世界的物体总数量
    */
    private testHit() {
        var isHit = false;
        var count = this.world.bodies.length;
        if (count < 2) { return }
        var fallBody = this.world.bodies[count - 1];
        var topBody = this.world.bodies[count - 2];
        // 这两个物体之间在物理世界y坐标的差
        let diff = fallBody.position[1] - topBody.position[1];
        if (count == 2) {
            isHit = diff <= (this.baseH + this.boxHeight) / 2
        } else {
            isHit = diff <= this.boxHeight;
        }
        if (isHit && fallBody.id != this.hitID) {
            console.log("碰撞上了---->", count - 1);
            this.hitID = fallBody.id;
            this.hit();
        }
    }

    /**
     * 判断最新加入世界的物体是否掉下来
     * fallBody 刚进入世界的正在掉落的物体
     * baseBody 最底下的物体(基座)
     * count 世界的物体总数量
     */
    private testFallDown() {
        // 只要fallBody的重心小于基座的重心加上其他物体的高度之和,就可以确定此物体要掉下来了
        // 由于会有弹性形变,我们将这个值的精度设置粗一点
        var isFallDown = false;
        var count = this.world.bodies.length;
        if (count < 2) { return }
        var fallBody = this.world.bodies[count - 1];
        var baseBody = this.world.bodies[0];
        // 掉落物体距离基座重心之差
        let diff = fallBody.position[1] - baseBody.position[1];
        // 正常情况diff ==  diff < (count - 2) * this.boxHeight + this.sh / 2 + this.boxHeight / 2;
        // 为了避免弹性形变导致的偏差,将this.boxHeight / 2去掉了
        isFallDown = diff < (count - 2) * this.boxHeight + this.baseH / 2;
        if (isFallDown && this.isFail == false) {
            console.log("掉下去了!!!!!!!!!!!---->", count - 1);
            this.isFail = true;
            this.fail();
        }
    }

    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name: string) {
        let result = new egret.Bitmap();
        let texture: egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }

    /**
     * 创建一个方形
     */
    private createBox(width: number, height: number): egret.Shape {
        var shape = new egret.Shape();
        shape.graphics.beginFill(0xfff000);
        shape.graphics.drawRect(0, 0, width, height);
        shape.graphics.endFill();
        return shape;
    }

    /**
     * 播放音乐
     */
    private playSoundWithName(name:string){
        var sound: egret.Sound = RES.getRes(name);
        sound.play(0, 1);
    }
}