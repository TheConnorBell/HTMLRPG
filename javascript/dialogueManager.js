const dialogueSourcePathRoot = "assets/dialogue/";

export class DialogueManager {

    loadedDialogue = {};

    currentDialogueFile = null;
    currentDialoguePoint = null;

    currentDialogueTextStep = 0;

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

    progressDialogue(dialogueFilePath, dialogueStartPoint) {
        
        // Set the dialogue file path if it is different.
        if (this.currentDialogueFile == null || this.currentDialogueFile != dialogueFilePath) {
            this.currentDialogueFile = dialogueFilePath;
        }

        // Set the dialogue start point if it is different.
        if (this.currentDialoguePoint == null || this.currentDialoguePoint != dialogueStartPoint) {
            this.currentDialoguePoint == dialogueStartPoint
        }

        // Find the root of the current dialogue point in the dialogue file.
        var dialogeTreeOrigin = this.loadedDialogue[dialogueFilePath].dialogue.find((branch) => branch.id == dialogueStartPoint);

        // Check if the next dialogue stage needs to be moved onto.
        if (this.currentDialogueTextStep >= dialogeTreeOrigin.text.length) {

            // Check if the player has reached the end of the dialogue and will now just repeat the same text.
            if (dialogeTreeOrigin.nextID != "") {
                this.currentDialoguePoint = dialogeTreeOrigin.nextID;
                this.currentDialogueTextStep = 0;
                dialogeTreeOrigin = this.loadedDialogue[dialogueFilePath].dialogue.find((branch) => branch.id == dialogeTreeOrigin.nextID);
            } else {
                this.currentDialogueTextStep--;
            }
        }

        // Set the dialogue variables to return.
        var dialogue = {
            "name":null,
            "text":null,
            "dialoguePointID":this.currentDialoguePoint
        }

        if (!this.doesPlayerMeetRequirements(dialogeTreeOrigin.req)) {
            // Display the requirement not met dialogue.
            console.log(dialogeTreeOrigin.notMetReqText[this.currentDialogueTextStep].name + ": " + dialogeTreeOrigin.notMetReqText[this.currentDialogueTextStep].text);

            dialogue.name = dialogeTreeOrigin.notMetReqText[this.currentDialogueTextStep].name;
            dialogue.text = dialogeTreeOrigin.notMetReqText[this.currentDialogueTextStep].text;

        } else {
            // Display the dialogue.
            console.log(dialogeTreeOrigin.text[this.currentDialogueTextStep].name + ": " + dialogeTreeOrigin.text[this.currentDialogueTextStep].text);

            dialogue.name = dialogeTreeOrigin.text[this.currentDialogueTextStep].name;
            dialogue.text = dialogeTreeOrigin.text[this.currentDialogueTextStep].text;
        }

        this.currentDialogueTextStep++;

        return dialogue;
    
    }

    doesPlayerMeetRequirements(requirements) {
        if (requirements == "") {
            return true;

        // TODO proper dialogue requirement checking when functionality added to game.
        } else {
            return false;
        }
    }
}