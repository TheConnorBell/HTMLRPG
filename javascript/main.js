var canvas = null
var context = null;

// The total size of the map.
var mapWidth = 0;
var mapHeight = 0;

// The number of cells shown on screen.
const screenCellHeightAmount = 11;
const screenCellWidthAmount = 15;

// Tile sizes.
const tileSize = 32;

// Frame variables.
var currentSecond = 0;
var frameCount = 0;
var prevFramesPerSecond = 0;
var lastFrameTime = 0;

//Initial player positions.
var currentPlayerXPosition = 0;
var currentPlayerYPosition = 0;

var currentPlayerXDecimalMovement = 0;
var currentPlayerYDecimalMovement = 0;

// Player movement variables.
var keyPresses = {};

const movementStepAmount = 8;
const movementTime = 250; // ms
var currentFacingDirection = 3;  // Left=0, Right=1, Up=2, Down=3.
// Variable to keep track of which leg was last used to walk, LeftLeg=0, RightLeg=1.
var lastLeg = 0;
var currentlyStepping = false;
var currentStepCount = 0;
const amountOfStepsBetweenFrameSwaps = 2; //ms

// Map Texture Storage.
var mapTextures = {};

// Map of tiles.
var gameMap = [];

// Player sprites.
var playerSprites = null;

// Get canvas and context of first load of page.

window.onload = function() {
    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext('2d');

    document.addEventListener('keydown', function(event) {
        keyPresses[event.key] = true;
    });

    document.addEventListener('keyup', function(event) {
        keyPresses[event.key] = false;
    });

    readMapFile();

    // Start the main loop.
    requestAnimationFrame(drawGame);
}

async function readMapFile() {
    const response = await fetch('assets/maps/spawn.json');
    const mapData = await response.json();
    console.log(mapData);

    gameMap = mapData.cells;
    currentPlayerXPosition = mapData.defaultSpawnX;
    currentPlayerYPosition = mapData.defaultSpawnY;
    mapWidth = mapData.width;
    mapHeight = mapData.height;


}

// Draw each updated frame.
function drawGame() {
    if (canvas == null || context == null || gameMap == null) {
        return;
    }

    // Clear canvas to prevent seeing previous frames around edge of map.
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.imageSmoothingEnabled = false;

    // Get the offset the canvas has from the centre of the canvas screen.
    const xOffset = Math.floor(currentPlayerXPosition) - Math.floor(screenCellWidthAmount  / 2);
    const yOffset = Math.floor(currentPlayerYPosition) - Math.floor(screenCellHeightAmount / 2);

    // Draw each cell visible on screen.
    for (var y = -1; y < screenCellHeightAmount + 1; y++) {
        for (var x = -1; x < screenCellWidthAmount + 1; x++) {

            // Get the tile position based on screen offset.
            const mapX = xOffset + x;
            const mapY = yOffset + y;

            // Determine if the tile should be rendered by checking that it is within view of the camera.
            if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight) {
                continue;
            }

            const cell = gameMap[((mapY*mapWidth)+mapX)];

            // Check if texture has already been loaded, preventing flickering due to texture reloading.
            if (!(cell.textureID in mapTextures)) {
                const texture = new Image();
                texture.src = "assets/textures/terrain/" + cell.textureID + ".png";
                mapTextures[cell.textureID] = texture;
            }

            const tex = mapTextures[cell.textureID]; 

            // Draw the current tile at the correct position with the correct scale.
            context.drawImage(tex, Math.floor((x + currentPlayerXDecimalMovement) * tileSize), Math.floor((y + currentPlayerYDecimalMovement) * tileSize), tileSize, tileSize);
        }
    }

    // Check player movement.
    if (currentPlayerXDecimalMovement != 0 || currentPlayerYDecimalMovement != 0) {
        // Do nothing if player is already moving.
    } else if (keyPresses["ArrowLeft"]) {
        currentFacingDirection = 0;
        movePlayer(-1, 0);
    } else if (keyPresses["ArrowRight"]) {
        currentFacingDirection = 1;
        movePlayer(1, 0);
    } else if (keyPresses["ArrowUp"]) {
        currentFacingDirection = 2;
        movePlayer(0, -1);
    } else if (keyPresses["ArrowDown"]) {
        currentFacingDirection = 3;
        movePlayer(0, 1);
    } 
    
    // Draw player,
    drawPlayer();
    

    // Update FPS.
    var second = Math.floor(Date.now()/1000);
    if (second != currentSecond) {
        currentSecond = second;
        prevFramesPerSecond = frameCount;
        frameCount = 1;
        document.getElementById("FPS").innerHTML = "FPS: " + prevFramesPerSecond;
    } else {
        frameCount++;
    }

    // Update Position values.
    document.getElementById("Position").innerHTML = "Position X=" + currentPlayerXPosition + " Y=" + currentPlayerYPosition;
    document.getElementById("SubPosition").innerHTML = "Sub Position X=" + currentPlayerXDecimalMovement + " Y=" + currentPlayerYDecimalMovement;

    // Request the next frame.
    requestAnimationFrame(drawGame);
}

