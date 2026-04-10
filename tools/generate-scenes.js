/**
 * DongJia Scene & Prefab Generator
 * 生成 Cocos Creator 3.8 格式的 .scene 和 .prefab 文件
 *
 * 用法：node tools/generate-scenes.js
 * 输出：assets/scenes/loading.scene, assets/scenes/login.scene
 *       assets/prefabs/ui/OrderCard.prefab, assets/prefabs/ui/NPCCard.prefab
 *       并更新 assets/scenes/main.scene 为完整 UI 场景
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── UUID 生成 ──────────────────────────────────────────────

function uuid() {
    return crypto.randomBytes(10).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 22);
}

// ─── 场景构建器 ─────────────────────────────────────────────

class SceneBuilder {
    constructor(name) {
        this.name = name;
        this.objects = [];
        // 场景基础结构
        this._buildBase();
    }

    _buildBase() {
        // 0: SceneAsset
        this.objects.push({
            "__type__": "cc.SceneAsset",
            "_name": this.name,
            "_objFlags": 0,
            "_native": "",
            "scene": { "__id__": 1 }
        });
        // 1: Scene
        this.sceneObj = {
            "__type__": "cc.Scene",
            "_name": this.name,
            "_objFlags": 0,
            "_parent": null,
            "_children": [],
            "_active": true,
            "_components": [],
            "_prefab": null,
            "autoReleaseAssets": false,
            "_globals": null, // 填充后设置
            "_id": uuid()
        };
        this.objects.push(this.sceneObj);
        // Light
        const lightNodeIdx = this._addNode("Main Light", 1, [],
            { x: 0, y: 0, z: 0 },
            { x: -0.064, y: -0.446, z: -0.824, w: -0.344 });
        this._addComponent("cc.DirectionalLight", lightNodeIdx, {
            "_color": { "__type__": "cc.Color", "r": 255, "g": 250, "b": 240, "a": 255 },
            "_useColorTemperature": false,
            "_colorTemperature": 6550,
            "_staticSettings": { "__id__": this.objects.length },
            "_illuminanceHDR": 65000,
            "_illuminance": 65000,
            "_illuminanceLDR": 1.69
        });
        this.objects.push({
            "__type__": "cc.StaticLightSettings",
            "_baked": false, "_editorOnly": false, "_bakeable": false, "_castShadow": false
        });
        // Camera (3D)
        const camNodeIdx = this._addNode("Main Camera", 1, [],
            { x: -10, y: 10, z: 10 },
            { x: -0.278, y: -0.365, z: -0.115, w: 0.881 });
        this._addComponent("cc.Camera", camNodeIdx, {
            "_projection": 1, "_priority": 0, "_fov": 45, "_fovAxis": 0,
            "_orthoHeight": 10, "_near": 1, "_far": 1000,
            "_color": { "__type__": "cc.Color", "r": 51, "g": 51, "b": 51, "a": 255 },
            "_depth": 1, "_stencil": 0, "_clearFlags": 14,
            "_rect": { "__type__": "cc.Rect", "x": 0, "y": 0, "width": 1, "height": 1 },
            "_aperture": 19, "_shutter": 7, "_iso": 0, "_screenScale": 1,
            "_visibility": 1822425087, "_targetTexture": null
        });
        // SceneGlobals
        const globalsIdx = this.objects.length;
        this.objects.push({
            "__type__": "cc.SceneGlobals",
            "ambient": { "__id__": globalsIdx + 1 },
            "shadows": { "__id__": globalsIdx + 2 },
            "_skybox": { "__id__": globalsIdx + 3 },
            "fog": { "__id__": globalsIdx + 4 }
        });
        this.objects.push({
            "__type__": "cc.AmbientInfo",
            "_skyColorHDR": { "__type__": "cc.Vec4", "x": 0.366, "y": 0.568, "z": 0.908, "w": 0 },
            "_skyIllumHDR": 20000, "_skyIllum": 20000,
            "_groundAlbedoHDR": { "__type__": "cc.Vec4", "x": 0.456, "y": 0.403, "z": 0.371, "w": 0 },
            "_skyColorLDR": { "__type__": "cc.Vec4", "x": 0.453, "y": 0.608, "z": 0.756, "w": 0 },
            "_skyIllumLDR": 0.8,
            "_groundAlbedoLDR": { "__type__": "cc.Vec4", "x": 0.619, "y": 0.578, "z": 0.545, "w": 0 }
        });
        this.objects.push({
            "__type__": "cc.ShadowsInfo",
            "_type": 0, "_enabled": false,
            "_normal": { "__type__": "cc.Vec3", "x": 0, "y": 1, "z": 0 },
            "_distance": 0,
            "_shadowColor": { "__type__": "cc.Color", "r": 76, "g": 76, "b": 76, "a": 255 },
            "_firstSetCSM": false, "_fixedArea": false, "_pcf": 1,
            "_bias": 0.00001, "_normalBias": 0, "_near": 0.1, "_far": 10,
            "_shadowDistance": 10, "_invisibleOcclusionRange": 200, "_orthoSize": 5,
            "_maxReceived": 4,
            "_size": { "__type__": "cc.Vec2", "x": 1024, "y": 1024 },
            "_saturation": 0.75
        });
        this.objects.push({
            "__type__": "cc.SkyboxInfo",
            "_applyDiffuseMap": false, "_enabled": false, "_useIBL": false, "_useHDR": true,
            "_envmapHDR": null, "_envmap": null, "_envmapLDR": null,
            "_diffuseMapHDR": null, "_diffuseMapLDR": null
        });
        this.objects.push({
            "__type__": "cc.FogInfo",
            "_type": 0,
            "_fogColor": { "__type__": "cc.Color", "r": 200, "g": 200, "b": 200, "a": 255 },
            "_enabled": false, "_fogDensity": 0.3, "_fogStart": 0.5, "_fogEnd": 300,
            "_fogAtten": 5, "_fogTop": 1.5, "_fogRange": 1.2
        });
        this.sceneObj._globals = { "__id__": globalsIdx };
    }

    /** 添加一个节点，返回节点在数组中的索引 */
    _addNode(name, parentIdx, childIndices = [], pos = { x: 0, y: 0, z: 0 }, rot = { x: 0, y: 0, z: 0, w: 1 }, scale = { x: 1, y: 1, z: 1 }, layer = 33554432) {
        const idx = this.objects.length;
        const node = {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "_parent": { "__id__": parentIdx },
            "_children": childIndices.map(i => ({ "__id__": i })),
            "_active": true,
            "_components": [],
            "_prefab": null,
            "_lpos": { "__type__": "cc.Vec3", ...pos },
            "_lrot": { "__type__": "cc.Quat", ...rot },
            "_lscale": { "__type__": "cc.Vec3", ...scale },
            "_layer": layer,
            "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_id": uuid()
        };
        this.objects.push(node);
        // 如果 parent 是 Scene
        if (parentIdx === 1) {
            this.sceneObj._children.push({ "__id__": idx });
        }
        return idx;
    }

    /** 添加组件，返回组件的位置索引 */
    _addComponent(type, nodeIdx, extra = {}) {
        const idx = this.objects.length;
        const comp = {
            "__type__": type,
            "_name": "",
            "_objFlags": 0,
            "node": { "__id__": nodeIdx },
            "_enabled": true,
            "__prefab": null,
            "_id": uuid(),
            ...extra
        };
        this.objects.push(comp);
        this.objects[nodeIdx]._components.push({ "__id__": idx });
        return idx;
    }

    /** 创建 Canvas + UI Camera */
    addCanvas(width = 960, height = 640) {
        // UI Camera 节点（先创建，等下绑到 Canvas）
        const camIdx = this.objects.length;
        // 预分配
        const canvasIdx = camIdx + 3; // cam node + cam component + cam UITransform = +3 后是 canvas node
        // 实际上需要先计算...

        // 创建 Canvas 节点（作为 scene 的 child）
        const canvasNodeIdx = this._addNode("Canvas", 1, [], { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 }, 33554432);
        // UITransform
        this._addComponent("cc.UITransform", canvasNodeIdx, {
            "_contentSize": { "__type__": "cc.Size", "width": width, "height": height },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 }
        });

        // UI Camera 作为 Canvas 子节点
        const uiCamNodeIdx = this.objects.length;
        const uiCamNode = {
            "__type__": "cc.Node",
            "_name": "UICamera",
            "_objFlags": 0,
            "_parent": { "__id__": canvasNodeIdx },
            "_children": [],
            "_active": true,
            "_components": [],
            "_prefab": null,
            "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 1000 },
            "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
            "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
            "_layer": 33554432,
            "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_id": uuid()
        };
        this.objects.push(uiCamNode);
        this.objects[canvasNodeIdx]._children.push({ "__id__": uiCamNodeIdx });

        const uiCamCompIdx = this._addComponent("cc.Camera", uiCamNodeIdx, {
            "_projection": 1, "_priority": 1, "_fov": 45, "_fovAxis": 0,
            "_orthoHeight": height / 2, "_near": 1, "_far": 2000,
            "_color": { "__type__": "cc.Color", "r": 0, "g": 0, "b": 0, "a": 255 },
            "_depth": 1, "_stencil": 0, "_clearFlags": 6,
            "_rect": { "__type__": "cc.Rect", "x": 0, "y": 0, "width": 1, "height": 1 },
            "_visibility": 33554432, "_targetTexture": null
        });

        // Canvas 组件
        this._addComponent("cc.Canvas", canvasNodeIdx, {
            "_cameraComponent": { "__id__": uiCamCompIdx },
            "_alignCanvasWithScreen": true
        });

        return canvasNodeIdx;
    }

    /** 添加 UI 子节点（带 UITransform）*/
    addUINode(name, parentIdx, width, height, pos = { x: 0, y: 0, z: 0 }, anchor = { x: 0.5, y: 0.5 }) {
        const idx = this.objects.length;
        const node = {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "_parent": { "__id__": parentIdx },
            "_children": [],
            "_active": true,
            "_components": [],
            "_prefab": null,
            "_lpos": { "__type__": "cc.Vec3", ...pos, "z": pos.z || 0 },
            "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
            "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
            "_layer": 33554432,
            "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_id": uuid()
        };
        this.objects.push(node);
        // 添加到 parent 的 children
        if (this.objects[parentIdx]._children) {
            this.objects[parentIdx]._children.push({ "__id__": idx });
        }
        // UITransform
        this._addComponent("cc.UITransform", idx, {
            "_contentSize": { "__type__": "cc.Size", "width": width, "height": height },
            "_anchorPoint": { "__type__": "cc.Vec2", ...anchor }
        });
        return idx;
    }

    /** 添加 Sprite 组件（白色占位） */
    addSprite(nodeIdx, color = { r: 255, g: 255, b: 255, a: 255 }) {
        return this._addComponent("cc.Sprite", nodeIdx, {
            "_atlas": null,
            "_spriteFrame": {
                "__uuid__": "5765277e-2c20-4497-94ec-e498def6ea20@f9941",
                "__expectedType__": "cc.SpriteFrame"
            },
            "_type": 0, "_fillType": 0, "_sizeMode": 0, "_fillCenter": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
            "_fillStart": 0, "_fillRange": 0, "_isTrimmedMode": true, "_useGrayscale": false,
            "_color": { "__type__": "cc.Color", ...color }
        });
    }

    /** 添加 Label 组件 */
    addLabel(nodeIdx, text, fontSize = 24, color = { r: 0, g: 0, b: 0, a: 255 }) {
        return this._addComponent("cc.Label", nodeIdx, {
            "_string": text,
            "_horizontalAlign": 1, "_verticalAlign": 1,
            "_actualFontSize": fontSize, "_fontSize": fontSize,
            "_fontFamily": "Arial", "_lineHeight": fontSize + 8,
            "_overflow": 0, "_enableWrapText": true,
            "_useSystemFont": true, "_cacheMode": 0,
            "_color": { "__type__": "cc.Color", ...color }
        });
    }

    /** 添加 Button 组件 */
    addButton(nodeIdx) {
        return this._addComponent("cc.Button", nodeIdx, {
            "_interactable": true,
            "_transition": 2,
            "_normalColor": { "__type__": "cc.Color", "r": 214, "g": 214, "b": 214, "a": 255 },
            "_hoverColor": { "__type__": "cc.Color", "r": 211, "g": 211, "b": 211, "a": 255 },
            "_pressedColor": { "__type__": "cc.Color", "r": 200, "g": 200, "b": 200, "a": 255 },
            "_disabledColor": { "__type__": "cc.Color", "r": 120, "g": 120, "b": 120, "a": 200 },
            "_duration": 0.1, "_zoomScale": 1.1
        });
    }

    /** 添加 ProgressBar 组件 */
    addProgressBar(nodeIdx, barSpriteNodeIdx) {
        return this._addComponent("cc.ProgressBar", nodeIdx, {
            "_barSprite": barSpriteNodeIdx ? { "__id__": barSpriteNodeIdx } : null,
            "_mode": 0, "_totalLength": 100,
            "_progress": 0, "_reverse": false
        });
    }

    /** 添加 UIOpacity 组件 */
    addUIOpacity(nodeIdx, opacity = 255) {
        return this._addComponent("cc.UIOpacity", nodeIdx, { "_opacity": opacity });
    }

    /** 添加 Widget 组件（自适应布局） */
    addWidget(nodeIdx, top = null, bottom = null, left = null, right = null, horizontalCenter = null, verticalCenter = null) {
        const w = {
            "_alignMode": 2, "_target": null,
            "_isAlignTop": top !== null, "_isAlignBottom": bottom !== null,
            "_isAlignLeft": left !== null, "_isAlignRight": right !== null,
            "_isAlignHorizontalCenter": horizontalCenter !== null,
            "_isAlignVerticalCenter": verticalCenter !== null,
            "_top": top || 0, "_bottom": bottom || 0,
            "_left": left || 0, "_right": right || 0,
            "_horizontalCenter": horizontalCenter || 0,
            "_verticalCenter": verticalCenter || 0,
            "_isAbsTop": true, "_isAbsBottom": true,
            "_isAbsLeft": true, "_isAbsRight": true,
            "_isAbsHorizontalCenter": true, "_isAbsVerticalCenter": true
        };
        return this._addComponent("cc.Widget", nodeIdx, w);
    }

    /** 添加自定义脚本组件 */
    addScript(nodeIdx, className) {
        return this._addComponent(className, nodeIdx, {});
    }

    toJSON() {
        return JSON.stringify(this.objects, null, 2);
    }
}

