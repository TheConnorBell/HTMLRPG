const dialogueSourcePathRoot = "assets/dialogue/";

export class DialogueManager {

    loadedDialogue = {};

    constructor() {

    }

    async clearLoadedDialogue() {
        this.loadedDialogue = {};
    }

    async loadDialogue(dialogeFilePath) {
        const response = await fetch(dialogueSourcePathRoot + dialogeFilePath + ".json");
        const dialogueData = await response.json();

        this.loadedDialogue[dialogeFilePath] = dialogueData;
    }

    async progressDialogue() {
        
    }
}