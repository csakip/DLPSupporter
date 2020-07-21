'use strict';
import Support from './src/DSSupport.js';
import DSCameraControls from './src/DSCameraControls.js';
import DSSupport from './src/DSSupport.js';
import DSPreset from './src/DSPreset.js';

const bedSize = new THREE.Vector2(115, 65);

export default class app3d {
    constructor() {
        this.sidePanelWidth = 400;
        this.minHeight = 3;
        this.minHeightMesh = null;
        this.presets = [];
        this.selectedPreset = {};
        this.supports = [];
        this.raycastGroup = new THREE.Group();
        this.hiddenGroup = new THREE.Group();
        this.raycastGroupHiding = new THREE.Group();
        this.raycaster = new THREE.Raycaster();
        this.mouseMovePosition = new THREE.Vector2();
        this.mouse = new THREE.Vector2();
        this.supportDragData = null;
        this.worldNormal = new THREE.Vector3();
        this.linePoints = [];
        this.colorRed = new THREE.Color(1.0, 0.2, 0.2);
        this.colorGreen = new THREE.Color(0.4, 1, 0.4);
        this.downVector = new THREE.Vector3(0, 0, 1);

        this.init();
        this.render();
    }

    init() {
        this.container = document.getElementById('container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth - this.sidePanelWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0.4, 0.4, 0.4);
        this.scene.add(this.raycastGroup);
        this.scene.add(this.hiddenGroup);
        this.scene.add(this.raycastGroupHiding);

        this.cameraControls = new DSCameraControls(this.scene, this.orbitControls, this.sidePanelWidth, this.render.bind(this));
        this.setupLights(this.cameraControls.camera, this.scene, this.sidePanelWidth);
        this.setupMouseRealCoordsHelper();
        this.setupControls();
        this.makeMaterials();
        this.setupBuildplate();
        this.setupLine();
        this.setupSupports();

        this.groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        this.groundPlane.rotateX(Math.PI / -2);
        this.scene.add(this.groundPlane);
        this.groundPlane.visible = false;

        this.setupEvents();
        this.setupHotkeys();

        this.loadStl('./single.stl', this.meshMaterial);
        // this.loadStl('./trimmer.stl', this.meshMaterial);
        this.orbitControls.update();
    }

    setupSupports() {
        this.presets = [
            new DSPreset("Heavy", 1.1, 3, 0.5, 6),
            this.selectedPreset = new DSPreset("Medium", 0.8, 3, 0.3, 6),
            new DSPreset("Light", 0.5, 2, 0.2, 5)
        ];
        Support.init(this.scene, this.supportMaterial, this.supportMaterialSelected, this.raycastGroup, this.raycastGroupHiding);
    }

    deepCopyFunction(inObject) {
        let outObject, value, key

        if (typeof inObject !== "object" || inObject === null) {
            return inObject // Return the value if inObject is not an object
        }

        // Create an array or object to hold the values
        outObject = Array.isArray(inObject) ? [] : {}

        for (key in inObject) {
            value = inObject[key]

            // Recursively (deep) copy for nested objects, including arrays
            outObject[key] = this.deepCopyFunction(value)
        }

        return outObject
    }

    setupHotkeys() {
        hotkeys('*', (event, handler) => {
            // console.log(event.key)
            switch (event.key) {
                case 'v': this.toggleMeshVisibility(); break;
                case 'h': this.cameraControls.homeCamera(); break;
                case 'ArrowUp': this.moveSelectedSupport(0, event.shiftKey ? -0.1 : -0.5); break;
                case 'ArrowDown': this.moveSelectedSupport(0, event.shiftKey ? 0.1 : 0.5); break;
                case 'ArrowLeft': this.moveSelectedSupport(event.shiftKey ? -0.1 : -0.5, 0); break;
                case 'ArrowRight': this.moveSelectedSupport(event.shiftKey ? 0.1 : 0.5, 0); break;
                case '+':
                case '=': { event.preventDefault(); this.adjustSelectedSupportDiameter(1.1, event.shiftKey, !event.ctrlKey); break; }
                case '-': { event.preventDefault(); this.adjustSelectedSupportDiameter(0.9, event.shiftKey, !event.ctrlKey); break; }
                // case 't': this.setTipEndSpheres(true); break;
                // case 'T': this.setTipEndSpheres(false); break;
            }
        });
    }

    setActivePanel(panelName) {
        this.activePanel = panelName;
        this.minHeightMesh.visible = this.activePanel === 'open';
        this.deselectAllSupports();
        if (this.activePanel !== 'support') {
            this.line.visible = false;
            if (this.materialShader) this.materialShader.uniforms.cursorHeight.value = -1000;
        }
        this.render();
    }

    setupEvents() {
        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
        this.container.addEventListener('mouseup', (e) => this.onMouseUp(e), false);

        window.onresize = () => {
            this.cameraControls.camera.aspect = (window.innerWidth - this.sidePanelWidth) / window.innerHeight;
            this.cameraControls.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth - this.sidePanelWidth, window.innerHeight);
            this.lineMaterial.resolution.set(window.innerWidth - this.sidePanelWidth, window.innerHeight);
            this.render();
        };
    }