// Move the player when requested.
async function movePlayer(xIncrease, yIncrease) {

    // Get the new position the player will move to.
    const newPlayerXPosition = currentPlayerXPosition + xIncrease;
    const newPlayerYPosition = currentPlayerYPosition + yIncrease;

    // Check the player will not be moving outside the map or into a wall.
    if (newPlayerXPosition < 0 || newPlayerXPosition >= mapWidth || newPlayerYPosition < 0 || newPlayerYPosition >= mapHeight || gameMap[newPlayerYPosition * mapWidth + newPlayerXPosition].walkable != 1) {
        return;
    }

    // Determine amount of movement per step, and in what direction.
    const movementXAmount = (Math.abs(newPlayerXPosition - currentPlayerXPosition) / movementStepAmount) * -xIncrease;
    const movementYAmount = (Math.abs(newPlayerYPosition - currentPlayerYPosition) / movementStepAmount) * -yIncrease;

    // Do each movement step.
    for (var i = 1; i <= movementStepAmount; i++) {
        
        currentPlayerXDecimalMovement += movementXAmount;
        currentPlayerYDecimalMovement += movementYAmount;

        // Determine what leg the character should be stepping with.
        currentStepCount++;
        
        if (currentStepCount >= amountOfStepsBetweenFrameSwaps) {
            currentStepCount = 0;
            // If the character should return to the neutral stage.
            if (currentlyStepping) {
                currentlyStepping = false;
            // If the character is in the neutral pose and last stepped with their left leg.
            } else if (lastLeg == 0) {
                lastLeg = 1;
                currentlyStepping = true;
            } else if (lastLeg == 1) {
                lastLeg = 0;
                currentlyStepping = true;
            }
        }

        drawPlayer();

        await sleep(movementTime / movementStepAmount);
    }

    // Update player position.
    currentPlayerXDecimalMovement = 0;
    currentPlayerYDecimalMovement = 0;
    currentPlayerXPosition += xIncrease;
    currentPlayerYPosition += yIncrease;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function drawPlayer() {

    // Get player sprites if it doesn't exist yet.
    if (playerSprites == null) {
        const plrSprite = new Image();
        plrSprite.src = "assets/textures/characters/blue_knight.png";
        playerSprites = plrSprite;
    }

    var currentStep = 0;

    // Determine what leg, if any to step with.
    if (currentlyStepping && lastLeg == 0) {
        currentStep = tileSize;
    } else if (currentlyStepping && lastLeg == 1) {
        currentStep = tileSize/2;
    }

    // Draw player sprite.
    context.drawImage(playerSprites, currentStep, (currentFacingDirection * tileSize), tileSize/2, tileSize, tileSize*Math.floor(screenCellWidthAmount/2), tileSize*Math.floor(screenCellHeightAmount/2) - tileSize, tileSize, tileSize*2);


}