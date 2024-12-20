const amountOfStepsBetweenFrameSwaps = 4;

export class Player {

    xSubPositionValue = 0;
    ySubPositionValue = 0;

    lastLeg = "left";
    currentlyStepping = false;
    currentStepCount = 0;
    amountOfStepsBetweenFrameSwaps = 0;

    constructor(texturePath, xPos, yPos, orientation) {
        this.texturePath = texturePath;
        this.x = xPos;
        this.y = yPos;
        this.orientation = orientation; // Left=0, Right=1, Up=2, Down=3.
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
        
        this.currentStepCount++;

        // Update which leg is being stepped with.
        if (this.currentStepCount >= amountOfStepsBetweenFrameSwaps) {
            this.currentStepCount = 0;
            // If the character should return to the neutral stage.
            if (this.currentlyStepping) {
                this.currentlyStepping = false;
                return 0;

            // If the character is in the neutral pose and last stepped with their left leg.
            } else if (this.lastLeg == "left") {
                this.lastLeg = "right";
                this.currentlyStepping = true;
                return 1;

            // If this character is in the neutral pose and last stepped with their right leg.
            } else if (this.lastLeg == "right") {
                this.lastLeg = "left";
                this.currentlyStepping = true;
                return 2;
            }
        }
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
        
        this.currentStepCount = 0;
    }

    resetSubPosition() {
        this.xSubPositionValue = 0;
        this.ySubPositionValue = 0;
    }

    getCurrentWalkPose() {

        // Return the default pose if the player is stationary
        if (this.xSubPositionValue == 0 && this.ySubPositionValue == 0) {
            return 0;
        } else if (!this.currentlyStepping) {
            return 0;
        } else if (this.currentlyStepping && this.lastLeg == "left") {
            return 1;
        } else if (this.currentlyStepping && this.lastLeg == "right") {
            return 2;
        }
                
    }
}