    setTransformControlMode(newMode) {
        if (newMode) {
            if (this.transformControl) {
                this.transformControl.setMode(newMode);
            } else {
                this.createTransformControl(newMode);
            }
        } else {
            if (this.transformControl) {
                this.transformControl.detach();
                this.transformControl.dispose();
                this.transformControl = undefined;
            }
        }
        this.render();
    }

    setupControls() {
        this.orbitControls = new THREE.OrbitControls(this.cameraControls.camera, this.renderer.domElement, this.mouseRealCoordsHelper, this.raycaster);
        this.orbitControls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };
        this.orbitControls.screenSpacePanning = true;
        this.orbitControls.enableKeys = false;
        this.orbitControls.minDistance = 1;
        this.orbitControls.maxDistance = 200;
        this.orbitControls.zoomSpeed = 2;
        this.orbitControls.target.copy(this.cameraControls.cameraHomeLookat);

        // Hide supports on low camera position
        this.orbitControls.addEventListener('change', () => {
            var angle = new THREE.Vector3(this.cameraControls.camera.matrix.elements[8], this.cameraControls.camera.matrix.elements[9], this.cameraControls.camera.matrix.elements[10]).angleTo(this.downVector)
            if (angle <= Math.PI / 4 && this.raycastGroupHiding.visible) {
                this.raycastGroupHiding.visible = false;
            }
            if (angle > Math.PI / 4 && !this.raycastGroupHiding.visible) {
                this.raycastGroupHiding.visible = true;
            }
            this.render();
            this.orbitControlMoved = true;
        });

