const mapSourcePathRoot = "assets/maps/";

export class MapManager {

    currentMap;
    mapWidth;
    mapHeight;

    gameMapCells = [];
    gameMapTeleporters = [];
    gameMapDecorations = [];
    gameMapInteractors = [];

    constructor(renderer, player) {
        this.renderer = renderer;
        this.player = player;
    }

    async loadMapFile(mapSrcPath) {
        // Get the new map file.
        const response = await fetch(mapSrcPath);
        const mapData = await response.json();

        this.currentMap = mapData.mapName;
        this.mapWidth = mapData.mapSize[0];
        this.mapHeight = mapData.mapSize[1];
        this.player.move(mapData.defaultSpawn[0], mapData.defaultSpawn[1], mapData.defaultOrientation, true);

        // Pre-load all tile textures.
        this.gameMapCells = mapData.cells;
        for (var i = 0; i < this.gameMapCells.length; i++) {
            this.renderer.loadIntoTextureMemory(this.gameMapCells[i].texturePath);
        }

        // Pre-load all teleporter textures annd use=textures.
        this.gameMapTeleporters = mapData.teleporters;
        for (var i = 0; i < this.gameMapTeleporters.length; i++) {
            this.renderer.loadIntoTextureMemory(this.gameMapTeleporters[i].texturePath)
            if (this.gameMapTeleporters[i].teleporterType == "door") {
                this.renderer.loadIntoTextureMemory(this.gameMapTeleporters[i].useTexturePath);
            }
        }

        // Pre-load all decoration object textures.
        this.gameMapDecorations = mapData.decorations;
        for (var i = 0; i < this.gameMapDecorations.length; i++) {
            this.renderer.loadIntoTextureMemory(this.gameMapDecorations[i].texturePath);
        }

        // Pre-load all interactors and NPC textures.
        this.gameMapInteractors = mapData.interactors;
        for (var i = 0; i < this.gameMapInteractors.length; i++) {
            this.renderer.loadIntoTextureMemory(this.gameMapInteractors[i].texturePath);
        }
    }

    getMapCells(x = null, y = null) {
        // Check if all cells should be returned, or just a single cell.
        if (x && y) {
            return this.gameMapCells.find((cell) => cell.x == x && cell.y == y); 
        }
        return this.gameMapCells;
    }

    getMapTeleporters(x = null, y = null) {
        // Check if all teleporters should be returned, or just a single teleporter.
        if (x && y) {
            return this.gameMapTeleporters.find((teleporter) => teleporter.x == x && teleporter.y == y); 
        }
        return this.gameMapTeleporters;
    }

    getMapDecorations(x = null, y = null) {
        // Check if all decorations should be returned, or just a single decoration.
        if (x && y) {
            return this.gameMapDecorations.find((decoration) => decoration.x == x && decoration.y == y); 
        }
        return this.gameMapDecorations;
    }

    getMapInteractors(x = null, y = null) {
        // Check if all interactors should be returned, or just a single interactor.
        if (x && y) {
            return this.gameMapInteractors.find((interactor) => interactor.x == x && interactor.y == y); 
        }
        return this.gameMapInteractors;
    }
}