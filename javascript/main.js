import { Player } from "./player.js";
import { Renderer } from "./renderer.js";

var canvas = null
var context = null;

// The renderer instance.
var renderer;

// The map file.
const defaultMapFile = "assets/maps/spawn.json";
var currentMap = null;

// The player instance.
const defaultPlayerSprite = "characters/blue_knight";
var player;

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

// Player movement variables.
var keyPresses = {};

var lockPlayerControls = false;
var currentlyDoingTransition = false;

const movementStepAmount = 8;
const movementTime = 250; // ms
var currentOrientation = 3;  // Left=0, Right=1, Up=2, Down=3.
// Variable to keep track of which leg was last used to walk, LeftLeg=0, RightLeg=1.
var lastLeg = 0;
var currentlyStepping = false;
var currentStepCount = 0;
const amountOfStepsBetweenFrameSwaps = 2; //ms

const tapRotationDuration = 120; // ms

// Map Texture Storage.
var textureMap = {};

// Arrays of map information.
var gameMapCells = [];
var gameMapTeleporters = [];
var gameMapDecorations = [];
var gameMapInteractors = [];

// Player sprites.
var playerSprites = null;

// Screen transition brightness.
var transitionOpacity = 0;


// Get canvas and context of first load of page.
window.onload = function() {
    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext('2d');

    document.addEventListener('keydown', function(event) {
        // Check the key is not being held down.
        if (!keyPresses[event.key] || keyPresses[event.key] == -1) {
            keyPresses[event.key] = Date.now();
        }
    });

    document.addEventListener('keyup', function(event) {

        // Check that the key has not already been released.
        if (keyPresses[event.key] != -1) {

            // Check if the key was quickly tapped.
            if (tapRotationDuration > Date.now() - keyPresses[event.key]) {
                tapRotation(event.key);
            }
            keyPresses[event.key] = -1;
        }
    });

    // Create the renderer instance.
    renderer = new Renderer(canvas, context, tileSize, screenCellWidthAmount, screenCellHeightAmount);

    // Craete the player instance.
    player = new Player(defaultPlayerSprite, 0, 0, 3);
    renderer.loadIntoTextureMemory(defaultPlayerSprite);

    readMapFile(defaultMapFile);

    // Start the main loop.
    mainGameLoop();
}

function mainGameLoop() {

    // Equivalent of a while(true) loop to run infinitely.
    function loop() {

        // Draw the games tiles.
        drawGame();

        // Start the next loop.
        requestAnimationFrame(loop);
    }
    // Begin the loop.
    requestAnimationFrame(loop);

}

async function readMapFile(src) {

    // Get the new map file.
    const response = await fetch(src);
    const mapData = await response.json();

    currentMap = mapData.mapName;
    mapWidth = mapData.mapSize[0];
    mapHeight = mapData.mapSize[1];
    player.move(mapData.defaultSpawn[0], mapData.defaultSpawn[1], mapData.defaultOrientation, true);

    // Pre-load all tile textures.
    gameMapCells = mapData.cells;
    for (var i = 0; i < gameMapCells.length; i++) {
        renderer.loadIntoTextureMemory(gameMapCells[i].texturePath);
    }

    // Pre-load all teleporter textures annd use=textures.
    gameMapTeleporters = mapData.teleporters;
    for (var i = 0; i < gameMapTeleporters.length; i++) {
        renderer.loadIntoTextureMemory(gameMapTeleporters[i].texturePath)
        if (gameMapTeleporters[i].teleporterType == "door") {
            renderer.loadIntoTextureMemory(gameMapTeleporters[i].useTexturePath);
        }
    }

    // Pre-load all decoration object textures.
    gameMapDecorations = mapData.decorations;
    for (var i = 0; i < gameMapDecorations.length; i++) {
        renderer.loadIntoTextureMemory(gameMapDecorations[i].texturePath);
    }

    // Pre-load all interactors and NPC textures.
    gameMapInteractors = mapData.interactors;
    for (var i = 0; i < gameMapInteractors.length; i++) {
        renderer.loadIntoTextureMemory(gameMapInteractors[i].texturePath);
    }
}

// Draw each updated frame.
function drawGame() {
    if (canvas == null || context == null || gameMapCells == null || !renderer) {
        return;
    }

    // Check player movement.
    if (lockPlayerControls) {
        // Do nothing if the player controls are locked.
    } else if (player.getSubX() != 0 || player.getSubY() != 0) {
        // Do nothing if player is already moving.
    } else if (keyPresses["ArrowLeft"] && keyPresses["ArrowLeft"] != -1 && (keyPresses["ArrowLeft"] + tapRotationDuration < Date.now() || player.getOrientation() == 0)) {
        movePlayer(-1, 0, 0);
    } else if (keyPresses["ArrowRight"] && keyPresses["ArrowRight"] != -1 && (keyPresses["ArrowRight"] + tapRotationDuration < Date.now() || player.getOrientation() == 1)) {
        movePlayer(1, 0, 1);
    } else if (keyPresses["ArrowUp"] && keyPresses["ArrowUp"] != -1 && (keyPresses["ArrowUp"] + tapRotationDuration < Date.now() || player.getOrientation() == 2)) {
        movePlayer(0, -1, 2);
    } else if (keyPresses["ArrowDown"] && keyPresses["ArrowDown"] != -1 && (keyPresses["ArrowDown"] + tapRotationDuration < Date.now() || player.getOrientation() == 3)) {
        movePlayer(0, 1, 3);
    } 

    renderer.drawFrame(gameMapCells, gameMapTeleporters, gameMapDecorations, gameMapInteractors, player, mapWidth, mapHeight, currentlyDoingTransition);

    // Control Screen Opacity.
    if (transitionOpacity != 0) {
        context.fillStyle = "rgba(0,0,0," + transitionOpacity + ")";
        context.fillRect(0, 0, screenCellWidthAmount * tileSize, screenCellHeightAmount * tileSize);
    }

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
    document.getElementById("Position").innerHTML = "Position X=" + player.getX() + " Y=" + player.getY();
    document.getElementById("SubPosition").innerHTML = "Sub Position X=" + player.getSubX() + " Y=" + player.getSubY();

    return;
}