// ─── Loading Scene ──────────────────────────────────────────

function buildLoadingScene() {
    const s = new SceneBuilder('loading');
    const canvas = s.addCanvas(960, 640);

    // Background (全屏深色)
    const bg = s.addUINode('Background', canvas, 960, 640);
    s.addSprite(bg, { r: 30, g: 28, b: 45, a: 255 });
    s.addWidget(bg, 0, 0, 0, 0);

    // LogoContainer (中间偏上)
    const logoContainer = s.addUINode('LogoContainer', canvas, 200, 200, { x: 0, y: 80, z: 0 });

    // Logo (白色方块占位)
    const logo = s.addUINode('Logo', logoContainer, 160, 160);
    s.addSprite(logo, { r: 232, g: 195, b: 115, a: 255 });

    // TitleLabel
    const titleLbl = s.addUINode('TitleLabel', canvas, 300, 50, { x: 0, y: -20, z: 0 });
    s.addLabel(titleLbl, '东家', 36, { r: 232, g: 195, b: 115, a: 255 });

    // ProgressBar 背景
    const progressBg = s.addUINode('ProgressBarBg', canvas, 400, 12, { x: 0, y: -100, z: 0 });
    s.addSprite(progressBg, { r: 60, g: 58, b: 75, a: 255 });

    // ProgressBar 填充
    const progressFill = s.addUINode('ProgressBar', progressBg, 400, 12, { x: 0, y: 0, z: 0 }, { x: 0, y: 0.5 });
    const fillSpriteIdx = s.addSprite(progressFill, { r: 232, g: 195, b: 115, a: 255 });
    s.addProgressBar(progressBg, fillSpriteIdx);

    // TipText
    const tipText = s.addUINode('TipText', canvas, 400, 30, { x: 0, y: -130, z: 0 });
    s.addLabel(tipText, '正在加载资源...', 18, { r: 180, g: 180, b: 180, a: 255 });

    // Mask (淡出用)
    const mask = s.addUINode('Mask', canvas, 960, 640);
    s.addSprite(mask, { r: 0, g: 0, b: 0, a: 255 });
    s.addUIOpacity(mask, 0);
    s.addWidget(mask, 0, 0, 0, 0);

    // 挂载脚本
    s.addScript(canvas, 'LoadingScene');

    return s;
}

