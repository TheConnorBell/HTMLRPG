const mapSourcePathRoot = "assets/maps/";

export class MapManager {

    currentMap;
    mapWidth;
    mapHeight;

    gameMapCells;
    gameMapTeleporters;
    gameMapDecorations;
    gameMapInteractors;

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

    getMapCells() {
        return this.gameMapCells;
    }

    getMapTeleporters() {
        return this.gameMapTeleporters;
    }

    getMapDecorations() {
        return this.gameMapDecorations;
    }

    getMapInteractors() {
        return this.gameMapInteractors;
    }
}