        this.cameraControls.orbitControls = this.orbitControls;
    }

    createTransformControl(mode) {
        if (this.mesh) {
            this.transformControl = new THREE.TransformControls(this.cameraControls.camera, this.renderer.domElement);
            this.transformControl.addEventListener('change', () => {
                this.render()
            });
            this.transformControl.addEventListener('objectChange', () => {
                if (this.mesh) {
                    // this.normalHelper.update();
                    this.moveMeshToMinHeight();
                    if (this.layFlatSideSelectorMesh) {
                        this.layFlatSideSelectorMesh.rotation.copy(this.mesh.rotation);
                        this.layFlatSideSelectorMesh.position.copy(this.mesh.position);
                        this.layFlatSideSelectorMesh.scale.copy(this.mesh.scale);
                    }
                    if (this.transformControl.mode === 'translate') {
                        const offset = this.positionForTransform.sub(this.mesh.position).negate();
                        if (offset.length() > 0) {
                            this.supports.forEach(s => s.move(offset));
                        }
                        this.positionForTransform.copy(this.mesh.position);
                        this.render();
                    }
                }
            });
            this.transformControl.setMode(mode);
            this.transformControl.setSize(1.5);

            this.transformControl.addEventListener('dragging-changed', (event) => {
                this.orbitControls.enabled = !event.value;
            });

            this.transformControl.attach(this.mesh);
            this.scene.add(this.transformControl);

        }
    }

    render() {
        this.renderer.render(this.scene, this.cameraControls.camera);
    }

    onMouseDown(evt) {
        if (this.activePanel == 'open') {
            if (this.transformControl) {
                this.positionForTransform = this.mesh.position.clone();
            }
        } else if (this.activePanel == 'support' && evt.buttons == 1 && this.mesh) {

            this.mouseMovePosition.fromArray(this.getMousePosition(this.container, evt.clientX, evt.clientY));
            var intersects = this.raycastGroupHiding.visible ?
                this.getIntersects(this.mouseMovePosition, [...this.raycastGroup.children, ...this.raycastGroupHiding.children]) :
                this.getIntersects(this.mouseMovePosition, [...this.raycastGroup.children]);

            if (intersects.length > 0) {
                this.orbitControls.enabled = false;
                if (intersects[0].object == this.mesh) {
                    this.worldNormal = this.mesh.localToWorld(intersects[0].face.normal);
                    this.worldNormal.addScaledVector(this.mesh.position, -1);
                    if (intersects[0].point.y >= 1.5) {
                        const p = this.selectedPreset;
                        if (evt.ctrlKey) {
                            const selectedSupports = this.supports.filter(s => s.selected);
                            if (selectedSupports.length > 0) {
                                selectedSupports.forEach(s => s.addTip(intersects[0].point, this.worldNormal, p.tipDiameter, p.tipLength, true));
                            } else if (this.supports.length > 0) {
                                this.supports[this.supports.length - 1].addTip(intersects[0].point, this.worldNormal, p.tipDiameter, p.tipLength, false);
                            }
                        } else {
                            const s = new Support(intersects[0].point, this.worldNormal, p.name, p.shaftDiameter, p.tipLength, p.tipDiameter, 0, p.bottomDiameter);
                            this.supports.push(s);
                            this.newSupport = s;
                        }
                        this.render();
                    }
                } else {
                    const s = intersects[0].object.userData.support;
                    this.groundPlane.position.copy(intersects[0].point);
                    this.groundPlane.rotation.set(Math.PI / -2, 0, 0);
                    if (intersects[0].object.userData.supportType[0] === 't') {  // tip or tip end
                        this.supportDragData = {
                            support: s,
                            head: intersects[0].object.userData.head,
                            tip: true
                        }
                    } else if (intersects[0].object.userData.supportType !== 'sh') {    // Shaft or base
                        // Reset plane rotation to be ground parallel
                        this.render();
                        var intersects = this.getIntersectPlane(this.mouseMovePosition);
                        if (intersects) {
                            this.supportDragData = {
                                xz: true,
                                x: intersects.x,
                                z: intersects.z,
                                support: s
                            };
                        }
                    } else { // Height handle spehere
                        // Rotate plane to face camera and vertical
                        const lookAtPoint = new THREE.Vector3(this.cameraControls.camera.position.x, intersects[0].point.y, this.cameraControls.camera.position.z);
                        this.groundPlane.lookAt(lookAtPoint);
                        this.render();
                        let head = intersects[0].object.userData.head;
                        // Use the selected tip if multiple height handles are under the cursor
                        if (!head.selected) {
                            const selectedTipIntersect = intersects.find(i => i.object.userData && i.object.userData.supportType === 'sh' && i.object.userData.support && !i.object.userData.support.selected && i.object.userData.head.selected);
                            if (selectedTipIntersect) {
                                head = selectedTipIntersect.object.userData.head;
                            }
                        }
                        var intersects = this.getIntersectPlane(this.mouseMovePosition);
                        if (intersects) {
                            if (!s.selected) {
                                head.supportHeightHandle.visible = true;
                            }
                            this.supportDragData = {
                                xz: false,
                                y: intersects.y,
                                support: s,
                                head: head
                            };
                        }
                    }
                }
            }
        }
    }

    onMouseMove(evt) {
        if (this.mesh) {
            this.mouseMovePosition.fromArray(this.getMousePosition(this.container, evt.clientX, evt.clientY));

            if (this.layFlatCircle) {
                // The bottom facing part selection.
                if (this.layFlatSideSelectorMesh) {
                    // The wrapper mesh
                    var intersects = this.getIntersects(this.mouseMovePosition, [this.layFlatSideSelectorMesh]);
                    if (intersects.length > 0) {
                        this.worldNormal.copy(intersects[0].object.localToWorld(intersects[0].face.normal.clone()));
                        this.drawNormalLineAndHeightBand(intersects[0].point, this.worldNormal, false);
                        this.meshLayFlatMaterialShader.uniforms.highlightNormal = new THREE.Uniform(intersects[0].face.normal);
                        this.layFlatWorldVector = this.worldNormal.clone();
                    } else {
                        this.line.visible = false;
                        this.meshLayFlatMaterialShader.uniforms.highlightNormal = new THREE.Uniform(this.downVector);
                        this.layFlatWorldVector = null;
                    }
                } else {
                    // The mesh
                    var intersects = this.getIntersects(this.mouseMovePosition, [this.mesh]);
                    if (intersects.length > 0) {
                        this.layFlatCircle.position.copy(intersects[0].point);
                        this.worldNormal.copy(intersects[0].object.localToWorld(intersects[0].face.normal.clone()));
                        const n = this.worldNormal.clone().addScaledVector(intersects[0].object.position, -1);
                        const p2 = intersects[0].point.clone().add(n);
                        this.layFlatCircle.lookAt(p2);
                        this.layFlatCircle.translateZ(0.01);
                        this.layFlatCircle.visible = true;
                        this.drawNormalLineAndHeightBand(intersects[0].point, this.worldNormal, true);
                        this.layFlatWorldVector = this.worldNormal.clone();
                    } else {
                        this.layFlatCircle.visible = false;
                        this.line.visible = false;
                        this.materialShader.uniforms.cursorHeight.value = -1000;
                        this.layFlatWorldVector = null;
                    }
                }
                this.render();
            } else if (this.newSupport) {
                // Dragging the newly created support
                var intersects = this.getIntersects(this.mouseMovePosition, [this.mesh]);
                if (intersects.length > 0 && intersects[0].object == this.mesh) {
                    this.line.visible = false;
                    this.worldNormal.copy(this.mesh.localToWorld(intersects[0].face.normal));
                    this.worldNormal.addScaledVector(this.mesh.position, -1);
                    this.newSupport.moveToNewPosition(intersects[0].point, this.worldNormal, this.selectedPreset.tipLength);
                    this.drawShaderHeightLine(intersects[0].point.y)
                    this.render();
                }
            } else if (this.supportDragData) {
                if (this.supportDragData.tip) {
                    // Dragging a tip
                    var intersects = this.getIntersects(this.mouseMovePosition, [this.mesh]);
                    if (intersects.length > 0) {
                        this.worldNormal.copy(this.mesh.localToWorld(intersects[0].face.normal));
                        this.supportDragData.head.moveTipTo(intersects[0].point, this.worldNormal);
                        this.drawNormalLineAndHeightBand(intersects[0].point, this.worldNormal);
                        this.supportDragData.moved = true;
                        this.render();
                    }
                } else {
                    var intersects = this.getIntersectPlane(this.mouseMovePosition);
                    if (intersects) {
                        if (this.supportDragData.xz) {
                            // Moving a support x z
                            const diffX = intersects.x - this.supportDragData.x;
                            const diffZ = intersects.z - this.supportDragData.z;
                            if (diffX != 0 || diffZ != 0) {
                                if (this.supportDragData.support.selected) {
                                    this.supports.filter(s => s.selected && s !== this.supportDragData.support).forEach(s => {
                                        s.moveJointPosition(diffX, diffZ);
                                    });
                                }
                                this.supportDragData.support.moveJointPosition(diffX, diffZ);
                                this.supportDragData.x = intersects.x;
                                this.supportDragData.z = intersects.z;
                                this.supportDragData.moved = true;
                                this.render();
                            }
                        } else {
                            // Moving a height handle
                            const diffY = intersects.y - this.supportDragData.y;
                            if (diffY != 0) {
                                this.supportDragData.head.supportHeightHandle.visible = true;;
                                this.supportDragData.head.moveBaseHeight(diffY);
                                this.supportDragData.y = intersects.y;
                                this.supportDragData.moved = true;
                                this.render();
                            }
                        }
                    }
                }
            } else {
                var intersects = this.raycastGroupHiding.visible ?
                    this.getIntersects(this.mouseMovePosition, [...this.raycastGroup.children, ...this.raycastGroupHiding.children]) :
                    this.getIntersects(this.mouseMovePosition, [...this.raycastGroup.children]);

                if (intersects.length > 0 && intersects[0].object == this.mesh) {
                    if (this.activePanel == 'support') {
                        this.drawNormalLineAndHeightBand(intersects[0].point, this.mesh.localToWorld(intersects[0].face.normal));
                    }
                    this.render();
                } else {
                    // Remove line when not touching model
                    if (this.line.visible) {
                        this.line.visible = false;
                        if (this.materialShader) this.materialShader.uniforms.cursorHeight.value = -1000;
                        this.render();
                    }
                }
            }
        }
    }

    onMouseUp(evt) {
        this.orbitControls.enabled = true;
        this.newSupport = null;

        if (this.layFlatCircle && this.layFlatWorldVector) {
            this.tls(this.layFlatWorldVector.x, this.layFlatWorldVector.y, this.layFlatWorldVector.z)
            this.mesh.lookAt(this.layFlatWorldVector);
            this.mesh.rotateX(-Math.PI / 2);
            if (this.layFlatSideSelectorMesh) {
                this.layFlatSideSelectorMesh.lookAt(this.layFlatWorldVector);
                this.layFlatSideSelectorMesh.rotateX(-Math.PI / 2);
            }
            this.layFlatWorldVector = null;
            this.moveMeshToMinHeight();
            this.render();
        } else if (this.supportDragData && !this.supportDragData.moved) {
            if (this.supportDragData.support.selected) {
                if (this.supportDragData.tip) {
                    this.supports.forEach(s => s.deselect());
                    this.supportDragData.head.select();
                } else {
                    this.supports.filter(s => !s.selected).forEach(s => s.deselectTips());
                    if (!evt.ctrlKey) {
                        this.supports.filter(s => (s.selected && s.id != this.supportDragData.support.id)).forEach(s => s.deselect());
                    } else {
                        this.supportDragData.support.deselect();
                    }
                }
            } else {
                const selectedSupports = this.supports.filter(s => s.selected);
                if (selectedSupports.length === 0 && this.supportDragData.tip && evt.ctrlKey) {
                    this.supportDragData.head.toggleSelected();
                } else {
                    this.supports.filter(s => !s.selected).forEach(s => s.deselectTips());

                    if (!evt.ctrlKey) {
                        this.supports.filter(s => s.selected).forEach(s => s.deselect());
                    }
                    this.supportDragData.support.select();
                }
            }
            this.render();
            window.data.go('selectedSupport');
        } else if (!this.orbitControlMoved && (!this.supportDragData || !this.supportDragData.moved)) {
            if (!evt.ctrlKey) {
                this.supports.forEach(s => s.deselect());
                this.render();
                window.data.go('selectedSupport');
            }
        } else if (this.supportDragData && this.supportDragData.moved && this.supportDragData.head) {
            if (!this.supportDragData.head.selected) {
                this.supportDragData.head.supportHeightHandle.visible = false;
                this.render();
            }
            window.data.go('selectedSupport');
        }

        this.orbitControlMoved = false;
        this.supportDragData = null;
        this.positionForTransform = null;
    }

    drawNormalLineAndHeightBand(point, normal, line = true) {
        if (!this.line.visible) this.line.visible = true;
        this.linePoints.length = 0;
        this.linePoints.push(point.x, point.y, point.z);
        const n = normal.clone().addScaledVector(this.mesh.position, -1);
        const p2 = point.clone().addScaledVector(n, 2);
        this.linePoints.push(p2.x, p2.y, p2.z);
        this.line.geometry.setPositions(this.linePoints);
        this.line.geometry.verticesNeedUpdate = true;
        this.lineMaterial.color.copy(n.y <= 0 && point.y >= 1.5 ? this.colorGreen : this.colorRed);
        if (line) this.drawShaderHeightLine(point.y);
    }

    tls(...myNumb) {
        console.log(myNumb.map(element => element.toLocaleString('fullwide', { useGrouping: false })));
    }

    // Send the cursor's height to the material shader
    drawShaderHeightLine(y) {
        if (this.materialShader) this.materialShader.uniforms.cursorHeight.value = y;
    }

    // Mouse screen X Y positions
    getMousePosition(dom, x, y) {
        var rect = dom.getBoundingClientRect();
        return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
    };

    // Raycast screen X Y to 3d
    getIntersects(point, objects) {
        this.mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);
        this.raycaster.setFromCamera(this.mouse, this.cameraControls.camera);
        return this.raycaster.intersectObjects(objects, true);
    };

    getIntersectPlane(point) {
        this.mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);
        this.raycaster.setFromCamera(this.mouse, this.cameraControls.camera);
        const i = this.raycaster.intersectObjects([this.groundPlane], false);
        if (i.length > 0) {
            return i[0].point;
        }
        return null;
    };

    setupLights(camera, scene) {
        var camLight;
        camLight = new THREE.DirectionalLight(0xffffff, 1);
        camLight.position.set(0, 0, 0.5);
        camLight.position.multiplyScalar(30);
        camera.add(camLight);

        // var topLight = new THREE.DirectionalLight(0xffffff, 1);
        // topLight.castShadow = true;
        // topLight.shadow.camera.near = 1;
        // topLight.shadow.camera.far = 200;
        // topLight.shadow.camera.right = 60;
        // topLight.shadow.camera.left = - 60;
        // topLight.shadow.camera.top = 40;
        // topLight.shadow.camera.bottom = - 40;
        // topLight.shadow.mapSize.width = 1024;
        // topLight.shadow.mapSize.height = 1024;
        //this.scene.add(topLight);
        // topLight.position.set(0, 190, 0);

        // this.scene.add(new THREE.CameraHelper(topLight.shadow.camera));

        var light = new THREE.AmbientLight(0x202020); // soft white light
        scene.add(light);
    }

    loadStl(fileName) {
        const loader = new THREE.STLLoader();
        loader.load(fileName, (geometry) => {
            this.mesh = new THREE.Mesh(geometry, this.meshMaterial);
            this.mesh.castShadow = true;
            this.mesh.renderOrder = 1;
            this.raycastGroup.add(this.mesh);
            this.moveMeshToMinHeight();
            Support.setMesh(this.mesh);

            // this.normalHelper = new VertexNormalsHelper(this.mesh, 2, 0x00ff00, 1);
            // this.scene.add(this.normalHelper);

            this.render();

            window.data.go('meshLoaded', true);
        });
    }

    moveMeshToMinHeight() {
        if (this.mesh) {
            const position = this.mesh.geometry.attributes.position;
            const vector = new THREE.Vector3();
            let minPos = 1000;
            for (let i = 0, l = position.count; i < l; i++) {
                vector.fromBufferAttribute(position, i);
                vector.applyMatrix4(this.mesh.matrixWorld);
                if (minPos > vector.y) minPos = vector.y
            }
            this.mesh.position.y += this.minHeight - minPos;
            if (this.layFlatSideSelectorMesh) this.layFlatSideSelectorMesh.position.y = this.mesh.position.y;
        }
    }

    setupLine() {
        this.lineMaterial = new THREE.LineMaterial({
            color: this.colorGreen,
            linewidth: 5 // in pixels
        });
        this.lineMaterial.resolution.set(window.innerWidth - this.sidePanelWidth, window.innerHeight);
        this.linePoints.push(0, 0, 0);
        this.linePoints.push(5, 5, 5);
        const lineGeometry = new THREE.LineGeometry();
        lineGeometry.setPositions(this.linePoints);
        this.line = new THREE.Line2(lineGeometry, this.lineMaterial);
        this.line.visible = false;
        this.scene.add(this.line);

    }

    // Creates a huge box to intersect with to get the mouse world coorinates vector
    setupMouseRealCoordsHelper() {
        this.mouseRealCoordsHelper = new THREE.Mesh(new THREE.BoxBufferGeometry(1000, 1000, 1000), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.4, 0.4), side: THREE.DoubleSide }));
        this.scene.add(this.mouseRealCoordsHelper);
        this.mouseRealCoordsHelper.visible = false;
    }

    makeMaterials() {
        this.meshMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0.4, 0.8, 1),
            shininess: 50,
            transparent: true
        });
        this.meshMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.cursorHeight = { value: -100 };

            shader.vertexShader = 'varying vec4 vWorldPosition;\nvarying float vDotToNormal;\nconst vec4 DOWN = vec4(0.0, -1.0, 0.0, 0.0);\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                vec3 transformed =vec3(position);
                // For the cursor line
                vWorldPosition = modelMatrix * vec4(position, 1);
                                
                // Red color on bottom
                vDotToNormal = smoothstep(0.85, 1.0, dot(viewMatrix * DOWN, vec4(normalMatrix * normal, 1.0)));
            `);

            shader.fragmentShader = 'uniform float cursorHeight;\nvarying vec4 vWorldPosition;\nvarying float vDotToNormal;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
                `
                // Cursor line
                gl_FragColor = vWorldPosition.y < cursorHeight - 0.1 ? vec4(outgoingLight.r, outgoingLight.g, outgoingLight.b, diffuseColor.a) : vec4(vec3(outgoingLight.x / 2.0, outgoingLight.y / 2.0, outgoingLight.z / 2.0), diffuseColor.a);
                gl_FragColor = vWorldPosition.y > cursorHeight + 0.1 ? vec4(outgoingLight, diffuseColor.a) : gl_FragColor;

                // Red steep angles and orange reverse side of faces
                gl_FragColor.r = gl_FrontFacing ? (gl_FragColor.r + vDotToNormal) / 2.0 : gl_FragColor.b;
                gl_FragColor.g = gl_FrontFacing ? (gl_FragColor.g - vDotToNormal / 2.0) : gl_FragColor.b / 3.0;
                gl_FragColor.b = gl_FrontFacing ? (gl_FragColor.b - vDotToNormal / 2.0) : 0.1;

                gl_FragColor.r = vWorldPosition.y < 0.05 ? 0.0 : gl_FragColor.r;
                gl_FragColor.g = vWorldPosition.y < 0.05 ? 0.5 : gl_FragColor.g;
                gl_FragColor.b = vWorldPosition.y < 0.05 ? 0.0 : gl_FragColor.b;
            `);
            this.materialShader = shader;
        };

        this.meshMaterial.side = THREE.DoubleSide;

        this.supportMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0.9, 0.9, 0.8),
            shininess: 50,
            flatShading: true
        });

        this.supportMaterialSelected = this.supportMaterial.clone();
        this.supportMaterialSelected.color = new THREE.Color(0.1, 0.6, 0.1);

        this.meshLayFlatMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0.7, 1, 0, 7),
            shininess: 100,
            transparent: true,
            opacity: 0.4,
            depthTest: false
        });

        this.meshLayFlatMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.highlightNormal = new THREE.Uniform(this.downVector);

            shader.vertexShader = 'uniform vec3 highlightNormal;\nvarying float vDotToNormal;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                vec3 transformed = vec3(position);
                                
                vDotToNormal = dot(highlightNormal, normal);
            `);

            shader.fragmentShader = 'varying float vDotToNormal;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
                `
                gl_FragColor = vec4(outgoingLight.r, outgoingLight.g, outgoingLight.b, diffuseColor.a);

                // Highlight if facing the highlightNormal
                gl_FragColor.r = vDotToNormal > 0.99999 ? 1.0 : gl_FragColor.r;
                gl_FragColor.g = vDotToNormal > 0.99999 ? 1.0 : gl_FragColor.g;
                gl_FragColor.b = vDotToNormal > 0.99999 ? 1.0 : gl_FragColor.b;
            `);
            this.meshLayFlatMaterialShader = shader;
        };
    }

    setupBuildplate() {
        // Plane of buildplate
        this.buildplate = new THREE.PlaneGeometry(1, 1);
        // var material = new THREE.MeshPhongMaterial({
        //     color: 0x333333,
        //     shininess: 0,
        //     specular: 0x222222
        // });
        var texture = THREE.ImageUtils.loadTexture('./img/gridTexture.png');
        texture.wrapT = THREE.RepeatWrapping;
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat = new THREE.Vector2(bedSize.x / 10, bedSize.y / 10);
        texture.offset = new THREE.Vector2(0, bedSize.x / 100);
        texture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial({ color: 0x777777, map: texture });

        var plane = new THREE.Mesh(this.buildplate, material);
        plane.rotateX(-Math.PI / 2);
        this.buildplate.scale(bedSize.x, bedSize.y, 1);
        // plane.receiveShadow = true;
        this.scene.add(plane);

        // Outline of this.buildplate
        material = new THREE.LineBasicMaterial({ color: 0x444444 });
        var bpPoints = [];
        var scaleVector = new THREE.Vector3(bedSize.x, 1, bedSize.y).multiplyScalar(0.5);
        bpPoints.push(new THREE.Vector3(-1, 0, -1).multiply(scaleVector));
        bpPoints.push(new THREE.Vector3(1, 0, -1).multiply(scaleVector));
        bpPoints.push(new THREE.Vector3(1, 0, 1).multiply(scaleVector));
        bpPoints.push(new THREE.Vector3(-1, 0, 1).multiply(scaleVector));
        var geometry = new THREE.BufferGeometry().setFromPoints(bpPoints);
        this.scene.add(new THREE.LineLoop(geometry, material));

        // Origo sphere
        geometry = new THREE.SphereGeometry(0.5, 8, 8);
        material = new THREE.MeshBasicMaterial({ color: 0x559955 });
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(new THREE.Vector3(-bedSize.x / 2, 0, -bedSize.y / 2));
        this.scene.add(sphere);

        geometry = new THREE.BoxBufferGeometry(bedSize.x, 1, bedSize.y);
        geometry.translate(0, 0.5, 0);
        material = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.1, transparent: true });
        this.minHeightMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.minHeightMesh);
        this.minHeightMesh.renderOrder = 20;
        this.minHeightMesh.scale.set(1, 1 * this.minHeight, 1);
    }

    // Support manipulations

    selectSupport(id, deselectOthers) {
        if (deselectOthers) {
            this.supports.forEach(s => {
                s.deselect();
            });
        }
        this.supports.some((s) => {
            if (s.id === id) { s.select(); return true; }
            return false;
        });
        this.render();
    }

    deselectSupport(id) {
        this.supports.some((s) => {
            if (s.id === id && s.selected) { s.deselect(); return true; }
            return false;
        });
        this.render();
    }

    selectSupports(ids) {
        this.supports.forEach(s => {
            if (ids.contains(s.id) && !s.selected) {
                s.select();
            }
            if (!ids.contains(s.id) && s.selected) {
                s.deselect();
            }
        });
        this.render();
    }

    selectAllSupports() {
        this.supports.forEach(s => {
            s.select();
        });
        this.render();
    }

    deselectAllSupports() {
        this.supports.forEach(s => {
            s.deselect();
        });
        this.render();
    }

    invertSupportsSelection() {
        this.supports.forEach(s => {
            s.selected ? s.deselect() : s.select();
        });
        this.render();
    }

    deleteSelectedSupports() {
        this.supports = this.supports.map(s => {
            if (s.selected) {
                s.dispose();
                return null;
            } else {
                s.deleteSelectedTips();
            }
            return s;
        });
        this.supports = this.supports.filter(s => s);
        this.renderer.renderLists.dispose();
        this.render();
    }

    deleteSupport(id) {
        this.supports = this.supports.map(s => {
            if (s.id === id) {
                s.dispose();
                return null;
            }
            return s;
        });
        this.supports = this.supports.filter(s => s);
        this.renderer.renderLists.dispose();
        this.render();
    }

    deleteLastSupport() {
        this.supports.pop().dispose();
        this.renderer.renderLists.dispose();
        this.render();
    }

    selectSupportsPreset(presetName, selected) {
        this.supports.forEach(s => {
            if (s.presetName === presetName) {
                selected ? s.select() : s.deselect();
            }
        });
        this.render();
    }

    deleteAllSupports() {
        this.supports.forEach(s => s.dispose());
        this.supports.length = 0;
        this.renderer.renderLists.dispose();
        DSSupport.id = 1;
        this.render();
    }

    selectPreset(presetName) {
        this.selectedPreset = this.presets.find(p => p.name === presetName);
    }

    moveSelectedSupport(x, z) {
        const selectedSupports = this.supports.filter(s => s.selected);
        if (selectedSupports.length == 0) return;
        selectedSupports.forEach(s => {
            s.moveJointPosition(x, z);
        });
        this.render();
    }

    toggleMeshVisibility() {
        if (this.raycastGroup.children.includes(this.mesh)) {
            this.raycastGroup.remove(this.mesh);
            this.hiddenGroup.add(this.mesh);
        } else {
            this.hiddenGroup.remove(this.mesh);
            this.raycastGroup.add(this.mesh);
        }
        this.meshMaterial.opacity = this.meshMaterial.opacity === 1 ? 0.2 : 1;
        this.render();
    }

    adjustSelectedSupportDiameter(value, tipsOnly, tipsAlso) {
        const selectedSupports = this.supports.filter(s => s.selected);
        if (selectedSupports.length == 0 && this.supports.length > 0) {
            const tipSet = this.supports.filter(s => {
                const tip = s.tips.find(t => t.selected);
                if (tip) {
                    tip.adjustDiameter(value);
                    return true;
                }
            })
            if (!tipSet) this.supports[this.supports.length - 1].adjustDiameter(value, tipsOnly, tipsAlso);
        } else {
            selectedSupports.forEach(s => {
                s.adjustDiameter(value, tipsOnly, tipsAlso);
            });
        }
        this.render();
    }

    setTipEndSpheres(enabled) {
        if (this.supports.length === 0) return;

        const selectedSupports = this.supports.filter(s => s.selected);
        if (selectedSupports.length > 0) {
            selectedSupports.forEach(s => s.setTipEndSphere(enabled));
        } else {
            const supportsWithSelectedTip = this.supports.filter(s => s.tips.some(t => t.selected));
            if (supportsWithSelectedTip.length > 0) {
                supportsWithSelectedTip.forEach(s => s.setTipEndSphere(enabled));
            } else {
                this.supports[this.supports.length - 1].setTipEndSphere(enabled);
            }
        }
        this.render();
    }

    setMinHeight(value) {
        this.minHeight = value;
        this.moveMeshToMinHeight();
        this.minHeightMesh.scale.set(1, 1 * this.minHeight, 1);
        this.render();
    }

    toggleLayFlatMesh() {
        if (this.layFlatSideSelectorMesh) {
            this.removeLayFlatMesh();
        } else {
            // Create the bounding, simplified convex hull
            let tempGeometry = new THREE.Geometry().fromBufferGeometry(this.mesh.geometry);
            let meshGeometry = new THREE.ConvexBufferGeometry(tempGeometry.vertices);

            let modifier = new THREE.SimplifyModifier();
            let count = Math.floor(meshGeometry.attributes.position.count * 0.1);
            meshGeometry = modifier.modify(meshGeometry, count);

            meshGeometry.computeFaceNormals();
            tempGeometry = new THREE.Geometry().fromBufferGeometry(meshGeometry);
            tempGeometry.computeFaceNormals();

            this.layFlatSideSelectorMesh = new THREE.Mesh(tempGeometry, this.meshLayFlatMaterial);
            this.layFlatSideSelectorMesh.renderOrder = 2;
            this.layFlatSideSelectorMesh.position.y = this.mesh.position.y - 0.001;
            this.layFlatSideSelectorMesh.rotation.copy(this.mesh.rotation);
            this.layFlatSideSelectorMesh.position.copy(this.mesh.position);
            this.layFlatSideSelectorMesh.scale.copy(this.mesh.scale);
            this.scene.add(this.layFlatSideSelectorMesh);

            this.render();
        }
    }

    removeLayFlatMesh() {
        this.disposeMesh(this.layFlatSideSelectorMesh);
        this.layFlatSideSelectorMesh = null;
    }

    setLayFlatMode(enabled) {
        if (enabled) {
            const geometry = new THREE.CircleGeometry(5, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
            this.layFlatCircle = new THREE.Mesh(geometry, material);
            this.layFlatCircle.renderOrder = 2;
            this.layFlatCircle.visible = false;
            this.scene.add(this.layFlatCircle);
        } else {
            this.disposeMesh(this.layFlatCircle, false);
            this.layFlatCircle = null;
            this.removeLayFlatMesh();
        }
    }

    disposeMesh(mesh, cleanRenderList = true) {
        if (mesh) {
            mesh.parent.remove(mesh);
            mesh.geometry.dispose();
            mesh = null;
            if (cleanRenderList) {
                this.renderer.renderLists.dispose();
                this.render();
            }
        }
    }
}
window.data.set3dApp(new app3d());