// ─── Login Scene ────────────────────────────────────────────

function buildLoginScene() {
    const s = new SceneBuilder('login');
    const canvas = s.addCanvas(960, 640);

    // Background
    const bg = s.addUINode('Background', canvas, 960, 640);
    s.addSprite(bg, { r: 200, g: 220, b: 240, a: 255 });
    s.addWidget(bg, 0, 0, 0, 0);

    // CloudLayer
    const cloudLayer = s.addUINode('CloudLayer', canvas, 960, 200, { x: 0, y: 200, z: 0 });

    // Cloud1
    const cloud1 = s.addUINode('Cloud1', cloudLayer, 200, 80, { x: -200, y: 30, z: 0 });
    s.addSprite(cloud1, { r: 255, g: 255, b: 255, a: 180 });

    // Cloud2
    const cloud2 = s.addUINode('Cloud2', cloudLayer, 280, 100, { x: 150, y: -20, z: 0 });
    s.addSprite(cloud2, { r: 255, g: 255, b: 255, a: 150 });

    // TitleContainer
    const titleContainer = s.addUINode('TitleContainer', canvas, 400, 120, { x: 0, y: 100, z: 0 });
    s.addUIOpacity(titleContainer, 0);

    // TitleLabel
    const titleLbl = s.addUINode('TitleLabel', titleContainer, 400, 80);
    s.addLabel(titleLbl, '东家', 64, { r: 139, g: 90, b: 43, a: 255 });

    // SubtitleLabel
    const subLbl = s.addUINode('SubtitleLabel', titleContainer, 400, 30, { x: 0, y: -50, z: 0 });
    s.addLabel(subLbl, '模拟经营 · 掌柜人生', 20, { r: 100, g: 80, b: 60, a: 200 });

    // LoginBtn
    const loginBtn = s.addUINode('LoginBtn', canvas, 260, 60, { x: 0, y: -80, z: 0 });
    s.addSprite(loginBtn, { r: 139, g: 90, b: 43, a: 255 });
    s.addButton(loginBtn);
    const loginLbl = s.addUINode('Label', loginBtn, 200, 40);
    s.addLabel(loginLbl, '开始经营', 28, { r: 255, g: 240, b: 210, a: 255 });

    // GuestBtn
    const guestBtn = s.addUINode('GuestBtn', canvas, 200, 40, { x: 0, y: -150, z: 0 });
    s.addButton(guestBtn);
    const guestLbl = s.addUINode('Label', guestBtn, 200, 30);
    s.addLabel(guestLbl, '游客体验', 18, { r: 100, g: 100, b: 100, a: 200 });

    // VersionLabel
    const verLbl = s.addUINode('VersionLabel', canvas, 200, 20, { x: 0, y: -280, z: 0 });
    s.addLabel(verLbl, 'v1.0.0', 14, { r: 150, g: 150, b: 150, a: 180 });

    // LoadingMask
    const loadingMask = s.addUINode('LoadingMask', canvas, 960, 640);
    s.addSprite(loadingMask, { r: 0, g: 0, b: 0, a: 255 });
    s.addUIOpacity(loadingMask, 0);
    s.addWidget(loadingMask, 0, 0, 0, 0);
    loadingMask; // inactive by default - handled in script

    // 挂载脚本
    s.addScript(canvas, 'LoginScene');

    return s;
}

