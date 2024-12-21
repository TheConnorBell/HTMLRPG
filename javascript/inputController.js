const tapRotationDuration = 120; // ms

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
    
    constructor() {

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
                if (tapRotationDuration > Date.now() - this.movementInputs[event.key]) {
                    tapRotation(event.key);
                }
                this.movementInputs[event.key] = -1;

            // Check if the input has been released yet.
            } else if (this.otherInputs[event.key] && this.otherInputs[event.key] != -1) {
                this.otherInputs[event.key] = -1;
            }
        });
    }

    toggleInputLock() {
        this.inputsLocked = !this.inputsLocked;
    }

    areInputsLocked() {
        return this.inputsLocked;
    }

    getActiveMovementInputs() {
        return this.movementInputs;
    }
}