// Move the player when requested.
async function movePlayer(xIncrease, yIncrease, orientation, duration = movementTime, usingTeleporter = false) {

    // Check if player controls are locked.
    if (lockPlayerControls) {
        return;
    }

    // Get the new position the player will move to.
    const newPlayerXPosition = player.getX() + xIncrease;
    const newPlayerYPosition = player.getY() + yIncrease;

    // Check if the player will walk into a teleporter.
    var currentTeleporter = gameMapTeleporters.find((teleporter) => teleporter.x == newPlayerXPosition && teleporter.y == newPlayerYPosition);
    if (currentTeleporter != null && currentTeleporter.enabled == 1) {

        // Ensure that horizontal movement is allowed by the teleporter.
        if ((xIncrease == 1 && currentTeleporter.walkable[0] != 1) || (xIncrease == -1 && currentTeleporter.walkable[1] != 1)) {
            return;
        }

        // Ensure that vertical movement is allowed by the teleporter.
        if ((yIncrease == 1 && currentTeleporter.walkable[2] != 1) || (yIncrease == -1 && currentTeleporter.walkable[3] != 1)) {
            return;
        }

        usingTeleporter = true;
        duration *= 2;
        lockPlayerControls = true;
        doSceneTransition("assets/maps/" + currentTeleporter.destination + ".json", currentTeleporter.destinationPos, currentTeleporter.orientation);

    } else {

        // Check the player will not be moving outside the map.
        if (newPlayerXPosition < 0 || newPlayerXPosition >= mapWidth || newPlayerYPosition < 0 || newPlayerYPosition >= mapHeight) {
            return;
        }

        // Check the player will not be moving into an interactor.
        for (var i = 0; i < gameMapInteractors.length; i++) {

            const interactor = gameMapInteractors[i];
            if (interactor.x == newPlayerXPosition && interactor.y == newPlayerYPosition) {
                return;
            }
        }

        // Get the position of the new cell to be walked onto.
        const newCell = gameMapCells[newPlayerYPosition * mapWidth + newPlayerXPosition];
        
        // Ensure that horizontal movement is allowed from either the left or the right.
        if ((xIncrease == -1 && newCell.walkable[0] != 1) || (xIncrease == 1 && newCell.walkable[1] != 1)) {
            return;
        }

        // Ensure that vertical movement is allowed from either up or down.
        if ((yIncrease == -1 && newCell.walkable[2] != 1) || (yIncrease == 1 && newCell.walkable[3] != 1)) {
            return;
        }

    }

    // Determine amount of movement per step, and in what direction.
    const movementXAmount = (Math.abs(newPlayerXPosition - player.getX()) / movementStepAmount) * -xIncrease;
    const movementYAmount = (Math.abs(newPlayerYPosition - player.getY()) / movementStepAmount) * -yIncrease;

    if (usingTeleporter) {
        player.move(0, 0, orientation);
        await sleep(300);
    }

    var map = currentMap;

    // Do each movement step.
    for (var i = 1; i <= movementStepAmount; i++) {

        if (currentMap != map) {
            player.resetSubPosition();
            currentlyStepping = false;
            drawPlayer();
            break;
        }
        player.subMove(movementXAmount, movementYAmount, orientation);

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

        await sleep(duration / movementStepAmount);
    }

    // Prevent moving during scene transition and snapping back afterwards.
    if (!currentlyDoingTransition) {
        player.move(xIncrease, yIncrease, orientation);
    }
    player.resetSubPosition();
    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function doSceneTransition(destinationMapSrc, destinationPosition, destinationOrientation) {

    // Lock player controls if they arent already.
    lockPlayerControls = true;
    currentlyDoingTransition = true;

    await sleep(200);

    for (var i = 0; i < 20; i++) {
        transitionOpacity += 0.05;
        await sleep(20);
    }

    await readMapFile(destinationMapSrc);

    player.move(destinationPosition[0], destinationPosition[1], destinationOrientation, true);
    player.resetSubPosition();

    await sleep(20);

    for (var i = 0; i < 20; i++) {
        transitionOpacity -= 0.05;
        await sleep(20);
    }
    
    // Ensure variables have been set properly.
    transitionOpacity = 0;
    player.move(destinationPosition[0], destinationPosition[1], destinationOrientation, true);
    player.resetSubPosition();

    lockPlayerControls = false;
    currentlyDoingTransition = false;
}

function tapRotation(key) {
    // Check player movement.
    if (lockPlayerControls) {
        // Do nothing if the player controls are locked.
    } else if (player.getSubX() != 0 || player.getSubY() != 0) {
        // Do nothing if player is already moving.
    } else if (keyPresses["ArrowLeft"] && keyPresses["ArrowLeft"] != -1) {
        player.move(0, 0, 0);
    } else if (keyPresses["ArrowRight"] && keyPresses["ArrowRight"] != -1) {
        player.move(0, 0, 1);
    } else if (keyPresses["ArrowUp"] && keyPresses["ArrowUp"] != -1) {
        player.move(0, 0, 2);
    } else if (keyPresses["ArrowDown"] && keyPresses["ArrowDown"] != -1) {
        player.move(0, 0, 3);
    } 
}