// ─── Main Scene (带完整 UI 层级) ────────────────────────────

function buildMainScene() {
    const s = new SceneBuilder('main');
    const canvas = s.addCanvas(960, 640);

    // Background
    const bg = s.addUINode('Background', canvas, 960, 640);
    s.addSprite(bg, { r: 232, g: 213, b: 181, a: 255 });
    s.addWidget(bg, 0, 0, 0, 0);

    // ContentContainer (主内容区)
    const content = s.addUINode('ContentContainer', canvas, 960, 420, { x: 0, y: 10, z: 0 });

    // TopBar (高120)
    const topBar = s.addUINode('TopBar', canvas, 960, 120, { x: 0, y: 260, z: 0 });
    s.addSprite(topBar, { r: 139, g: 90, b: 43, a: 230 });
    s.addWidget(topBar, 0, null, 0, 0);

    // AvatarBtn
    const avatarBtn = s.addUINode('AvatarBtn', topBar, 80, 80, { x: -400, y: 0, z: 0 });
    s.addSprite(avatarBtn, { r: 200, g: 180, b: 150, a: 255 });
    s.addButton(avatarBtn);

    // InfoContainer
    const infoContainer = s.addUINode('InfoContainer', topBar, 200, 80, { x: -260, y: 0, z: 0 });
    const nickLbl = s.addUINode('NicknameLabel', infoContainer, 180, 30, { x: 0, y: 15, z: 0 });
    s.addLabel(nickLbl, '掌柜', 22, { r: 255, g: 240, b: 210, a: 255 });
    const lvlLbl = s.addUINode('LevelLabel', infoContainer, 100, 24, { x: 0, y: -15, z: 0 });
    s.addLabel(lvlLbl, 'Lv.1', 16, { r: 255, g: 220, b: 150, a: 200 });

    // CurrencyContainer
    const currContainer = s.addUINode('CurrencyContainer', topBar, 300, 60, { x: 120, y: 0, z: 0 });
    const copperIcon = s.addUINode('CopperIcon', currContainer, 28, 28, { x: -100, y: 0, z: 0 });
    s.addSprite(copperIcon, { r: 218, g: 165, b: 32, a: 255 });
    const copperLbl = s.addUINode('CopperLabel', currContainer, 80, 28, { x: -40, y: 0, z: 0 });
    s.addLabel(copperLbl, '0', 20, { r: 255, g: 240, b: 210, a: 255 });
    const silverIcon = s.addUINode('SilverIcon', currContainer, 28, 28, { x: 40, y: 0, z: 0 });
    s.addSprite(silverIcon, { r: 192, g: 192, b: 192, a: 255 });
    const silverLbl = s.addUINode('SilverLabel', currContainer, 80, 28, { x: 100, y: 0, z: 0 });
    s.addLabel(silverLbl, '0', 20, { r: 255, g: 240, b: 210, a: 255 });

    // SettingsBtn
    const settingsBtn = s.addUINode('SettingsBtn', topBar, 50, 50, { x: 430, y: 0, z: 0 });
    s.addSprite(settingsBtn, { r: 200, g: 180, b: 150, a: 200 });
    s.addButton(settingsBtn);
    const settingsLbl = s.addUINode('Label', settingsBtn, 40, 30);
    s.addLabel(settingsLbl, '⚙', 24, { r: 80, g: 60, b: 40, a: 255 });

    // BottomBar (高100)
    const bottomBar = s.addUINode('BottomBar', canvas, 960, 100, { x: 0, y: -270, z: 0 });
    s.addSprite(bottomBar, { r: 255, g: 248, b: 235, a: 240 });
    s.addWidget(bottomBar, null, 0, 0, 0);

    // 5 个 Tab
    const tabNames = ['首页', '商铺', '消息', '联盟', '我的'];
    const tabXPositions = [-192, -96, 0, 96, 192];
    for (let i = 0; i < 5; i++) {
        const tab = s.addUINode(`${['Home', 'Shop', 'Message', 'Guild', 'Mine'][i]}Tab`, bottomBar, 80, 80, { x: tabXPositions[i], y: 0, z: 0 });
        const tabIcon = s.addUINode('Icon', tab, 36, 36, { x: 0, y: 10, z: 0 });
        s.addSprite(tabIcon, { r: i === 0 ? 139 : 150, g: i === 0 ? 90 : 150, b: i === 0 ? 43 : 150, a: 255 });
        const tabLbl = s.addUINode('Label', tab, 80, 20, { x: 0, y: -20, z: 0 });
        s.addLabel(tabLbl, tabNames[i], 14, { r: i === 0 ? 139 : 150, g: i === 0 ? 90 : 150, b: i === 0 ? 43 : 150, a: 255 });
    }

    // PopupLayer
    const popupLayer = s.addUINode('PopupLayer', canvas, 960, 640);
    s.addWidget(popupLayer, 0, 0, 0, 0);

    // 挂载脚本
    s.addScript(canvas, 'MainScene');

    return s;
}

