'use strict';
import DSSupportTip from './DSSupportTip.js';

export default class DSSupport {
    static init(scene, material, materialSelected, raycastGroup, raycastGroupHiding) {
        DSSupport.scene = scene;
        DSSupport.material = material;
        DSSupport.materialSelected = materialSelected;
        DSSupport.id = 1;
        DSSupport.raycastGroup = raycastGroup;
        DSSupport.raycastGroupHiding = raycastGroupHiding;
        DSSupport.raycaster = new THREE.Raycaster();
    }

    static setMesh(mesh) {
        DSSupport.mesh = mesh;
    }

    constructor(contactPosition, tipDirection, presetName, shaftDiameter = 0.8, tipLength = 3, tipDiameter = 0.3, group = 0, bottomDiameter = 6) {
        this.id = DSSupport.id++;
        this.group = group;
        this.presetName = presetName;
        this.selected = false;

        this.bottom = {};
        this.shaft = {};
        this.shaftbase = {};
        this.joint = {};
        this.bottomJoint = {};

        this.bottom.diameter = bottomDiameter;
        this.shaft.diameter = shaftDiameter;

        this.tips = [];

        this.createMeshes();
        this.calculateJointPosition(contactPosition, tipDirection, tipLength);
        this.addTip(contactPosition, tipDirection, tipDiameter, tipLength, false);
        this.setPositions();

        window.data.go('addSupport', this); // Makes a callback so the UI can update
    }

    createMeshes() {
        const shaftGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
        shaftGeometry.scale(this.shaft.diameter / 2, 1, this.shaft.diameter / 2);
        shaftGeometry.translate(0, 0.5, 0); // Origo at its base
        this.shaft.mesh = new THREE.Mesh(shaftGeometry, DSSupport.material);

        this.createBottomMeshes();

        const jointGeometry = new THREE.SphereGeometry(1, 8, 8);
        jointGeometry.scale(this.shaft.diameter / 2, this.shaft.diameter / 2, this.shaft.diameter / 2);
        this._flattenBottom(jointGeometry);
        this.joint.mesh = new THREE.Mesh(jointGeometry, DSSupport.material);
        DSSupport.raycastGroupHiding.add(this.joint.mesh);

        this.shaft.mesh.userData.supportType = 's';
        this.joint.mesh.userData.supportType = 'j';

        this.shaft.mesh.userData.support = this;
        this.joint.mesh.userData.support = this;
    }

    createBottomMeshes() {
        if (this.bottomJoint.mesh) {
            this.bottomJoint.mesh.geometry.dispose();
            DSSupport.raycastGroupHiding.remove(this.bottomJoint.mesh);
            this.bottomJoint.mesh = null;
        }
        const bottomGeometry = new THREE.CylinderGeometry(this.bottom.diameter / 2, this.bottom.diameter / 2, 1, 8);
        bottomGeometry.translate(0, 0.5, 0); // Origo at baseplate contact
        this.bottom.mesh = new THREE.Mesh(bottomGeometry, this.selected ? DSSupport.materialSelected : DSSupport.material);
        DSSupport.raycastGroupHiding.add(this.bottom.mesh);

        const shaftBaseGeometry = new THREE.CylinderGeometry(1, 2.5, 0.5, 8);
        shaftBaseGeometry.scale(this.shaft.diameter / 2, 1, this.shaft.diameter / 2);
        shaftBaseGeometry.translate(0, 1.25, 0); // Origo at bottom contact
        this.shaftbase = {};
        this.shaftbase.mesh = new THREE.Mesh(shaftBaseGeometry, this.selected ? DSSupport.materialSelected : DSSupport.material);
        this.shaftbase.mesh.add(this.shaft.mesh);
        this.bottom.mesh.add(this.shaftbase.mesh);

        this.shaftbase.mesh.userData.supportType = 'sb';
        this.shaftbase.mesh.userData.support = this;
        this.bottom.mesh.userData.supportType = 'b';
        this.bottom.mesh.userData.support = this;
    }

    createBottomJoint() {
        if (this.bottom.mesh) {
            this.shaftbase.mesh.geometry.dispose();
            DSSupport.raycastGroupHiding.remove(this.bottom.mesh);
            this.bottom.mesh.geometry.dispose();
            this.bottom.mesh.remove(this.shaftbase.mesh);
            this.bottom.mesh = null;
            this.shaftbase.mesh = null;
        }
        const bottomJointGeometry = new THREE.SphereGeometry(1, 8, 8);
        bottomJointGeometry.scale(this.shaft.diameter / 2, this.shaft.diameter / 2, this.shaft.diameter / 2);
        this._flattenBottom(bottomJointGeometry);
        bottomJointGeometry.rotateX(Math.PI);
        this.bottomJoint = {};
        this.bottomJoint.mesh = new THREE.Mesh(bottomJointGeometry, this.selected ? DSSupport.materialSelected : DSSupport.material);
        this.bottomJoint.mesh.add(this.shaft.mesh);
        DSSupport.raycastGroupHiding.add(this.bottomJoint.mesh);
    }

