export class Renderer {

    defaultTextureFolderPath = "assets/textures/"
    textureMap = {};

    constructor(canvas, context, tileSize, screenCellWidthAmount, screenCellHeightAmount) {
        this.canvas = canvas;
        this.context = context;
        this.tileSize = tileSize;
        this.screenCellWidthAmount = screenCellWidthAmount;
        this.screenCellHeightAmount = screenCellHeightAmount;
        
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

    drawFrame(gameMapCells, gameMapTeleporters, gameMapDecorations, gameMapInteractors, player, mapWidth, mapHeight, currentlyDoingTransition) {

        // Clear the frame.
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Get the offset the canvas has from the centre of the canvas screen.
        const xOffset = Math.floor(player.getX()) - Math.floor(this.screenCellWidthAmount / 2);
        const yOffset = Math.floor(player.getY()) - Math.floor(this.screenCellHeightAmount / 2);

        const playerX = player.getSubX();
        const playerY = player.getSubY();

        for (var i = 0; i < gameMapCells.length; i++) {
            const cell = gameMapCells[i];

            const mapX = cell.x - xOffset;
            const mapY = cell.y - yOffset;

            const tileOffset = 1;

            // Determine if the tile should be rendered by checking that it is within view of the camera.
            if (mapX < -tileOffset || mapX >= mapWidth + tileOffset || mapY < -tileOffset || mapY >= mapHeight + tileOffset) {
                continue;
            }

            this.drawTile(this.textureMap[cell.texturePath], Math.floor((mapX + playerX) * this.tileSize), Math.floor((mapY + playerY) * this.tileSize));
        }

        // Draw each cell visible on screen.
        for (var y = -1; y < this.screenCellHeightAmount + 1; y++) {
            for (var x = -1; x < this.screenCellWidthAmount + 1; x++) {
                continue;

                // Get the tile position based on screen offset.
                const mapX = xOffset + x;
                const mapY = yOffset + y;

                // Determine if the tile should be rendered by checking that it is within view of the camera.
                if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight) {
                    continue;
                }

                const cell = gameMapCells[((mapY*mapWidth)+mapX)];
                const tex = this.textureMap[cell.texturePath];

                // Draw the current tile at the correct position with the correct scale.
                //this.context.drawImage(tex, Math.floor((x + playerX) * this.tileSize), Math.floor((y + playerY) * this.tileSize), this.tileSize, this.tileSize);
                this.drawTile(this.textureMap[cell.texturePath], Math.floor((x + playerX) * this.tileSize), Math.floor((y + playerY) * this.tileSize));
            }
        }

        var renderCellOffset = 1;
        var maximumXRender = (player.getX() + Math.floor(this.screenCellWidthAmount / 2) + renderCellOffset);
        var minimumXRender = (player.getX() - Math.floor(this.screenCellWidthAmount / 2) - renderCellOffset);
        var maximumYRender = (player.getY() + Math.floor(this.screenCellHeightAmount / 2) + renderCellOffset);
        var minimumYRender = (player.getY() - Math.floor(this.screenCellHeightAmount / 2) - renderCellOffset);
        // Default teleporter fill colour.
        this.context.fillStyle = "#15d445";

        // Draw teleporters onto the visible game map.
        for (var i = 0; i < gameMapTeleporters.length; i++) {

            const currentTeleporter = gameMapTeleporters[i];

            // Check the teleporter is visible on the screen.
            if (currentTeleporter.visible == 0 || currentTeleporter.x > maximumXRender || currentTeleporter.x < minimumXRender || currentTeleporter.y > maximumYRender || currentTeleporter.y < minimumYRender) {
                continue;
            }

            // Draw teleporters using the correct/no texture.
            if ((currentTeleporter.textureType != "" && !currentlyDoingTransition) || (currentTeleporter.teleporterType == "hole" && currentTeleporter.textureType != "")) {
    
                this.context.drawImage(this.textureMap[currentTeleporter.texturePath], Math.floor(((currentTeleporter.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentTeleporter.y - yOffset) + player.getSubY()) * this.tileSize), this.tileSize, this.tileSize);
            
            } else if (currentTeleporter.teleporterType == "door" && currentTeleporter.useTextureType != "" && currentlyDoingTransition) {
                this.context.drawImage(this.textureMap[currentTeleporter.useTexturePath], Math.floor(((currentTeleporter.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentTeleporter.y - yOffset) + player.getSubY()) * this.tileSize), this.tileSize, this.tileSize);
            
            } else {
                // Draw the teleporter with the default colour.
                this.context.fillRect(Math.floor(((currentTeleporter.x - xOffset) + player.getSubX()) * this.tileSize), Math.floor(((currentTeleporter.y - yOffset) + player.getSubY()) * this.tileSize), this.tileSize, this.tileSize);
            }
        }

        var decorationsInFrontOfPlayer = [];
        
        renderCellOffset = 3;
        maximumXRender = (player.getX() + Math.floor(this.screenCellWidthAmount / 2) + renderCellOffset);
        minimumXRender = (player.getX() - Math.floor(this.screenCellWidthAmount / 2) - renderCellOffset);
        maximumYRender = (player.getY() + Math.floor(this.screenCellHeightAmount / 2) + renderCellOffset);
        minimumYRender = (player.getY() - Math.floor(this.screenCellHeightAmount / 2) - renderCellOffset);

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
        this.context.drawImage(this.textureMap[player.getTexturePath()], ((this.tileSize/2) * player.getCurrentWalkPose()), (player.getOrientation() * this.tileSize), this.tileSize/2, this.tileSize, this.tileSize*Math.floor(this.screenCellWidthAmount/2), this.tileSize*Math.floor(this.screenCellHeightAmount/2) - this.tileSize, this.tileSize, this.tileSize*2);
    }

    drawTile(texturePath, xPos, yPos) {
        this.context.drawImage(texturePath, xPos, yPos, this.tileSize, this.tileSize);
    }

    drawCharacter() {

    }

    drawObject() {

    }
}