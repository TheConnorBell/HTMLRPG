// Set an offset for rendering different objects to prevent them not appearing during walking.
const tileRenderOffset = 1;
const teleporterRenderOffset = 1;
const decorationRenderOffset = 5;
const interactorRenderOffset = 2;

export class Renderer {

    defaultTextureFolderPath = "assets/textures/"
    textureMap = {};

    mapManager;

    constructor(canvas, context, tileSize, screenCellWidthAmount, screenCellHeightAmount, player) {
        this.canvas = canvas;
        this.context = context;
        this.tileSize = tileSize;
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

    loadIntoTextureMemory(texturePath) {
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

    isObjectWithinCameraView(xPos, yPos, xOffset, yOffset, positiveXOffset, positiveYOffset, renderOffset) {
        if (xPos < xOffset - renderOffset || xPos > positiveXOffset + renderOffset || yPos < yOffset - renderOffset || yPos > positiveYOffset + renderOffset) {
            return false;
        }
        return true;
    }

    drawFrame(currentlyDoingTransition) {

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
            if (currentTeleporter.teleporterType == "door" && currentTeleporter.useTexturePath != "" && currentlyDoingTransition == true) {
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
}