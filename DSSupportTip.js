'use strict';

import DSSupport from './DSSupport.js';
export default class DSSupportTip {
  constructor(parent, contactPosition, baseY, tipDiameter = 0.3, selected = false) {
    this.parent = parent;
    this.contactPosition = contactPosition.clone();
    this.baseY = baseY;
    this.selected = false;
    this.tipSphere = false;
    this.tip = {};
    this.tipEnd = {};
    this.tip.diameter = tipDiameter;
    this.createMeshes();
    this.setPositions();

    if (selected) {
      this.select();
    }
  }

  createMeshes() {
    const tipGeometry = new THREE.CylinderGeometry(this.parent.shaft.diameter * 0.97 / 2, this.tip.diameter / 2, 1, 8);
    tipGeometry.translate(0, 0.5, 0); // Origo at touch tip

    this.tip.mesh = new THREE.Mesh(tipGeometry, DSSupport.material);
    DSSupport.raycastGroup.add(this.tip.mesh);
    this.supportHeightHandle = new THREE.Mesh(new THREE.SphereGeometry(this.parent.shaft.diameter * 0.75, 8, 6), new THREE.MeshBasicMaterial({
      color: 0xccff55,
      opacity: 0.5,
      transparent: true
    }));
    this.supportHeightHandle.visible = false;
    DSSupport.raycastGroup.add(this.supportHeightHandle);
    const tipEndGeometry = new THREE.SphereGeometry(this.tip.diameter / 2, 8, 8);

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
    this.supportHeightHandle.userData.support = this.parent;
    this.tip.mesh.userData.support = this.parent;
    this.tipEnd.mesh.userData.support = this.parent;
  }

  setPositions() {
    const jointPosition = this.parent.jointPosition.clone();
    jointPosition.y = this.baseY;
    this.supportHeightHandle.position.copy(jointPosition);
    const offset = jointPosition.clone().sub(this.contactPosition);
    this.tip.mesh.scale.y = offset.length();
    this.tipEnd.mesh.scale.y = 1 / this.tip.mesh.scale.y;
    const axis = new THREE.Vector3(0, 1, 0);
    this.tip.mesh.quaternion.setFromUnitVectors(axis, offset.normalize());
    this.tip.mesh.position.copy(this.contactPosition);
    this.tip.mesh.updateMatrixWorld();
  }

  moveTipTo(point) {
    this.contactPosition.copy(point);
    this.setPositions();
    this.parent.checkLowestPointingUp();
    this.parent.setPositions();
  }

  moveToNewPosition(contactPosition, basePosition) {
    this.contactPosition.copy(contactPosition);
    this.baseY = this.parent.jointPosition.y;
    this.setPositions();
  }

  moveBaseHeight(offset) {
    this.baseY += offset;

    if (this.baseY < 1.5) {
      this.baseY = 1.5;
    }

    this.setPositions();
    this.parent.moveShaftTopToHighestTip();
  }

  move(vector) {
    this.contactPosition.add(vector);
    this.tip.mesh.position.add(vector);
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

  toggleSelected() {
    this.selected ? this.deselect() : this.select();
  }

  adjustDiameter(value) {
    this.tip.diameter *= value;
    this.tip.mesh.geometry.scale(value, 1, value);
    this.tipEnd.mesh.geometry.scale(value, value, value); // this.supportHeightHandle.geometry.scale(value, value, value);
  }

  setTipEndSphere(sphereDiameter) {
    let tipEndGeometry = null;
    if (sphereDiameter === true) sphereDiameter = this.tip.diameter * 2;

    if (sphereDiameter) {
      tipEndGeometry = new THREE.SphereGeometry(sphereDiameter / 2, 8, 4);
      this.tipSphere = true;
    } else {
      tipEndGeometry = new THREE.SphereGeometry(this.tip.diameter / 2, 8, 8);

      this._flattenBottom(tipEndGeometry);

      this.tipSphere = false;
    }

    tipEndGeometry.rotateX(Math.PI);
    this.tipEnd.mesh.geometry = tipEndGeometry;
  }

  dispose() {
    this.tip.mesh.geometry.dispose();
    this.tipEnd.mesh.geometry.dispose();
    this.supportHeightHandle.geometry.dispose();
    DSSupport.raycastGroup.remove(this.tip.mesh);
    DSSupport.raycastGroup.remove(this.supportHeightHandle);
  }

  _flattenBottom(geometry) {
    geometry.vertices.filter(v => v.y < 0).forEach(v => v.y = 0);
    geometry.verticesNeedUpdate = true;
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
  }

}