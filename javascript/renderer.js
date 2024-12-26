// Set an offset for rendering different objects to prevent them not appearing during walking.
const tileRenderOffset = 1;
const teleporterRenderOffset = 1;
const decorationRenderOffset = 5;
const interactorRenderOffset = 2;

export class Renderer {

    defaultTextureFolderPath = "assets/textures/";
    UItextureFile = "assets/textures/UI/UITextures.json";
    textureMap = {};

    // pixel_bit font file location
    fontFileLocation = "assets/fonts/pixel_bit/pixel_bit.json";
    fontInformationMap = {};
    fontTextureMap = {};

    mapManager;

    transitionOpacity = 0;
    currentlyDoingTransition = false;

    dialogueBoxEnabled = false;
    currentDialogueName = "";
    currentDialogueText = "";

    constructor(canvas, context, tileSize, screenCellWidthAmount, screenCellHeightAmount, player) {
        this.canvas = canvas;
        this.context = context;
        this.tileSize = tileSize;
        this.screenWidth = screenCellWidthAmount;
        this.screenHeight = screenCellHeightAmount;
        this.canvasWidthToCenter = Math.floor(screenCellWidthAmount / 2);
        this.canvasHeightToCenter = Math.floor(screenCellHeightAmount / 2);
        this.player = player;
        
        // Keep pixels sharp.
        this.context.imageSmoothingEnabled = false;
    }

    addMapManager(mapManager) {
        this.mapManager = mapManager;
    }

    clearTextureMemory() {
        this.textureMap = {};
    }

    async loadIntoTextureMemory(texturePath) {
        // Check the texture path exists
        if (!texturePath || texturePath == "" || texturePath == " ") {
            return;
        }

        // Check if the texture has already been loaded into memory
        if (!this.textureMap[texturePath]) {
            const newTexture = new Image();
            newTexture.src = this.defaultTextureFolderPath + texturePath + ".png";
            this.textureMap[texturePath] = newTexture;
        }
    }

    async loadUITextures() {
        
        // Load UI textures.
        const response = await fetch(this.UItextureFile);
        const UITextureData = await response.json();

        for (let texture in UITextureData) {
            const newTexture = new Image();
            newTexture.src = this.defaultTextureFolderPath + UITextureData[texture] + ".png";
            this.textureMap[texture] = newTexture;
        }

        // Load Font texture.
        const fontResponse = await fetch(this.fontFileLocation);
        const fontData = await fontResponse.json();
        this.fontInformationMap[fontData.face] = fontData;

        const fontTexture = new Image();
        fontTexture.src = fontData.imageFile;
        this.fontTextureMap[fontData.face] = fontTexture;
    }

    isObjectWithinCameraView(xPos, yPos, xOffset, yOffset, positiveXOffset, positiveYOffset, renderOffset) {
        if (xPos < xOffset - renderOffset || xPos > positiveXOffset + renderOffset || yPos < yOffset - renderOffset || yPos > positiveYOffset + renderOffset) {
            return false;
        }
        return true;
    }