    setPositions() {
        if (this.jointPosition.y < 1.5) {
            this.jointPosition.y = 1.5;
        }

        // Calculate shaft
        DSSupport.raycaster.set(this.jointPosition, new THREE.Vector3(0, -1, 0));
        const intersects = DSSupport.raycaster.intersectObject(DSSupport.mesh);
        if (intersects.length > 0) {
            console.log('hit')
        }

        if (this.bottom.mesh) {
            this.bottom.mesh.position.set(this.jointPosition.x, 0, this.jointPosition.z);
            this.shaft.mesh.position.y = 1.5;
            this.shaft.mesh.scale.y = this.jointPosition.y - 1.5;
            this.shaft.mesh.position.x = 0;
            this.shaft.mesh.position.z = 0;
        } else {
            this.bottomJoint.mesh.position.x = this.jointPosition.x;
            this.bottomJoint.mesh.position.z = this.jointPosition.z;
            this.bottomJoint.mesh.position.y = this.tips[0].baseY;
            this.shaft.mesh.position.y = 0;
            this.shaft.mesh.scale.y = this.jointPosition.y - this.tips[0].baseY;
        }
        this.joint.mesh.position.copy(this.jointPosition);
        this.joint.mesh.position.y = this.jointPosition.y;
    }

    calculateJointPosition(contactPosition, direction, tipLength) {
        this.fixDirectionAngle(direction);

        const offset = direction.clone().normalize().multiplyScalar(tipLength);

        // If it would reach under the min height, shorten the tip
        if (contactPosition.y + offset.y < 1.5) {
            const shortenedTip = new THREE.Vector3(0, -1.5, 0).projectOnVector(offset);
            offset.copy(shortenedTip);
        }

        this.jointPosition = new THREE.Vector3(offset.x, offset.y, offset.z).add(contactPosition);
    }

    // Makes the angle of the tip angled if it would be too horizontal
    fixDirectionAngle(direction) {
        const tipShouldBe = direction.clone().normalize();
        const horizontal = new THREE.Vector3(tipShouldBe.x, 0, tipShouldBe.z);
        if (tipShouldBe.x == 0 && tipShouldBe.z == 0) {  // If it's directly down, then just make a vector on the plane.
            horizontal.x = 1;
        }
        const angleToHorizontal = tipShouldBe.angleTo(horizontal);
        if (direction.y <= 0 && angleToHorizontal < Math.PI / 12) {  // If the tip is 15 degrees or less to horizontal, set the offset y to make it 15 degrees
            const minY = new THREE.Vector3(tipShouldBe.length(), 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 12).y;
            direction.y = -minY;
            direction.normalize();
        } else if (direction.y > 0 && angleToHorizontal < Math.PI / 12) {  // If the tip is 15 degrees or less to horizontal, set the offset y to make it 15 degrees upwards
            const minY = new THREE.Vector3(tipShouldBe.length(), 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 12).y;
            direction.y = minY;
            direction.normalize();
        }
    }

    moveToNewPosition(contactPosition, tipDirection, tipLength) {
        this.calculateJointPosition(contactPosition, tipDirection, tipLength);
        this.tips[0].moveToNewPosition(contactPosition);
        this.setPositions();
    }

    moveJointPosition(x, z) {
        this.jointPosition.x += x;
        this.jointPosition.z += z;
        this.setPositions();
        this.tips.forEach(tip => tip.setPositions());
    }

    moveHeight(y) {
        this.jointPosition.y += y;
        this.setPositions();
        this.tips.forEach(tip => tip.setPositions());
    }

    move(vector) {
        this.bottom.mesh.position.add(vector);
        this.joint.mesh.position.add(vector);
        this.tips.forEach(tip => tip.move(vector));
    }

    select() {
        this.tips.forEach(tip => tip.select());
        if (this.selected) return;
        if (this.bottom.mesh) {
            this.bottom.mesh.scale.y = 1.005;
            this.bottom.mesh.position.y -= 0.001;
            this.bottom.mesh.material = DSSupport.materialSelected;
            this.shaftbase.mesh.material = DSSupport.materialSelected;
        } else {
            this.bottomJoint.mesh.material = DSSupport.materialSelected;
        }
        this.shaft.mesh.scale.y *= 1 / 1.005;
        this.shaft.mesh.material = DSSupport.materialSelected;
        this.joint.mesh.material = DSSupport.materialSelected;
        this.selected = true;
    }

