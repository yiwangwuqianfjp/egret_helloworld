
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
    // 地面
    private planeBody: p2.Body;
    // 世界
    private world: p2.World;
    // 地面距离舞台的初始高度
    private sh = 7;
    // 刚体在物理世界的宽和高
    private boxWidth = 6;
    private boxHeight = 3;
    // 在世界中坐标的比例
    private factor = 50;

    // 滚动背景图
    private bgscrollView: egret.ScrollView = new egret.ScrollView();

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
     * 添加背景滚动视图
    */

    private addBgScrollView() {
        var content: egret.Bitmap = this.createBitmapByName("bg_jpg");

        //创建ScrollView
        let myscrollView = this.bgscrollView;
        myscrollView.setContent(content);
        myscrollView.width = this.stage.stageWidth;
        myscrollView.height = this.stage.stageHeight;
        myscrollView.x = 0;
        myscrollView.y = 0;
        this.addChild(myscrollView);

        content.width = myscrollView.width;
        content.height = myscrollView.height * 2;
        myscrollView.scrollTop = this.stage.stageHeight;
        myscrollView.verticalScrollPolicy = "off";
    }

    // 漂浮的物体
    // private flowBody:p2.Body;
    private flowDisplay: egret.DisplayObject;

    // 漂浮动画
    private flowAnimation(display: egret.DisplayObject) {
        var rect = display;
        rect.y = 100;
        this.addChild(rect);
        let duration = 3000;
        egret.Tween.get(rect, { loop: true }).to({ x: this.stage.stageWidth + 100 }, duration).to({ x: -100 }, duration);
    }

    /**
     * 创建刚体
    */
    private createBody(boxWidth: number, boxHeight: number, factor: number, m: number = 1): [p2.Body, egret.DisplayObject] {
        var display: egret.DisplayObject;
        //添加方形刚体
        var boxShape: p2.Shape = new p2.Box({ width: boxWidth, height: boxHeight });
        var boxBody: p2.Body = new p2.Body({
            mass: m,
            angularVelocity: 0,
            gravityScale: 2,
            damping: 0.7
        });
        boxBody.addShape(boxShape);

        if (this.isDebug) {
            display = this.createBox((<p2.Box>boxShape).width * factor, (<p2.Box>boxShape).height * factor);
        } else {
            display = this.createBitmapByName("rect_png");
        }
        display.width = (<p2.Box>boxShape).width * factor;
        display.height = (<p2.Box>boxShape).height * factor;

        display.anchorOffsetX = display.width / 2;
        display.anchorOffsetY = display.height / 2;
        boxBody.displays = [display];
        this.addChild(display);
        return [boxBody, display];
    }

    /**
    * 定时添加刚体
   */
    private addBoxByTimer(factor: number, boxWidth: number, boxHeight: number, world: p2.World) {
        if (this.flowDisplay || this.isFail) {
            return;
        }
        var array = this.createBody(boxWidth, boxHeight, factor);
        var boxBody = array[0];
        var display = array[1];
        this.flowDisplay = display;
        this.flowAnimation(display);

        this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, addOneBox, this);
        let self = this;

        function addOneBox(e: egret.TouchEvent): void {
            if (boxBody.displays[0] == self.flowDisplay) {
                self.flowDisplay = null;
                var positionX: number = display.x / factor;
                var positionY: number = Math.floor((egret.MainContext.instance.stage.stageHeight - display.y) / factor);
                boxBody.position = [positionX, positionY];
                // 添加到世界
                world.addBody(boxBody);
                // 停止动画
                egret.Tween.pauseTweens(display);

                // 延迟三秒后添加新的刚体
                egret.setTimeout(function () {
                    self.addBoxByTimer(factor, boxWidth, boxHeight, world)
                }, 1, 3000);
            }
        }
    }



    /**
     *  碰撞
    */
    private hit() {

        var sound: egret.Sound = RES.getRes("hit_mp3");
        sound.play(0, 1);
        var self = this;
        var count = this.world.bodies.length;
        egret.setTimeout(function () {
            let boxHieght = 3;
            for (var i = 0; i < count; i++) {
                var body = self.world.bodies[i];
                var positionY = body.position[1];
                positionY -= boxHieght;
                body.position = [body.position[0], positionY]
            }
            self.bgscrollView.scrollTop -= boxHieght * 50;
        }, 0, 2000);

    }

    private fail() {
        var sound: egret.Sound = RES.getRes("break_mp3");
        sound.play(0, 1);
    }

    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene() {

        // 添加背景
        this.addBgScrollView();

        //创建world
        var world: p2.World = new p2.World();
        world.sleepMode = p2.World.BODY_SLEEPING;
        world.defaultContactMaterial.restitution = 0;
        this.world = world;

        //创建一个地基
        var array = this.createBody(8, this.sh, 50, 0);
        var baseBody = array[0];
        baseBody.position = [this.stage.stageWidth / 100, this.sh * 0.5];
        world.addBody(baseBody);
        egret.Ticker.getInstance().register(this.worldChange, this);
        this.addBoxByTimer(this.factor, this.boxWidth, this.boxHeight, world);
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
            isHit = diff <= (this.sh + this.boxHeight) / 2
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
        isFallDown = diff < (count - 2) * this.boxHeight + this.sh / 2;
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

}