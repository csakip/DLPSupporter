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
    const bottomGeometry = new THREE.CylinderGeometry(this.bottom.diameter / 2, this.bottom.diameter / 2, 1, 8);
    bottomGeometry.translate(0, 0.5, 0); // Origo at baseplate contact

    this.bottom.mesh = new THREE.Mesh(bottomGeometry, DSSupport.material);
    DSSupport.raycastGroupHiding.add(this.bottom.mesh);
    const shaftBaseGeometry = new THREE.CylinderGeometry(this.shaft.diameter / 2, Math.min(this.shaft.diameter / 2 + 1, this.bottom.diameter / 2), 0.5, 8);
    shaftBaseGeometry.translate(0, 1.25, 0); // Origo at bottom contact

    this.shaftbase.mesh = new THREE.Mesh(shaftBaseGeometry, DSSupport.material);
    this.bottom.mesh.add(this.shaftbase.mesh);
    const shaftGeometry = new THREE.CylinderGeometry(this.shaft.diameter / 2, this.shaft.diameter / 2, 1, 8);
    shaftGeometry.translate(0, 0.5, 0); // Origo at its base

    this.shaft.mesh = new THREE.Mesh(shaftGeometry, DSSupport.material);
    this.shaftbase.mesh.add(this.shaft.mesh);
    const jointGeometry = new THREE.SphereGeometry(this.shaft.diameter / 2, 8, 8);

    this._flattenBottom(jointGeometry);

    this.joint.mesh = new THREE.Mesh(jointGeometry, DSSupport.material);
    DSSupport.raycastGroupHiding.add(this.joint.mesh);
    this.bottom.mesh.userData.supportType = 'b';
    this.shaftbase.mesh.userData.supportType = 'sb';
    this.shaft.mesh.userData.supportType = 's';
    this.joint.mesh.userData.supportType = 'j';
    this.bottom.mesh.userData.support = this;
    this.shaftbase.mesh.userData.support = this;
    this.shaft.mesh.userData.support = this;
    this.joint.mesh.userData.support = this;
  }

  setPositions() {
    if (this.jointPosition.y < 1.5) {
      this.jointPosition.y = 1.5;
    } // Calculate shaft


    DSSupport.raycaster.set(this.jointPosition, new THREE.Vector3(0, -1, 0));
    const intersects = DSSupport.raycaster.intersectObject(DSSupport.mesh);

    if (intersects.length > 0) {
      console.log('hit');
    }

    this.bottom.mesh.position.set(this.jointPosition.x, 0, this.jointPosition.z);
    this.joint.mesh.position.copy(this.jointPosition);
    this.shaft.mesh.scale.y = this.jointPosition.y - 1.5;
    this.shaft.mesh.position.y = 1.5;
    this.joint.mesh.position.y = this.jointPosition.y;
  }

  calculateJointPosition(contactPosition, direction, tipLength) {
    this.fixDirectionAngle(direction);
    const offset = direction.clone().normalize().multiplyScalar(tipLength); // If it would reach under the min height, shorten the tip

    if (contactPosition.y + offset.y < 1.5) {
      const shortenedTip = new THREE.Vector3(0, -1.5, 0).projectOnVector(offset);
      offset.copy(shortenedTip);
    }

    this.jointPosition = new THREE.Vector3(offset.x, offset.y, offset.z).add(contactPosition);
  } // Makes the angle of the tip downward if it would be too horizontal


  fixDirectionAngle(direction) {
    const tipShouldBe = direction.clone().normalize();
    const horizontal = new THREE.Vector3(tipShouldBe.x, 0, tipShouldBe.z);

    if (tipShouldBe.x == 0 && tipShouldBe.z == 0) {
      // If it's directly down, then just make a vector on the plane.
      horizontal.x = 1;
    }

    const angleToHorizontal = tipShouldBe.angleTo(horizontal);

    if (angleToHorizontal < Math.PI / 12) {
      // If the tip is 15 degrees or less to horizontal, set the offset y to make it 10 degrees
      const minY = new THREE.Vector3(tipShouldBe.length(), 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 12).y;
      direction.y = -minY;
      direction.normalize();
    }
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
    this.bottom.mesh.scale.y = 1.005;
    this.shaft.mesh.scale.y *= 1 / 1.005;
    this.bottom.mesh.position.y -= 0.001;
    this.bottom.mesh.material = DSSupport.materialSelected;
    this.shaftbase.mesh.material = DSSupport.materialSelected;
    this.shaft.mesh.material = DSSupport.materialSelected;
    this.joint.mesh.material = DSSupport.materialSelected;
    this.selected = true;
  }

  deselect() {
    this.tips.forEach(tip => tip.deselect());
    if (!this.selected) return;
    this.bottom.mesh.scale.y = 1;
    this.shaft.mesh.scale.y /= 1 / 1.005;
    this.bottom.mesh.position.y += 0.001;
    this.bottom.mesh.material = DSSupport.material;
    this.shaftbase.mesh.material = DSSupport.material;
    this.shaft.mesh.material = DSSupport.material;
    this.joint.mesh.material = DSSupport.material;
    this.selected = false;
  }

  dispose() {
    this.bottom.mesh.geometry.dispose();
    this.shaftbase.mesh.geometry.dispose();
    this.shaft.mesh.geometry.dispose();
    this.joint.mesh.geometry.dispose();
    this.tips.forEach(tip => tip.dispose());
    DSSupport.raycastGroupHiding.remove(this.bottom.mesh);
    DSSupport.raycastGroupHiding.remove(this.joint.mesh);
  }

  setHeightHandlesVisibility(visible) {
    this.tips.forEach(tip => tip.supportHeightHandle.visible = visible);
  }

  setHeightToNormal() {}

  addTip(contactPosition, tipDirection, tipDiameter, tipLength, selected) {
    this.fixDirectionAngle(tipDirection);
    const offset = tipDirection.clone().normalize().multiplyScalar(tipLength); // If it would reach under the min height, shorten the tip

    if (contactPosition.y + offset.y < 1.5) {
      const shortenedTip = new THREE.Vector3(0, -1.5, 0).projectOnVector(offset);
      offset.copy(shortenedTip);
    }

    this.tips.push(new DSSupportTip(this, contactPosition, contactPosition.y + offset.y, tipDiameter, selected));
    this.setJointToHighPoint(contactPosition.y + offset.y, false);
  } // Move shaft top if this is higher than the other tips


  moveShaftTopToHighestTip() {
    const highestTipY = Math.max(...this.tips.map(tip => tip.baseY));
    this.setJointToHighPoint(highestTipY, true);
  }

  setJointToHighPoint(highestTipY, force) {
    if (force || this.jointPosition.y < highestTipY) {
      this.jointPosition.y = highestTipY;
      this.joint.mesh.position.copy(this.jointPosition);
      this.shaft.mesh.scale.y = this.jointPosition.y - 1.5;
      this.joint.mesh.position.y = this.jointPosition.y;
    }
  }

  _flattenBottom(geometry) {
    geometry.vertices.filter(v => v.y < 0).forEach(v => v.y = 0);
    geometry.verticesNeedUpdate = true;
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
  }

}