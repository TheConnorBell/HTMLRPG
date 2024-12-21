// Set an offset for rendering different objects to prevent them not appearing during walking.
const tileRenderOffset = 1;
const teleporterRenderOffset = 1;
const decorationRenderOffset = 5;
const interactorRenderOffset = 2;

export class Renderer {

    defaultTextureFolderPath = "assets/textures/"
    textureMap = {};

    constructor(canvas, context, tileSize, screenCellWidthAmount, screenCellHeightAmount) {
        this.canvas = canvas;
        this.context = context;
        this.tileSize = tileSize;
        this.canvasWidthToCenter = Math.floor(screenCellWidthAmount / 2);
        this.canvasHeightToCenter = Math.floor(screenCellHeightAmount / 2);
        
        // Keep pixels sharp.
        this.context.imageSmoothingEnabled = false;
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

    drawFrame(gameMapCells, gameMapTeleporters, gameMapDecorations, gameMapInteractors, player, mapWidth, mapHeight, currentlyDoingTransition) {

        // Clear the frame.
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const playerX = player.getX();
        const playerY = player.getY();

        const playerSubX = player.getSubX();
        const playerSubY = player.getSubY();

        // Get the coordinates the top left tile on the visible canvas area.
        const xOffset = playerX - this.canvasWidthToCenter;
        const yOffset = playerY - this.canvasHeightToCenter;
        
        // Get the coordinates of the bottom right tile on the visible canvas area.
        const positiveXOffset = playerX + this.canvasWidthToCenter;
        const positiveYOffset = playerY + this.canvasHeightToCenter;

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

            // Check the teleporter is visible on the screen.
            if (!this.isObjectWithinCameraView(currentTeleporter.x, currentTeleporter.y, xOffset, yOffset, positiveXOffset, positiveYOffset, teleporterRenderOffset)) {
                continue;
            }

            var teleporterTexturePath = this.textureMap[currentTeleporter.texturePath];

            // Change the teleporter texture if the player is currently using the teleporter.
            if (currentTeleporter.teleporterType == "door" && currentTeleporter.useTexturePath != "" && currentlyDoingTransition) {
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
        
        //renderCellOffset = 3;
        var maximumXRender = 1;
        var minimumXRender = 10;
        var maximumYRender = 1;
        var minimumYRender = 10;

        // Go through each decoration, and determine if they need to be rendered before or after the player is drawn.
        for (var i = 0; i < gameMapDecorations.length; i++) {

            const currentDecoration = gameMapDecorations[i];

            // Check if the decoration should be infront of player.
            if (currentDecoration.zIndex == 1 || ((currentDecoration.y + currentDecoration.height - 1) > player.getY() && currentDecoration.zIndex != -1)) {
                decorationsInFrontOfPlayer.push(currentDecoration);
                continue;
            }

            // Check the decoration is visible on the screen.
            if (currentDecoration.visible == 0 || currentDecoration.x > maximumXRender || currentDecoration.x < minimumXRender || currentDecoration.y > maximumYRender || currentDecoration.y < minimumYRender) {
                continue;
            }

            this.context.drawImage(this.textureMap[currentDecoration.texturePath], Math.floor(((currentDecoration.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentDecoration.y - yOffset) + player.getSubY()) * this.tileSize), this.tileSize*currentDecoration.width, this.tileSize*currentDecoration.height);
        }

        // Draw all interactors/NPCs behind the player.
        var interactorsInFrontOfPlayer = [];

        for (var i = 0; i < gameMapInteractors.length; i++) {
            const currentInteractor = gameMapInteractors[i];

            // Check if the interactor should be infront of or behind the player.
            if (player.getY() > currentInteractor.y) {
                if (this.textureMap[currentInteractor.texturePath]) {
                    // Draw Interactor sprite.
                    this.context.drawImage(this.textureMap[currentInteractor.texturePath], 0, this.tileSize * currentInteractor.orientation, this.tileSize/2, this.tileSize, Math.floor(((currentInteractor.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentInteractor.y - yOffset) - 1 + player.getSubY()) * this.tileSize), this.tileSize, this.tileSize*2);
                } else {
                    this.context.fillStyle = "#17babf";
                    this.context.fillRect(Math.floor(((currentInteractor.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentInteractor.y - yOffset) + player.getSubY()) * this.tileSize), this.tileSize, this.tileSize);
                }
            } else {
                // Move the interactor the the array to draw infront of the player.
                interactorsInFrontOfPlayer.push(currentInteractor);
            }
        }

        
        // Draw player.
        this.drawPlayer(player);

        // Draw any remaining decorations.
        for (var i = 0; i < decorationsInFrontOfPlayer.length; i++) {

            const currentDecoration = decorationsInFrontOfPlayer[i];

            // Check the decoration is visible on the screen.
            if (currentDecoration.visible == 0 || currentDecoration.x > maximumXRender || currentDecoration.x < minimumXRender || currentDecoration.y > maximumYRender || currentDecoration.y < minimumYRender) {
                continue;
            }

            this.context.drawImage(this.textureMap[currentDecoration.texturePath], Math.floor(((currentDecoration.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentDecoration.y - yOffset) + player.getSubY()) * this.tileSize), this.tileSize*currentDecoration.width, this.tileSize*currentDecoration.height);
        
        }

        // Draw any remaining interactors.
        for (var i = 0; i < interactorsInFrontOfPlayer.length; i++) {

            const currentInteractor = interactorsInFrontOfPlayer[i];

            if (this.textureMap[currentInteractor.texturePath]) {
                // Draw Interactor sprite.
                this.context.drawImage(this.textureMap[currentInteractor.texturePath], 0, this.tileSize * currentInteractor.orientation, this.tileSize/2, this.tileSize, Math.floor(((currentInteractor.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentInteractor.y - yOffset) - 1 + player.getSubY()) * this.tileSize), this.tileSize, this.tileSize*2);
            } else {
                this.context.fillStyle = "#17babf";
                this.context.fillRect(Math.floor(((currentInteractor.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentInteractor.y - yOffset) + player.getSubY()) * this.tileSize), this.tileSize, this.tileSize);
            }
        }

    }

    drawPlayer(player) {
        this.context.drawImage(this.textureMap[player.getTexturePath()], ((this.tileSize/2) * player.getCurrentWalkPose()), (player.getOrientation() * this.tileSize), this.tileSize/2, this.tileSize, this.tileSize * this.canvasWidthToCenter, this.tileSize * this.canvasHeightToCenter - this.tileSize, this.tileSize, this.tileSize*2);
    }

    drawObject(texturePath, xPos, yPos, width = 1, height = 1) {
        this.context.drawImage(texturePath, xPos, yPos, this.tileSize * width, this.tileSize * height);
    }

    drawCharacter() {

    }
}