'use strict';

export default class DSCameraControls {
  constructor(scene, orbitControls, sidePanelWidth, render) {
    this.scene = scene;
    this.orbitControls = orbitControls;
    this.cameraHomePosition = new THREE.Vector3(-50, 100, 80);
    this.cameraHomeLookat = new THREE.Vector3(0, 30, 0);
    this.cameraBackupPosition = new THREE.Vector3().copy(this.cameraHomePosition);
    this.cameraBackupLookat = new THREE.Vector3().copy(this.cameraHomeLookat);
    this.animateTween = 0;
    this.sidePanelWidth = sidePanelWidth;
    this.render = render;
    this.setupCamera();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(60, (window.innerWidth - this.sidePanelWidth) / window.innerHeight, 1, 1000);
    this.camera.position.copy(this.cameraHomePosition);
    this.scene.add(this.camera);
  }

  homeCamera() {
    if (this.animateTween === 0) {
      if (this.closeEnough(this.cameraHomePosition, this.camera.position) && this.closeEnough(this.cameraHomeLookat, this.orbitControls.target)) {
        if (this.closeEnough(this.cameraHomePosition, this.cameraBackupPosition) && this.closeEnough(this.cameraHomeLookat, this.cameraBackupLookat)) return; // it is currently looking at home, go back to previous
        //camera.position.copy(cameraBackupPosition);
        //orbitControls.target.copy(cameraBackupLookat);

        this.tweenCamera(this.camera.position, this.cameraBackupPosition);
        this.tweenCamera(this.orbitControls.target, this.cameraBackupLookat);
      } else {
        // go home, save old pos
        this.cameraBackupPosition.copy(this.camera.position);
        this.cameraBackupLookat.copy(this.orbitControls.target); //camera.position.copy(cameraHomePosition);
        //orbitControls.target.copy(cameraHomeLookat);

        this.tweenCamera(this.camera.position, this.cameraHomePosition);
        this.tweenCamera(this.orbitControls.target, this.cameraHomeLookat);
      }

      this.updateTween();
    }
  }

  tweenCamera(what, to) {
    this.animateTween++;
    this.orbitControls.enabled = false;
    new TWEEN.Tween(what).to(to, 400).easing(TWEEN.Easing.Cubic.InOut).onUpdate(() => {
      this.orbitControls.update();
      this.render();
    }).onComplete(() => {
      this.orbitControls.enabled = true;
      this.animateTween--;
    }).start();
  }

  updateTween() {
    if (this.animateTween > 0) {
      requestAnimationFrame(this.updateTween.bind(this));
      TWEEN.update();
    }
  }

  manhattanDistance(v1, v2) {
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(v1.z - v2.z);
  }

  closeEnough(v1, v2) {
    return this.manhattanDistance(v1, v2) < 0.001;
  }

}