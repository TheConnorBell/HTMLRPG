import { Player } from "./player.js";
import { Renderer } from "./renderer.js";
import { InputController} from "./inputController.js";
import { MapManager } from "./mapManager.js";
import { DialogueManager } from "./dialogueManager.js";

var canvas = null
var context = null;

// The renderer instance.
var renderer;

// The input controller instance.
var inputController;

// The dialogue manager instance.
var dialogueManager;

// The map manager instance.
var mapManager;

// The map file.
const defaultMapFile = "spawn";

// The player instance.
const defaultPlayerSprite = "characters/blue_knight";
var player;

// The number of cells shown on screen.
const screenCellHeightAmount = 11;
const screenCellWidthAmount = 15;

// Tile sizes.
const tileSize = 32;

// Frame variables.
var currentSecond = 0;
var frameCount = 0;
var prevFramesPerSecond = 0;


// Get canvas and context of first load of page.
window.onload = function() {
    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext('2d');

    // Create the player instance.
    player = new Player(defaultPlayerSprite, 0, 0, 3);

    // Create the renderer instance.
    renderer = new Renderer(canvas, context, tileSize, screenCellWidthAmount, screenCellHeightAmount, player);
    renderer.loadIntoTextureMemory(defaultPlayerSprite);
    player.addRenderer(renderer);

    // Create the dialogue manager.
    dialogueManager = new DialogueManager();

    // Create the map manager instance.
    mapManager = new MapManager(renderer, player, dialogueManager);
    renderer.addMapManager(mapManager);
    player.addMapManager(mapManager);

    // Create the input controller instance.
    inputController = new InputController(player);
    player.addInputController(inputController);

    //readMapFile(defaultMapFile);
    mapManager.loadMapFile(defaultMapFile);

    // Start the main loop.
    mainGameLoop();
}

function mainGameLoop() {

    // Equivalent of a while(true) loop to run infinitely.
    function loop() {

        // Check what keys are being pressed.
        inputController.checkInputs();

        // Draw the games tiles.
        renderer.drawFrame();

        updateFPS();
        updatePositionDisplay();

        // Start the next loop.
        requestAnimationFrame(loop);
    }
    // Begin the loop.
    requestAnimationFrame(loop);

}

function updateFPS() {
    var second = Math.floor(Date.now()/1000);
    if (second != currentSecond) {
        currentSecond = second;
        prevFramesPerSecond = frameCount;
        frameCount = 1;
        document.getElementById("FPS").innerHTML = "FPS: " + prevFramesPerSecond;
    } else {
        frameCount++;
    }
}

function updatePositionDisplay() {
    document.getElementById("Position").innerHTML = "Position X=" + player.getX() + " Y=" + player.getY();
    document.getElementById("SubPosition").innerHTML = "Sub Position X=" + player.getSubX() + " Y=" + player.getSubY();
}