    drawFrame() {

        if (!this.canvas) {
            return;
        }

        var DPR = window.devicePixelRatio ?? 1;
        this.context.width = window.innerWidth*DPR;
        this.context.height = window.innerHeight*DPR;
        this.context.scale(DPR, DPR);

        // Clear the frame.
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const playerX = this.player.getX();
        const playerY = this.player.getY();

        const playerSubX = this.player.getSubX();
        const playerSubY = this.player.getSubY();

        // Get the coordinates the top left tile on the visible canvas area.
        const xOffset = playerX - this.canvasWidthToCenter;
        const yOffset = playerY - this.canvasHeightToCenter;
        
        // Get the coordinates of the bottom right tile on the visible canvas area.
        const positiveXOffset = playerX + this.canvasWidthToCenter;
        const positiveYOffset = playerY + this.canvasHeightToCenter;

        // Get the different map object arrays.
        var gameMapCells = this.mapManager.getMapCells();
        var gameMapTeleporters = this.mapManager.getMapTeleporters();
        var gameMapDecorations = this.mapManager.getMapDecorations();
        var gameMapInteractors = this.mapManager.getMapInteractors();

        for (var i = 0; i < gameMapCells.length; i++) {

            const cell = gameMapCells[i];

            // Exit the cell array early if all future tiles will be outside of the cameras view.
            if ((cell.x > (positiveXOffset + tileRenderOffset) && cell.y >= (positiveYOffset + tileRenderOffset)) || cell.y > positiveYOffset + tileRenderOffset) {
                break;
            }

            // Determine if the tile falls within the cameras bounds.
            if (!this.isObjectWithinCameraView(cell.x, cell.y, xOffset, yOffset, positiveXOffset, positiveYOffset, tileRenderOffset)) {
                continue;
            }

            // Draw the tile.
            this.drawObject(
                this.textureMap[cell.texturePath], 
                (cell.x - xOffset + playerSubX) * this.tileSize,
                (cell.y - yOffset + playerSubY) * this.tileSize
            );
        }


        // Draw teleporters onto the visible game map.
        for (var i = 0; i < gameMapTeleporters.length; i++) {

            const currentTeleporter = gameMapTeleporters[i];

            // Check the teleporter is visible at all.
            if (currentTeleporter.visible == 0) {
                continue;
            }

            // Check the teleporter is visible on the screen.
            if (!this.isObjectWithinCameraView(currentTeleporter.x, currentTeleporter.y, xOffset, yOffset, positiveXOffset, positiveYOffset, teleporterRenderOffset)) {
                continue;
            }

            var teleporterTexturePath = this.textureMap[currentTeleporter.texturePath];

            // Change the teleporter texture if the player is currently using the teleporter.
            if (currentTeleporter.teleporterType == "door" && currentTeleporter.useTexturePath != "" && this.currentlyDoingTransition == true) {
                teleporterTexturePath = this.textureMap[currentTeleporter.useTexturePath];
            }

            // Draw the teleporter.
            this.drawObject(
                teleporterTexturePath,
                (currentTeleporter.x - xOffset + playerSubX) * this.tileSize,
                (currentTeleporter.y - yOffset + playerSubY) * this.tileSize
            );
        }

        var decorationsInFrontOfPlayer = [];

        // Go through each decoration, and determine if they need to be rendered before or after the player is drawn.
        for (var i = 0; i < gameMapDecorations.length; i++) {

            const currentDecoration = gameMapDecorations[i];

            // Check if the decoration is visible on the canvas.
            if (!this.isObjectWithinCameraView(currentDecoration.x, currentDecoration.y, xOffset, yOffset, positiveXOffset, positiveYOffset, decorationRenderOffset)) {
                continue;
            }

            // Check if the decoration should be infront of player.
            if (currentDecoration.zIndex == 1 || ((currentDecoration.y + currentDecoration.height) > playerY && currentDecoration.zIndex != -1)) {
                decorationsInFrontOfPlayer.push(currentDecoration);
                continue;
            }

            // Draw the decoration.
            this.drawObject(
                this.textureMap[currentDecoration.texturePath],
                (currentDecoration.x - xOffset + playerSubX) * this.tileSize,
                (currentDecoration.y - yOffset + playerSubY) * this.tileSize,
                currentDecoration.width,
                currentDecoration.height
            );
        }

        // Draw all interactors/NPCs behind the player.
        var interactorsInFrontOfPlayer = [];

        for (var i = 0; i < gameMapInteractors.length; i++) {

            const currentInteractor = gameMapInteractors[i];

            // Check if the interactor should be rendered at all.
            if (currentInteractor.visible == 0) {
                continue;
            }

            // Check if the interactor is visible on the canvas.
            if (!this.isObjectWithinCameraView(currentInteractor.x, currentInteractor.y, xOffset, yOffset, positiveXOffset, positiveYOffset, interactorRenderOffset)) {
                continue;
            }

            // Check if the interactor should be drawn in-front of or behind the player.
            if (currentInteractor.y >= playerY) {
                interactorsInFrontOfPlayer.push(currentInteractor);
                continue;
            }

            // TEMP CODE while NPC's cannot move.
            this.drawInteractor(
                currentInteractor.type,
                this.textureMap[currentInteractor.texturePath],
                (currentInteractor.x - xOffset + playerSubX) * this.tileSize,
                (currentInteractor.y - yOffset + playerSubY) * this.tileSize,
                currentInteractor.width,
                currentInteractor.height,
                0,
                this.tileSize * (currentInteractor.orientation || 0),
                currentInteractor.width,
                currentInteractor.height
            );
        }

        
        // Draw player.
        this.drawPlayer();


        // Draw any remaining decorations which should be visible on the screen.
        for (var i = 0; i < decorationsInFrontOfPlayer.length; i++) {

            const currentDecoration = decorationsInFrontOfPlayer[i];

            // Draw the decoration.
            this.drawObject(
                this.textureMap[currentDecoration.texturePath],
                (currentDecoration.x - xOffset + playerSubX) * this.tileSize,
                (currentDecoration.y - yOffset + playerSubY) * this.tileSize,
                currentDecoration.width,
                currentDecoration.height
            );
        }

        // Draw any remaining interactors.
        for (var i = 0; i < interactorsInFrontOfPlayer.length; i++) {

            const currentInteractor = interactorsInFrontOfPlayer[i];

            // TEMP CODE while NPC's cannot move.
            this.drawInteractor(
                currentInteractor.type,
                this.textureMap[currentInteractor.texturePath],
                (currentInteractor.x - xOffset + playerSubX) * this.tileSize,
                (currentInteractor.y - yOffset + playerSubY) * this.tileSize,
                currentInteractor.width,
                currentInteractor.height,
                0,
                this.tileSize * (currentInteractor.orientation || 0),
                currentInteractor.width,
                currentInteractor.height
            );
        }

        // Draw the dialogue box if it is enabled.
        if (this.dialogueBoxEnabled) {
            
            // Draw the dialogue box.
            this.drawObject(this.textureMap["dialogue_box_0"], 0, (this.screenHeight - 3) * this.tileSize, this.screenWidth, 3);
            
            // Set the text formatting styles.
            this.context.font =  `32px pixel`;
            this.context.fillStyle = "red";
            this.context.textBaseline = 'alphabetic';

            // Split the full string of text into individuals words to determine word wrap.
            var words = (this.currentDialogueName + ": " + this.currentDialogueText).split(" ");
            var lines = []
            var currentLine = words[0]

            for (var i = 1; i < words.length; i++) {
                var word = words[i];
                var width = this.context.measureText(currentLine + " " + word).width;

                if (width <= (13 * this.tileSize)) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);

            
            var currentLineLength = 0

            // Display each line of text.
            for (var i = 0; i < lines.length; i++) {

                currentLineLength = 0;

                // Options for testing to ensure that the bitmap font variant matches the vector font variant.
                //this.context.textBaseline = 'top';
                //his.context.fillText(lines[i], this.tileSize, (this.screenHeight - 2) * this.tileSize - 14 + (i * 27));
                //this.context.textBaseline = 'alphabetic';

                // Loop through each character in the font.
                for (var j = 0; j < lines[i].length; j++) {

                    // Get the matching character infomation from the font data.
                    const matchingChar = this.fontInformationMap["pixel_bit"].chars.find((char) => char.id == lines[i][j].charCodeAt());

                    // Draw the font character
                    this.drawFontCharacter(
                        this.fontTextureMap["pixel_bit"],
                        matchingChar.x - matchingChar.xoffset,
                        matchingChar.y,
                        matchingChar.width,
                        matchingChar.height,
                        this.tileSize + currentLineLength,
                        (this.screenHeight - 2) * this.tileSize - 12 + (i * 27) + (matchingChar.yoffset *  2)
                    );

                    // Increase the spacing of the next word
                    currentLineLength += this.context.measureText(lines[i].slice(j, j+1)).width;
                }

            }
        }


        // Draw the screen opacity cover for scene transitions.
        this.context.fillStyle = "rgba(0,0,0," + this.transitionOpacity + ")";
        this.context.fillRect(0, 0, this.screenWidth * this.tileSize, this.screenHeight * this.tileSize);

    }

