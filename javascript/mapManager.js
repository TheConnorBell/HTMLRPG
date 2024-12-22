const mapSourcePathRoot = "assets/maps/";

export class MapManager {

    currentMap;
    mapWidth;
    mapHeight;

    gameMapCells = [];
    gameMapTeleporters = [];
    gameMapDecorations = [];
    gameMapInteractors = [];

    adjacentMaps = {};

    constructor(renderer, player, dialogueManager) {
        this.renderer = renderer;
        this.player = player;
        this.dialogueManager = dialogueManager;
    }

    async loadMapFile(mapSrcPath, isAdjacentMap = false) {
        
        var currentAdjacentMaps = [mapSrcPath];

        // Check if the map file has already been loaded and is in the adjacent map list.
        if (this.adjacentMaps[mapSrcPath] && !isAdjacentMap) {
            // If the map has already been loaded in the adjacent map dictionary.

            this.currentMap = this.adjacentMaps[mapSrcPath].mapName;
            this.mapWidth = this.adjacentMaps[mapSrcPath].mapSize[0];
            this.mapHeight = this.adjacentMaps[mapSrcPath].mapSize[1];
            this.player.move(this.adjacentMaps[mapSrcPath].defaultSpawn[0], this.adjacentMaps[mapSrcPath].defaultSpawn[1], this.adjacentMaps[mapSrcPath].defaultOrientation, true);
            this.player.resetSubPosition();

            this.gameMapCells = this.adjacentMaps[mapSrcPath].cells;
            this.gameMapTeleporters = this.adjacentMaps[mapSrcPath].teleporters;
            this.gameMapDecorations = this.adjacentMaps[mapSrcPath].decorations;
            this.gameMapInteractors = this.adjacentMaps[mapSrcPath].interactors;

            // Add adjacent map files to the adjacent map list and pre-load the maps.
            for (var i = 0; i < this.gameMapTeleporters.length; i++) {
                this.loadMapFile(this.gameMapTeleporters[i].destination, true);
                currentAdjacentMaps.push(this.gameMapTeleporters[i].destination);
            }

        } else {
            // Get the new map file.
            const response = await fetch(mapSourcePathRoot + mapSrcPath + ".json");
            const mapData = await response.json();

            if (!isAdjacentMap) {
                this.currentMap = mapData.mapName;
                this.mapWidth = mapData.mapSize[0];
                this.mapHeight = mapData.mapSize[1];
                this.player.move(mapData.defaultSpawn[0], mapData.defaultSpawn[1], mapData.defaultOrientation, true);
                this.player.resetSubPosition();

                this.gameMapCells = mapData.cells;
                this.gameMapTeleporters = mapData.teleporters;
                this.gameMapDecorations = mapData.decorations;
                this.gameMapInteractors = mapData.interactors;
            }
            
            // Add map to adjacent map list.
            this.adjacentMaps[mapSrcPath] = mapData;

            // Pre-load all tile textures.
            for (var i = 0; i < mapData.cells.length; i++) {
                this.renderer.loadIntoTextureMemory(mapData.cells[i].texturePath);
            }

            // Pre-load all teleporter textures annd use=textures.
            for (var i = 0; i < mapData.teleporters.length; i++) {
                this.renderer.loadIntoTextureMemory(mapData.teleporters[i].texturePath)
                if (mapData.teleporters[i].teleporterType == "door") {
                    this.renderer.loadIntoTextureMemory(mapData.teleporters[i].useTexturePath);
                }

                // Load all adjacent map files in preperation for player movement.
                if (!isAdjacentMap) {
                    this.loadMapFile(mapData.teleporters[i].destination, true);
                    currentAdjacentMaps.push(mapData.teleporters[i].destination);
                }
            }

            // Pre-load all decoration object textures.
            for (var i = 0; i < mapData.decorations.length; i++) {
                this.renderer.loadIntoTextureMemory(mapData.decorations[i].texturePath);
            }

            // Pre-load all interactors and NPC textures.
            for (var i = 0; i < mapData.interactors.length; i++) {
                this.renderer.loadIntoTextureMemory(mapData.interactors[i].texturePath);
            }
        }

        if (!isAdjacentMap) {
            // Remove any no-longer adjacent maps from memory.
            for (let map in this.adjacentMaps) {
                if (!currentAdjacentMaps.includes(map)) {
                    // if map not in currentAdjacentMaps, remove it from memory.
                    delete this.adjacentMaps[map];
                }
            }

            // Clear existing loaded dialogue.
            this.dialogueManager.clearLoadedDialogue();

            // Load the current maps dialogue.
            for (var i = 0; i < this.gameMapInteractors.length; i++) {
                if (this.gameMapInteractors[i].interactable == 1) {
                    this.dialogueManager.loadDialogue(this.gameMapInteractors[i].dialogue);
                }
            }
        }
    }

    getMapCells(x = null, y = null) {
        // Check if all cells should be returned, or just a single cell.
        if (x != null && y != null) {
            return this.gameMapCells.find((cell) => cell.x == x && cell.y == y); 
        }
        return this.gameMapCells;
    }

    getMapTeleporters(x = null, y = null) {
        // Check if all teleporters should be returned, or just a single teleporter.
        if (x != null && y != null) {
            return this.gameMapTeleporters.find((teleporter) => teleporter.x == x && teleporter.y == y); 
        }
        return this.gameMapTeleporters;
    }

    getMapDecorations(x = null, y = null) {
        // Check if all decorations should be returned, or just a single decoration.
        if (x != null && y != null) {
            return this.gameMapDecorations.find((decoration) => decoration.x == x && decoration.y == y); 
        }
        return this.gameMapDecorations;
    }

    getMapInteractors(x = null, y = null) {
        // Check if all interactors should be returned, or just a single interactor.
        if (x != null && y != null) {
            return this.gameMapInteractors.find((interactor) => interactor.x == x && interactor.y == y); 
        }
        return this.gameMapInteractors;
    }

    getCurrentMap() {
        return this.currentMap;
    }
}