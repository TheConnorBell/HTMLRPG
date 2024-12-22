export class InputController {

    keybinds = {
        "left":"ArrowLeft",
        "right":"ArrowRight",
        "up":"ArrowUp",
        "down":"ArrowDown",
        "interact":"e",
        "menu":"Tab"
    };

    lastNonMovementButtonPress = {};

    movementInputs = {};
    otherInputs = {};

    movementInputsLocked = false;
    
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
                this.movementInputs[event.key] = -1;

            // Check if the input has been released yet.
            } else if (this.otherInputs[event.key] && this.otherInputs[event.key] != -1) {
                this.otherInputs[event.key] = -1;
            }
        });
    }

    lockMovementInputs(lock) {
        this.movementInputsLocked = lock;
    }

    areMovementInputsLocked() {
        return this.movementInputsLocked;
    }

    getActiveMovementInputs(option = null) {
        if (option == null) {
            return this.movementInputs;
        } else {
            return this.movementInputs[option];
        }
        
    }

    checkInputs() {

        // Check if movement is currently allowed.
        if (this.movementInputsLocked || (this.player.getSubX() != 0 && this.player.getSubY() != 0) || this.player.isPlayerUsingTeleporter()) {
            return;
        }

        // Check if the each movement keybind is being used.
        if (this.movementInputs[this.keybinds["left"]] && this.movementInputs[this.keybinds["left"]] != -1) {
            // Return the movement values to the main file so they can be passed along to the player for movement.
            this.player.doMovementProcess(-1, 0, 0, this.movementInputs[this.keybinds["left"]]);
            return;

        } else if (this.movementInputs[this.keybinds["right"]] && this.movementInputs[this.keybinds["right"]] != -1) {
            this.player.doMovementProcess(1, 0, 1, this.movementInputs[this.keybinds["right"]]);
            return;

        } else if (this.movementInputs[this.keybinds["up"]] && this.movementInputs[this.keybinds["up"]] != -1) {
            this.player.doMovementProcess(0, -1, 2, this.movementInputs[this.keybinds["up"]]);
            return;
            
        } else if (this.movementInputs[this.keybinds["down"]] && this.movementInputs[this.keybinds["down"]] != -1) {
            this.player.doMovementProcess(0, 1, 3, this.movementInputs[this.keybinds["down"]]);
            return;
        }

        // Check other inputs which should have a lower priority then movement.
        if (this.otherInputs[this.keybinds["interact"]] && this.otherInputs[this.keybinds["interact"]] != -1 && this.otherInputs[this.keybinds["interact"]] != this.lastNonMovementButtonPress[this.keybinds["interact"]]) {
            this.lastNonMovementButtonPress[this.keybinds["interact"]] = this.otherInputs[this.keybinds["interact"]];
            this.player.doInteractionProcess();
        }


    }
}