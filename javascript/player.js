export class Player {

    xSubPositionValue = 0;
    ySubPositionValue = 0;

    constructor(texturePath, xPos, yPos, orientation) {
        this.texturePath = texturePath;
        this.x = xPos;
        this.y = yPos;
        this.orientation = orientation;
    }

    setTexturePath(newPath) {
        this.texturePath = newPath;
    }

    getTexturePath() {
        return this.texturePath;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getSubX() {
        return this.xSubPositionValue;
    }

    getSubY() {
        return this.ySubPositionValue;
    }

    getOrientation() {
        return this.orientation;
    }

    subMove(xIncrease, yIncrease, orientation) {
        this.xSubPositionValue += xIncrease;
        this.ySubPositionValue += yIncrease;
        this.orientation = orientation;
    }

    move(xIncrease, yIncrease, orientation, isTeleportation = false) {
        if (isTeleportation) {
            this.x = xIncrease;
            this.y = yIncrease;
            this.orientation = orientation;

        } else {
            this.x += xIncrease;
            this.y += yIncrease;
            this.orientation = orientation;
        }
    }

    resetSubPosition() {
        this.xSubPositionValue = 0;
        this.ySubPositionValue = 0;
    }
}