// ─── OrderCard Prefab ───────────────────────────────────────

function buildOrderCardPrefab() {
    const objects = [];

    function addObj(obj) {
        const idx = objects.length;
        objects.push(obj);
        return idx;
    }

    // Prefab root node
    const rootIdx = addObj({
        "__type__": "cc.Node",
        "_name": "OrderCard",
        "_objFlags": 0,
        "_parent": null,
        "_children": [],
        "_active": true,
        "_components": [],
        "_prefab": null,
        "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
        "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
        "_layer": 33554432,
        "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_id": uuid()
    });

    // UITransform
    addObj({
        "__type__": "cc.UITransform",
        "_name": "", "_objFlags": 0,
        "node": { "__id__": rootIdx },
        "_enabled": true, "__prefab": null,
        "_contentSize": { "__type__": "cc.Size", "width": 280, "height": 140 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
        "_id": uuid()
    });
    objects[rootIdx]._components.push({ "__id__": 1 });

    // Background sprite
    addObj({
        "__type__": "cc.Sprite",
        "_name": "", "_objFlags": 0,
        "node": { "__id__": rootIdx },
        "_enabled": true, "__prefab": null,
        "_atlas": null,
        "_spriteFrame": { "__uuid__": "5765277e-2c20-4497-94ec-e498def6ea20@f9941", "__expectedType__": "cc.SpriteFrame" },
        "_type": 0, "_fillType": 0, "_sizeMode": 0,
        "_color": { "__type__": "cc.Color", "r": 255, "g": 250, "b": 240, "a": 255 },
        "_id": uuid()
    });
    objects[rootIdx]._components.push({ "__id__": 2 });

    // 简化的子节点结构
    const childNames = [
        { name: "NameLabel", w: 200, h: 30, y: 40, text: "菜名" },
        { name: "DifficultyLabel", w: 100, h: 20, y: 15, text: "★" },
        { name: "RewardLabel", w: 150, h: 22, y: -10, text: "奖励: 0" },
        { name: "TimeLabel", w: 120, h: 20, y: -35, text: "剩余: 0s" },
    ];

    for (const child of childNames) {
        const childIdx = addObj({
            "__type__": "cc.Node",
            "_name": child.name,
            "_objFlags": 0,
            "_parent": { "__id__": rootIdx },
            "_children": [],
            "_active": true,
            "_components": [],
            "_prefab": null,
            "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": child.y, "z": 0 },
            "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
            "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
            "_layer": 33554432,
            "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_id": uuid()
        });
        objects[rootIdx]._children.push({ "__id__": childIdx });

        // UITransform
        const utIdx = addObj({
            "__type__": "cc.UITransform",
            "_name": "", "_objFlags": 0,
            "node": { "__id__": childIdx },
            "_enabled": true, "__prefab": null,
            "_contentSize": { "__type__": "cc.Size", "width": child.w, "height": child.h },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_id": uuid()
        });
        objects[childIdx]._components.push({ "__id__": utIdx });

        // Label
        const lblIdx = addObj({
            "__type__": "cc.Label",
            "_name": "", "_objFlags": 0,
            "node": { "__id__": childIdx },
            "_enabled": true, "__prefab": null,
            "_string": child.text,
            "_horizontalAlign": 1, "_verticalAlign": 1,
            "_actualFontSize": 18, "_fontSize": 18,
            "_fontFamily": "Arial", "_lineHeight": 24,
            "_overflow": 0, "_enableWrapText": false,
            "_useSystemFont": true,
            "_color": { "__type__": "cc.Color", "r": 60, "g": 40, "b": 20, "a": 255 },
            "_id": uuid()
        });
        objects[childIdx]._components.push({ "__id__": lblIdx });
    }

    // ProgressBar 节点
    const pbNodeIdx = addObj({
        "__type__": "cc.Node",
        "_name": "ProgressBar",
        "_objFlags": 0,
        "_parent": { "__id__": rootIdx },
        "_children": [],
        "_active": true,
        "_components": [],
        "_prefab": null,
        "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": -55, "z": 0 },
        "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
        "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
        "_layer": 33554432,
        "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_id": uuid()
    });
    objects[rootIdx]._children.push({ "__id__": pbNodeIdx });

    addObj({
        "__type__": "cc.UITransform",
        "_name": "", "_objFlags": 0,
        "node": { "__id__": pbNodeIdx },
        "_enabled": true, "__prefab": null,
        "_contentSize": { "__type__": "cc.Size", "width": 240, "height": 8 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
        "_id": uuid()
    });
    objects[pbNodeIdx]._components.push({ "__id__": objects.length - 1 });

    // TakeBtn
    const btnIdx = addObj({
        "__type__": "cc.Node",
        "_name": "TakeBtn",
        "_objFlags": 0,
        "_parent": { "__id__": rootIdx },
        "_children": [],
        "_active": true,
        "_components": [],
        "_prefab": null,
        "_lpos": { "__type__": "cc.Vec3", "x": 100, "y": -55, "z": 0 },
        "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
        "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
        "_layer": 33554432,
        "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_id": uuid()
    });
    objects[rootIdx]._children.push({ "__id__": btnIdx });

    addObj({
        "__type__": "cc.UITransform",
        "_name": "", "_objFlags": 0,
        "node": { "__id__": btnIdx },
        "_enabled": true, "__prefab": null,
        "_contentSize": { "__type__": "cc.Size", "width": 80, "height": 36 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
        "_id": uuid()
    });
    objects[btnIdx]._components.push({ "__id__": objects.length - 1 });

    return JSON.stringify(objects, null, 2);
}

// ─── NPCCard Prefab ─────────────────────────────────────────

function buildNPCCardPrefab() {
    const objects = [];
    function addObj(obj) { const i = objects.length; objects.push(obj); return i; }

    const rootIdx = addObj({
        "__type__": "cc.Node", "_name": "NPCCard", "_objFlags": 0,
        "_parent": null, "_children": [], "_active": true, "_components": [],
        "_prefab": null,
        "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
        "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
        "_layer": 33554432,
        "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_id": uuid()
    });

    // UITransform for root
    const utIdx = addObj({
        "__type__": "cc.UITransform", "_name": "", "_objFlags": 0,
        "node": { "__id__": rootIdx }, "_enabled": true, "__prefab": null,
        "_contentSize": { "__type__": "cc.Size", "width": 180, "height": 220 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
        "_id": uuid()
    });
    objects[rootIdx]._components.push({ "__id__": utIdx });

    // Background
    addObj({
        "__type__": "cc.Sprite", "_name": "", "_objFlags": 0,
        "node": { "__id__": rootIdx }, "_enabled": true, "__prefab": null,
        "_atlas": null,
        "_spriteFrame": { "__uuid__": "5765277e-2c20-4497-94ec-e498def6ea20@f9941", "__expectedType__": "cc.SpriteFrame" },
        "_type": 0, "_fillType": 0, "_sizeMode": 0,
        "_color": { "__type__": "cc.Color", "r": 250, "g": 245, "b": 235, "a": 255 },
        "_id": uuid()
    });
    objects[rootIdx]._components.push({ "__id__": objects.length - 1 });

    // 子节点
    const childDefs = [
        { name: "AvatarFrame", w: 80, h: 80, y: 50, isSprite: true, color: { r: 200, g: 180, b: 150, a: 255 } },
        { name: "Avatar", w: 70, h: 70, y: 50, isSprite: true, color: { r: 180, g: 180, b: 180, a: 255 } },
        { name: "NameLabel", w: 150, h: 24, y: -10, isLabel: true, text: "NPC" },
        { name: "RedDot", w: 16, h: 16, y: 50, x: 35, isSprite: true, color: { r: 230, g: 50, b: 50, a: 255 }, active: false },
    ];

    for (const def of childDefs) {
        const cIdx = addObj({
            "__type__": "cc.Node", "_name": def.name, "_objFlags": 0,
            "_parent": { "__id__": rootIdx }, "_children": [], "_active": def.active !== false, "_components": [],
            "_prefab": null,
            "_lpos": { "__type__": "cc.Vec3", "x": def.x || 0, "y": def.y, "z": 0 },
            "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
            "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
            "_layer": 33554432,
            "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_id": uuid()
        });
        objects[rootIdx]._children.push({ "__id__": cIdx });

        // UITransform
        const utI = addObj({
            "__type__": "cc.UITransform", "_name": "", "_objFlags": 0,
            "node": { "__id__": cIdx }, "_enabled": true, "__prefab": null,
            "_contentSize": { "__type__": "cc.Size", "width": def.w, "height": def.h },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_id": uuid()
        });
        objects[cIdx]._components.push({ "__id__": utI });

        if (def.isSprite) {
            const sI = addObj({
                "__type__": "cc.Sprite", "_name": "", "_objFlags": 0,
                "node": { "__id__": cIdx }, "_enabled": true, "__prefab": null,
                "_atlas": null,
                "_spriteFrame": { "__uuid__": "5765277e-2c20-4497-94ec-e498def6ea20@f9941", "__expectedType__": "cc.SpriteFrame" },
                "_type": 0, "_fillType": 0, "_sizeMode": 0,
                "_color": { "__type__": "cc.Color", ...def.color },
                "_id": uuid()
            });
            objects[cIdx]._components.push({ "__id__": sI });
        }

        if (def.isLabel) {
            const lI = addObj({
                "__type__": "cc.Label", "_name": "", "_objFlags": 0,
                "node": { "__id__": cIdx }, "_enabled": true, "__prefab": null,
                "_string": def.text, "_horizontalAlign": 1, "_verticalAlign": 1,
                "_actualFontSize": 18, "_fontSize": 18,
                "_fontFamily": "Arial", "_lineHeight": 24,
                "_overflow": 0, "_enableWrapText": false, "_useSystemFont": true,
                "_color": { "__type__": "cc.Color", "r": 60, "g": 40, "b": 20, "a": 255 },
                "_id": uuid()
            });
            objects[cIdx]._components.push({ "__id__": lI });
        }
    }

    // FavorBar
    const favBg = addObj({
        "__type__": "cc.Node", "_name": "FavorBar", "_objFlags": 0,
        "_parent": { "__id__": rootIdx }, "_children": [], "_active": true, "_components": [],
        "_prefab": null,
        "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": -40, "z": 0 },
        "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
        "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
        "_layer": 33554432,
        "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_id": uuid()
    });
    objects[rootIdx]._children.push({ "__id__": favBg });

    addObj({
        "__type__": "cc.UITransform", "_name": "", "_objFlags": 0,
        "node": { "__id__": favBg }, "_enabled": true, "__prefab": null,
        "_contentSize": { "__type__": "cc.Size", "width": 140, "height": 8 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
        "_id": uuid()
    });
    objects[favBg]._components.push({ "__id__": objects.length - 1 });

    // StatusIcon
    const statusIcon = addObj({
        "__type__": "cc.Node", "_name": "StatusIcon", "_objFlags": 0,
        "_parent": { "__id__": rootIdx }, "_children": [], "_active": true, "_components": [],
        "_prefab": null,
        "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": -70, "z": 0 },
        "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
        "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
        "_layer": 33554432,
        "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_id": uuid()
    });
    objects[rootIdx]._children.push({ "__id__": statusIcon });

    return JSON.stringify(objects, null, 2);
}

// ─── 生成文件 ────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');

function write(relPath, content) {
    const fullPath = path.join(PROJECT_ROOT, relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ ${relPath}`);
}

console.log('🔨 开始生成 DongJia 场景和预制体...\n');

// Scenes
write('assets/scenes/loading.scene', buildLoadingScene().toJSON());
write('assets/scenes/login.scene', buildLoginScene().toJSON());
write('assets/scenes/main.scene', buildMainScene().toJSON());

// Prefabs
write('assets/prefabs/ui/OrderCard.prefab', buildOrderCardPrefab());
write('assets/prefabs/ui/NPCCard.prefab', buildNPCCardPrefab());

console.log('\n✨ 全部生成完毕！请在 Cocos Creator 编辑器中刷新资产并绑定 @property 引用。');
console.log('提示：打开场景文件后，在 Inspector 中将脚本组件的 @property 拖拽绑定到对应节点。');