    deselect() {
        this.tips.forEach(tip => tip.deselect());
        if (!this.selected) return;
        if (this.bottom.mesh) {
            this.bottom.mesh.scale.y = 1;
            this.bottom.mesh.position.y += 0.001;
            this.bottom.mesh.material = DSSupport.material;
            this.shaftbase.mesh.material = DSSupport.material;
        } else {
            this.bottomJoint.mesh.material = DSSupport.material;
        }
        this.shaft.mesh.scale.y /= 1 / 1.005;
        this.shaft.mesh.material = DSSupport.material;
        this.joint.mesh.material = DSSupport.material;
        this.selected = false;
    }

    deselectTips() {
        this.tips.forEach(tip => tip.deselect());
    }

    deleteSelectedTips() {
        if (this.tips.length > 1) {
            this.tips.filter(tip => tip.selected).forEach(tip => tip.dispose());
            this.tips = this.tips.filter(tip => !tip.selected);
            this.moveShaftTopToHighestTip();
            if (this.tips.length === 1 && !this.bottom.mesh) {
                this.createBottomMeshes();
                this.setPositions();
            }
        }
    }

    dispose() {
        if (this.bottom.mesh) {
            this.bottom.mesh.geometry.dispose();
            this.shaftbase.mesh.geometry.dispose();
        } else {
            this.bottomJoint.mesh.geometry.dispose();
        }
        this.shaft.mesh.geometry.dispose();
        this.joint.mesh.geometry.dispose();
        this.tips.forEach(tip => tip.dispose());
        DSSupport.raycastGroupHiding.remove(this.bottom.mesh);
        DSSupport.raycastGroupHiding.remove(this.joint.mesh);
        DSSupport.raycastGroupHiding.remove(this.bottomJoint.mesh);
    }

    setHeightHandlesVisibility(visible) {
        this.tips.forEach(tip => tip.supportHeightHandle.visible = tip.selected || visible);
    }

    addTip(contactPosition, tipDirection, tipDiameter, tipLength, selected) {
        this.fixDirectionAngle(tipDirection);

        const offset = tipDirection.clone().normalize().multiplyScalar(tipLength);

        // If it would reach under the min height, shorten the tip
        if (contactPosition.y + offset.y < 1.5) {
            const shortenedTip = new THREE.Vector3(0, -1.5, 0).projectOnVector(offset);
            offset.copy(shortenedTip);
        }

        this.tips.push(new DSSupportTip(this, contactPosition, contactPosition.y + offset.y, tipDiameter, selected));
        this.tips.sort((a, b) => a.baseY - b.baseY);

        this.setJointToHighPoint(contactPosition.y + offset.y, false);

        this.checkLowestPointingUp();

        this.setPositions();
        window.data.go('selectedSupport');
    }

    setTipEndSphere(sphereDiameter) {
        const t = this.tips.filter(t => t.selected);
        if (t.length > 0 ) {
            t.forEach(t => t.setTipEndSphere(sphereDiameter));
        } else {
            this.tips.forEach(t => t.setTipEndSphere(sphereDiameter));
        }
    }

    checkLowestPointingUp() {
        // Check if lowest tip is pointing down
        if (this.tips.length > 1) {
            // Lowest tip is pointing down
            if (this.tips[0].contactPosition.y < this.tips[0].baseY) {
                if (this.bottom.mesh) { // Need to create the low joint
                    this.createBottomJoint();
                }
            } else {
                if (!this.bottom.mesh) { // Need to create the bottom
                    this.createBottomMeshes();
                }
            }
        }
    }

    // Move shaft top if this is higher than the other tips
    moveShaftTopToHighestTip() {
        this.tips.sort((a, b) => a.baseY - b.baseY);
        this.setJointToHighPoint(this.tips[this.tips.length - 1].baseY, true);
        this.checkLowestPointingUp();
        this.setPositions();
    }

    setJointToHighPoint(highestTipY, force) {
        if (force || this.jointPosition.y < highestTipY) {
            this.jointPosition.y = highestTipY;
            this.joint.mesh.position.copy(this.jointPosition);
            this.shaft.mesh.scale.y = this.jointPosition.y - 1.5;
            this.joint.mesh.position.y = this.jointPosition.y;
        }
    }

    adjustDiameter(value, tipsOnly, tipsAlso) {
        if (tipsOnly) {
            this.tips.forEach(tip => tip.adjustDiameter(value));
            return;
        }
        this.tipDiameter *= value;
        this.shaft.diameter *= value;
        this.shaft.mesh.geometry.scale(value, 1, value);
        this.joint.mesh.geometry.scale(value, value, value);
        this.tips.forEach(tip => tip.supportHeightHandle.geometry.scale(value, value, value));
        if (this.bottom.mesh) {
            this.shaftbase.mesh.geometry.scale(value, 1, value);
        } else {
            this.bottomJoint.mesh.geometry.scale(value, value, value);
        }
        if (tipsAlso) this.tips.forEach(tip => tip.adjustDiameter(value));
    }

    _flattenBottom(geometry) {
        geometry.vertices.filter(v => v.y < 0).forEach(v => v.y = 0);
        geometry.verticesNeedUpdate = true;
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
    }
}