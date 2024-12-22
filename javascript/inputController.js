export class InputController {

    keybinds = {
        "left":"ArrowLeft",
        "right":"ArrowRight",
        "up":"ArrowUp",
        "down":"ArrowDown",
        "interact":"e",
        "menu":"Tab"
    }

    movementInputs = {};
    otherInputs = {};

    inputsLocked = false;
    
    constructor(player) {

        this.player = player;

        document.addEventListener('keydown', (event) => {

            // Check if the user is pressing down a keybinded button.
            for (let action in this.keybinds) {

                // Check if the key press was one of the movement keybinds.
                if (["left","right","up","down"].includes(action) && this.keybinds[action] == event.key) {
                    
                    // Check if the key is being held down.
                    if (!this.movementInputs[event.key] || this.movementInputs[event.key] == -1) {
                        this.movementInputs[event.key] = Date.now();
                    }    
                } else {
                    // Check if the key is being held down.
                    if (!this.otherInputs[event.key] || this.otherInputs[event.key] == -1) {
                        this.otherInputs[event.key] = Date.now();
                    }    
                }
            }
        });
    
        document.addEventListener('keyup', (event) => {
    
            // Check that the key has not already been released.
            if (this.movementInputs[event.key] && this.movementInputs[event.key] != -1) {
    
                // Check if the key was quickly tapped.
                //if (tapRotationDuration > Date.now() - this.movementInputs[event.key]) {
                    //tapRotation(event.key);
                //}
                this.movementInputs[event.key] = -1;

            // Check if the input has been released yet.
            } else if (this.otherInputs[event.key] && this.otherInputs[event.key] != -1) {
                this.otherInputs[event.key] = -1;
            }
        });
    }

    lockInputs(lock) {
        this.inputsLocked = lock;
    }

    areInputsLocked() {
        return this.inputsLocked;
    }

    getActiveMovementInputs(option = null) {
        if (option == null) {
            return this.movementInputs;
        } else {
            return this.movementInputs[option];
        }
        
    }

    checkMovement() {

        // Check if movement is currently allowed.
        if (this.inputsLocked || (this.player.getSubX() != 0 && this.player.getSubY() != 0)) {
            return;
        }

        // Check if the each movement keybind is being used.
        if (this.movementInputs[this.keybinds["left"]] && this.movementInputs[this.keybinds["left"]] != -1) {
            // Return the movement values to the main file so they can be passed along to the player for movement.
            return [-1, 0, 0, this.movementInputs[this.keybinds["left"]]];

        } else if (this.movementInputs[this.keybinds["right"]] && this.movementInputs[this.keybinds["right"]] != -1) {
            return [1, 0, 1, this.movementInputs[this.keybinds["right"]]];

        } else if (this.movementInputs[this.keybinds["up"]] && this.movementInputs[this.keybinds["up"]] != -1) {
            return [0, -1, 2, this.movementInputs[this.keybinds["up"]]];
            
        } else if (this.movementInputs[this.keybinds["down"]] && this.movementInputs[this.keybinds["down"]] != -1) {
            return [0, 1, 3, this.movementInputs[this.keybinds["down"]]];
        }


        // Do a check for if startTime + 120Ms before doing any movement if facing same direction in the player move function, here just determines if that fuycntion is called for what key.
    }
}