    drawPlayer() {
        this.context.drawImage(
            this.textureMap[this.player.getTexturePath()],
            (this.tileSize/2) * this.player.getCurrentWalkPose(),
            this.player.getOrientation() * this.tileSize,
            this.tileSize/2,
            this.tileSize,
            this.tileSize * this.canvasWidthToCenter,
            this.tileSize * this.canvasHeightToCenter - this.tileSize,
            this.tileSize,
            this.tileSize*2
        );
    }

    drawObject(texturePath, xPos, yPos, width = 1, height = 1) {
        this.context.drawImage(texturePath, xPos, yPos, this.tileSize * width, this.tileSize * height);
    }

    drawFontCharacter(texturePath, sx, sy, swidth, sheight, xPos, yPos) {
        this.context.drawImage(texturePath, sx, sy, swidth, sheight, xPos, yPos, swidth * 2, sheight * 2);
    }

    drawInteractor(interactorType, texturePath, xPos, yPos, width, height, sx = 0, sy = 0, swidth = width, sheight = height) {

        // Pre=process the width and height variables
        width = width * this.tileSize;
        height = height * this.tileSize;
        swidth = swidth * this.tileSize / 2;
        sheight = sheight * this.tileSize / 2;

        if (interactorType != "NPC") {
            sx = 0;
            sy = 0;
        }
        this.context.drawImage(texturePath, sx, sy, swidth, sheight, xPos, yPos - (height / 2), width, height);
    }

    async startSceneTransition(teleporterObj) {

        this.currentlyDoingTransition = true;

        // Add delay before screen darkening.
        await this.player.sleep(200);

        // Slowly make the screen black.
        for (var i = 0; i < 20; i++) {
            this.transitionOpacity += 0.05;
            await this.player.sleep(20);
        }

        await this.mapManager.loadMapFile(teleporterObj.destination);
        this.player.move(teleporterObj.destinationPos[0], teleporterObj.destinationPos[1], teleporterObj.orientation, true);

        // Slowly reveal the new map scene.
        for (var i = 0; i < 20; i++) {
            this.transitionOpacity -= 0.05;
            await this.player.sleep(20);
        }

        this.currentlyDoingTransition = false;
        this.player.unlockControlsAfterTransition();
    }

    toggleDialogueBox(option = null) {

        if (option == null) {
            this.dialogueBoxEnabled = !this.dialogueBoxEnabled;
        } else {
            this.dialogueBoxEnabled = option;
        }
    }

    showDialogue(name, text) {
        this.currentDialogueName = name;
        this.currentDialogueText = text;
    }

    loadFont() {
        
    }
}