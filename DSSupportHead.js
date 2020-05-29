'use strict';

import DSSupport from './DSSupport.js';
export default class DSSupportTip {
  constructor(parentSupport, contactPosition, shaftDiameter = 0.8, tipDiameter = 0.3) {
    this.parentSupport = parentSupport;
    this.contactPosition = contactPosition;
    this.selected = false;
    this.tip = {};
    this.tipEnd = {};
    this.shaftDiameter = shaftDiameter;
    this.tip.diameter = tipDiameter;
    this.createMeshes();
  }

  createMeshes() {
    var tipGeometry = new THREE.CylinderGeometry(this.shaftDiameter * 0.97 / 2, this.tip.diameter / 2, 1, 8);
    tipGeometry.translate(0, 0.5, 0); // Origo at touch tip

    this.tip.mesh = new THREE.Mesh(tipGeometry, DSSupport.material);
    DSSupport.raycastGroup.add(this.tip.mesh);
    this.supportHeightHandle = new THREE.Mesh(new THREE.SphereGeometry(this.shaftDiameter, 8, 6), new THREE.MeshBasicMaterial({
      color: 0xccff55,
      opacity: 0.5,
      transparent: true
    }));
    this.tip.mesh.add(this.supportHeightHandle);
    this.supportHeightHandle.visible = false;
    var tipEndGeometry = new THREE.SphereGeometry(this.tip.diameter / 2, 8, 8);

    this._flattenBottom(tipEndGeometry);

    tipEndGeometry.rotateX(Math.PI);
    this.tipEnd.mesh = new THREE.Mesh(tipEndGeometry, DSSupport.material);
    this.tip.mesh.add(this.tipEnd.mesh);
    this.supportHeightHandle.userData.supportType = 'sh';
    this.tip.mesh.userData.supportType = 't';
    this.tipEnd.mesh.userData.supportType = 'te';
    this.supportHeightHandle.userData.head = this;
    this.tip.mesh.userData.head = this;
    this.tipEnd.mesh.userData.head = this;
    this.supportHeightHandle.userData.support = this.parentSupport;
    this.tip.mesh.userData.support = this.parentSupport;
    this.tipEnd.mesh.userData.support = this.parentSupport;
  }

  setContactPosition() {
    if (this.contactPosition.y + this.parentSupport.offset.y < 1.5) {
      this.offset.y = 1.5 - this.parentSupport.contactPosition.y;
    }

    const offsetNormal = this.offset.clone().normalize();
    this.tip.mesh.scale.y = this.offset.length();
    this.tipEnd.mesh.scale.y = 1 / this.offset.length();
    const axis = new THREE.Vector3(0, 1, 0);
    this.tip.mesh.quaternion.setFromUnitVectors(axis, offsetNormal);
    this.tip.mesh.position.copy(this.contactPosition);
    this.tip.mesh.updateMatrixWorld();
    return true;
  }

  calculateInitialOffset(tipLength) {
    this.offset.copy(this.tip.direction.clone().normalize().multiplyScalar(tipLength));

    if (this.contactPosition.y + this.offset.y < 1.5) {
      const shortenedTip = new THREE.Vector3(0, -1.5, 0).projectOnVector(this.offset);
      this.offset.copy(shortenedTip);
    }
  }

  fixDirectionAngle() {
    const tipShouldBe = this.tip.direction.clone().normalize();
    const horizontal = new THREE.Vector3(tipShouldBe.x, 0, tipShouldBe.z);

    if (tipShouldBe.x == 0 && tipShouldBe.z == 0) {
      // If it's directly down, then just make a vector on the plane.
      horizontal.x = 1;
    }

    const angleToHorizontal = tipShouldBe.angleTo(horizontal);

    if (angleToHorizontal < Math.PI / 12) {
      // If the tip is 15 degrees or less to horizontal, set the offset y to make it 10 degrees
      const minY = new THREE.Vector3(tipShouldBe.length(), 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 12).y;
      this.tip.direction.y = -minY;
      this.tip.direction.normalize();
    }
  }

  moveHeight(y) {
    this.offset.y += y;

    if (!this.setContactPosition()) {
      this.offset.y -= y;
    }
  }

  moveTipTo(point, direction) {
    const offsetBetweenNewAndOldContact = this.contactPosition.clone().sub(point);
    this.tip.direction.copy(direction);
    this.contactPosition.copy(point);
    this.offset.add(offsetBetweenNewAndOldContact);
    this.setContactPosition();
  }

  select() {
    if (this.selected) return;
    this.tip.mesh.material = DSSupport.materialSelected;
    this.tipEnd.mesh.material = DSSupport.materialSelected;
    this.supportHeightHandle.visible = true;
    this.selected = true;
  }

  deselect() {
    if (!this.selected) return;
    this.tip.mesh.material = DSSupport.material;
    this.tipEnd.mesh.material = DSSupport.material;
    this.supportHeightHandle.visible = false;
    this.selected = false;
  }

  dispose() {
    this.tip.mesh.geometry.dispose();
    this.tipEnd.mesh.geometry.dispose();
    this.supportHeightHandle.geometry.dispose();
    DSSupport.raycastGroup.remove(this.tip.mesh);
  }

  setHeightToNormal() {}

  _flattenBottom(geometry) {
    geometry.vertices.filter(v => v.y < 0).forEach(v => v.y = 0);
    geometry.verticesNeedUpdate = true;
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
  }

}