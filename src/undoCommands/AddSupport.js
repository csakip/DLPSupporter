import DSSupport from "../DSSupport";

class AddSupport {
    constructor(history, supports, contactPosition, tipDirection, presetName, shaftDiameter = 0.8, tipLength = 3, tipDiameter = 0.3, group = 0, bottomDiameter = 6) {
        const s = new DSSupport(contactPosition, tipDirection, presetName, shaftDiameter, tipLength, tipDiameter, group, bottomDiameter);
        supports.push(s);
        this.supportId = s.id;
        history.push(this);
    }

    revert(supports) {
        supports.lenght -= 1;
    }
}