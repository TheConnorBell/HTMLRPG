const amountOfStepsBetweenFrameSwaps = 4;
const tapRotationDuration = 120; // ms

const movementStepAmount = 8;
const movementTime = 250; // ms

export class Player {

    xSubPositionValue = 0;
    ySubPositionValue = 0;

    currentlyMoving = false;

    lastLeg = "left";
    currentlyStepping = false;
    currentStepCount = 0;
    amountOfStepsBetweenFrameSwaps = 0;

    inputController = null;
    usingTeleporter = false;

    constructor(texturePath, xPos, yPos, orientation) {
        this.texturePath = texturePath;
        this.x = xPos;
        this.y = yPos;
        this.orientation = orientation; // Left=0, Right=1, Up=2, Down=3.
    }

    addInputController(inputController) {
        this.inputController = inputController;
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

    async doMovementProcess(xIncrease, yIncrease, orientation, keyStartPushTime, lockControls, cellAtDestination = null, teleporterAtDestination = null, interactorAtDestination = null) {

        // Return if the player is already moving.
        if (this.currentlyMoving) {
            return;
        }

        // Rotate the player if they are not already facing that direction.
        if (this.orientation != orientation && keyStartPushTime + tapRotationDuration > Date.now()) {
            this.move(0, 0, orientation);
            this.currentlyMoving = true;
            await this.sleep(tapRotationDuration);
            this.currentlyMoving = false;
            return;
        }

        // Return if there is no cell for the player to walk on to or the cell prevents walking in this direction.
        if (cellAtDestination == null || cellAtDestination.walkable[orientation] == 0) {
            return;
        }

        // Return if there is a teleporter at the destination and it is not walkable.
        if (teleporterAtDestination && teleporterAtDestination.walkable[orientation] == 0) {
            return;
        }

        // Return if there is a collidable interactor at the destination.
        if (interactorAtDestination && interactorAtDestination.collidable == 1) {
            return;
        }

        // Do different movement steps depending on if there is a teleporter or not.
        if (teleporterAtDestination && teleporterAtDestination.enabled) {
            // If the player is walking into a teleporter
            this.usingTeleporter = true;
            if (this.inputController) {
                this.inputController.lockInputs(true);
            }
            

        }

        this.currentlyMoving = true;

        this.move(xIncrease, yIncrease, orientation);
        await this.sleep(200);

        this.currentlyMoving = false;

    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}