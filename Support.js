'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DSSupport = function () {
    _createClass(DSSupport, null, [{
        key: 'init',
        value: function init(scene, material, hidingMaterial) {
            DSSupportscene = scene;
            DSSupportmaterial = material;
            DSSupporthidingMaterial = hidingMaterial;
        }
    }]);

    function DSSupport(contactPosition, tipDirection, presetName) {
        var shaftDiameter = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.8;
        var tipLength = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 3;
        var tipDiameter = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0.3;
        var group = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
        var bottomDiameter = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 6;

        _classCallCheck(this, DSSupport);

        this.contactPosition = contactPosition;
        this.group = group;
        this.presetName = presetName;

        this.bottom = {};
        this.shaft = {};
        this.shaftbase = {};
        this.tip = {};
        this.joint = {};
        this.tipEnd = {};

        this.bottom.diameter = bottomDiameter;

        this.shaft.diameter = shaftDiameter;

        this.tip.diameter = tipDiameter;
        this.tip.direction = tipDirection;
        this.tip.length = tipLength;

        this.createMeshes();
        this.setContactPosition();
    }

    _createClass(DSSupport, [{
        key: 'createMeshes',
        value: function createMeshes() {
            var bottomGeometry = new THREE.CylinderGeometry(this.bottom.diameter / 2, this.bottom.diameter / 2, 1, 8);
            bottomGeometry.translate(0, 0.5, 0); // Origo at baseplate contact
            this.bottom.mesh = new THREE.Mesh(bottomGeometry, DSSupporthidingMaterial);
            DSSupportscene.add(this.bottom.mesh);

            var shaftBaseGeometry = new THREE.CylinderGeometry(this.shaft.diameter / 2, this.shaft.diameter / 2 + 1, 0.5, 8);
            shaftBaseGeometry.translate(0, 1.25, 0); // Origo at bottom contact
            this.shaftbase.mesh = new THREE.Mesh(shaftBaseGeometry, DSSupporthidingMaterial);
            this.bottom.mesh.add(this.shaftbase.mesh);

            var shaftGeometry = new THREE.CylinderGeometry(this.shaft.diameter / 2, this.shaft.diameter / 2, 1, 8);
            shaftGeometry.translate(0, 0.5, 0); // Origo at its base
            this.shaft.mesh = new THREE.Mesh(shaftGeometry, DSSupporthidingMaterial);
            this.shaftbase.mesh.add(this.shaft.mesh);

            var jointGeometry = new THREE.SphereGeometry(this.shaft.diameter / 2, 8, 8);
            this._flattenBottom(jointGeometry);
            this.joint.mesh = new THREE.Mesh(jointGeometry, DSSupporthidingMaterial);
            DSSupportscene.add(this.joint.mesh);

            var tipGeometry = new THREE.CylinderGeometry(this.shaft.diameter / 2, this.tip.diameter / 2, 1, 8);
            tipGeometry.translate(0, 0.5, 0); // Origo at touch tip
            this.tip.mesh = new THREE.Mesh(tipGeometry, DSSupportmaterial);
            DSSupportscene.add(this.tip.mesh);

            var tipEndGeometry = new THREE.SphereGeometry(this.tip.diameter / 2, 8, 8);
            this._flattenBottom(tipEndGeometry);
            tipEndGeometry.rotateX(Math.PI);
            this.tipEnd.mesh = new THREE.Mesh(tipEndGeometry, DSSupportmaterial);
            this.tip.mesh.add(this.tipEnd.mesh);

            this.bottom.mesh.userData.supportType = 'b';
            this.shaftbase.mesh.userData.supportType = 'sb';
            this.shaft.mesh.userData.supportType = 's';
            this.joint.mesh.userData.supportType = 'j';
            this.tip.mesh.userData.supportType = 't';
            this.tipEnd.mesh.userData.supportType = 'te';

            this.bottom.mesh.userData.support = this;
            this.shaftbase.mesh.userData.support = this;
            this.shaft.mesh.userData.support = this;
            this.joint.mesh.userData.support = this;
            this.tip.mesh.userData.support = this;
            this.tipEnd.mesh.userData.support = this;
        }
    }, {
        key: 'setContactPosition',
        value: function setContactPosition() {
            // Calculate tip
            var v = this.tip.direction.clone().normalize().multiplyScalar(this.tip.length);
            // Check for tip being too horizontal
            if (-v.y < this.tip.length / 2) {
                v.y = -this.tip.length / 2;
            }
            this.tip.mesh.scale.y = this.tip.length;
            this.tipEnd.mesh.scale.y = 1 / this.tip.length;
            var axis = new THREE.Vector3(0, 1, 0);
            this.tip.mesh.quaternion.setFromUnitVectors(axis, v.clone().normalize());
            this.tip.mesh.position.copy(this.contactPosition);
            this.tip.mesh.updateMatrixWorld();

            // Calculate shaft
            var tipBaseWorldPos = new THREE.Vector3(0, 1, 0);
            this.tip.mesh.localToWorld(tipBaseWorldPos);
            this.bottom.mesh.position.set(tipBaseWorldPos.x, 0, tipBaseWorldPos.z);
            this.joint.mesh.position.copy(tipBaseWorldPos);
            this.shaft.mesh.scale.y = tipBaseWorldPos.y - 1.5;
            this.shaft.mesh.position.y = 1.5;
            this.joint.mesh.position.y = tipBaseWorldPos.y;
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.bottom.mesh.geometry.dispose();
            this.shaftbase.mesh.geometry.dispose();
            this.shaft.mesh.geometry.dispose();
            this.joint.mesh.geometry.dispose();
            this.tip.mesh.geometry.dispose();
            this.tipEnd.mesh.geometry.dispose();
            DSSupportscene.remove(this.bottom.mesh);
            DSSupportscene.remove(this.shaftbase.mesh);
            DSSupportscene.remove(this.shaft.mesh);
            DSSupportscene.remove(this.joint.mesh);
            DSSupportscene.remove(this.tip.mesh);
            DSSupportscene.remove(this.tipEnd.mesh);
            // TODO: remove from renderer.renderLists otherwise there'll be memory leak
        }
    }, {
        key: '_flattenBottom',
        value: function _flattenBottom(geometry) {
            for (var i = 0; i < geometry.vertices.length; i++) {
                var v = geometry.vertices[i];
                if (v.y < 0) v.y = 0;
            }
            geometry.verticesNeedUpdate = true;
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
        }
    }]);

    return DSSupport;
}();

DSSupport.material = null;
export default DSSupport;