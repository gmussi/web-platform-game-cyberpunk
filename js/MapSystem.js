class MapSystem {
    constructor(scene) {
        this.scene = scene;
        this.mapData = null;
        this.mapFileName = 'default.json';
    }

    // Map data structure - DEPRECATED: Use loadMapFromURL instead
    static createMapData() {
        console.warn('createMapData() is deprecated. Maps should be loaded from JSON files.');
        return {
            version: "1.0",
            metadata: {
                name: "Cyberpunk Adventure Map",
                description: "A challenging platformer with enemies and portals",
                created: new Date().toISOString(),
                author: "Game Designer"
            },
            world: {
                width: 4100,
                height: 800,
                tileSize: 32
            },
            player: {
                startPosition: {
                    x: 100,
                    y: 688
                },
                character: "A" // Default character
            },
            portal: {
                position: {
                    x: 4000,
                    y: 660
                },
                size: {
                    width: 100,
                    height: 100
                }
            },
            enemies: [
                // Stationary enemies
                {
                    id: "enemy_1",
                    type: "stationary",
                    enemyType: "enemy1",
                    position: { x: 400, y: 688 },
                    properties: {
                        damage: 20,
                        health: 50
                    }
                },
                {
                    id: "enemy_2", 
                    type: "stationary",
                    enemyType: "enemy2",
                    position: { x: 800, y: 688 },
                    properties: {
                        damage: 20,
                        health: 50
                    }
                },
                {
                    id: "enemy_3",
                    type: "stationary", 
                    enemyType: "enemy1",
                    position: { x: 1200, y: 688 },
                    properties: {
                        damage: 20,
                        health: 50
                    }
                },
                {
                    id: "enemy_4",
                    type: "stationary",
                    enemyType: "enemy2", 
                    position: { x: 1600, y: 688 },
                    properties: {
                        damage: 20,
                        health: 50
                    }
                },
                // Moving enemies
                {
                    id: "enemy_5",
                    type: "moving",
                    enemyType: "enemy1",
                    position: { x: 600, y: 500 },
                    properties: {
                        damage: 20,
                        health: 50,
                        speed: 50,
                        patrolRange: 100
                    }
                },
                {
                    id: "enemy_6",
                    type: "moving",
                    enemyType: "enemy2",
                    position: { x: 1000, y: 450 },
                    properties: {
                        damage: 20,
                        health: 50,
                        speed: 50,
                        patrolRange: 120
                    }
                },
                {
                    id: "enemy_7",
                    type: "moving",
                    enemyType: "enemy1",
                    position: { x: 1400, y: 520 },
                    properties: {
                        damage: 20,
                        health: 50,
                        speed: 50,
                        patrolRange: 80
                    }
                },
                {
                    id: "enemy_8",
                    type: "moving",
                    enemyType: "enemy2",
                    position: { x: 1800, y: 480 },
                    properties: {
                        damage: 20,
                        health: 50,
                        speed: 50,
                        patrolRange: 150
                    }
                },
                // Patrol enemies
                {
                    id: "enemy_9",
                    type: "patrol",
                    enemyType: "enemy1",
                    position: { x: 900, y: 400 },
                    properties: {
                        damage: 20,
                        health: 50,
                        speed: 50,
                        patrolRange: 200
                    }
                },
                {
                    id: "enemy_10",
                    type: "patrol",
                    enemyType: "enemy2",
                    position: { x: 1300, y: 350 },
                    properties: {
                        damage: 20,
                        health: 50,
                        speed: 50,
                        patrolRange: 180
                    }
                },
                {
                    id: "enemy_11",
                    type: "patrol",
                    enemyType: "enemy1",
                    position: { x: 2000, y: 420 },
                    properties: {
                        damage: 20,
                        health: 50,
                        speed: 50,
                        patrolRange: 160
                    }
                }
            ],
            platforms: [
                // Ground platforms for enemies
                { x: 400, y: 720, width: 64, height: 16 },
                { x: 800, y: 720, width: 64, height: 16 },
                { x: 1200, y: 720, width: 64, height: 16 },
                { x: 1600, y: 720, width: 64, height: 16 },
                // Floating platforms for moving enemies
                { x: 600, y: 520, width: 96, height: 16 },
                { x: 1000, y: 470, width: 96, height: 16 },
                { x: 1400, y: 540, width: 96, height: 16 },
                { x: 1800, y: 500, width: 96, height: 16 },
                // Platforms for patrol enemies
                { x: 900, y: 420, width: 128, height: 16 },
                { x: 1300, y: 370, width: 128, height: 16 },
                { x: 2000, y: 440, width: 128, height: 16 }
            ],
            collectibles: [
                // Health packs
                { id: "health_1", type: "health", position: { x: 300, y: 600 }, value: 25 },
                { id: "health_2", type: "health", position: { x: 700, y: 500 }, value: 25 },
                { id: "health_3", type: "health", position: { x: 1100, y: 400 }, value: 25 },
                { id: "health_4", type: "health", position: { x: 1500, y: 450 }, value: 25 },
                { id: "health_5", type: "health", position: { x: 1900, y: 350 }, value: 25 }
            ],
            checkpoints: [
                { id: "checkpoint_1", position: { x: 500, y: 650 } },
                { id: "checkpoint_2", position: { x: 1000, y: 600 } },
                { id: "checkpoint_3", position: { x: 1500, y: 550 } },
                { id: "checkpoint_4", position: { x: 2000, y: 500 } }
            ],
            tiles: [] // Will be populated by tilemap system
        };
    }

    // Save current map data to file with custom filename
    async saveMap(mapData = null) {
        const dataToSave = mapData || this.mapData || MapSystem.createMapData();
        
        try {
            // Try to use File System Access API for better file handling
            if ('showSaveFilePicker' in window) {
                return await this.saveMapWithFilePicker(dataToSave);
            } else {
                // Fallback to custom filename prompt
                return await this.saveMapWithPrompt(dataToSave);
            }
        } catch (error) {
            console.error('Error saving map:', error);
            return false;
        }
    }
    
    // Save map using File System Access API
    async saveMapWithFilePicker(mapData) {
        try {
            const jsonString = JSON.stringify(mapData, null, 2);
            
            // Show file picker
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: this.mapFileName,
                types: [{
                    description: 'JSON Map Files',
                    accept: {
                        'application/json': ['.json']
                    }
                }]
            });
            
            // Write to file
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            
            console.log('Map saved successfully with File System Access API');
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Save cancelled by user');
                return false;
            }
            throw error;
        }
    }
    
    // Save map with custom filename prompt (fallback)
    async saveMapWithPrompt(mapData) {
        const jsonString = JSON.stringify(mapData, null, 2);
        
        // Prompt for filename
        const filename = prompt('Enter filename for your map:', this.mapFileName);
        if (!filename) {
            console.log('Save cancelled by user');
            return false;
        }
        
        // Ensure .json extension
        const finalFilename = filename.endsWith('.json') ? filename : filename + '.json';
        
        // Create a blob and download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log('Map saved successfully:', finalFilename);
        return true;
    }

    // Load map data from file
    async loadMap(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const mapData = JSON.parse(event.target.result);
                    
                    // Validate map data structure
                    if (this.validateMapData(mapData)) {
                        this.mapData = mapData;
                        console.log('Map loaded successfully:', mapData.metadata.name);
                        resolve(mapData);
                    } else {
                        reject(new Error('Invalid map data format'));
                    }
                } catch (error) {
                    reject(new Error('Error parsing map file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Load map from URL (for example maps)
    async loadMapFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const mapData = await response.json();
            
            if (this.validateMapData(mapData)) {
                this.mapData = mapData;
                console.log('Map loaded from URL:', mapData.metadata.name);
                return mapData;
            } else {
                throw new Error('Invalid map data format');
            }
        } catch (error) {
            console.error('Error loading map from URL:', error);
            throw error;
        }
    }

    // Validate map data structure
    validateMapData(mapData) {
        console.log('Validating map data...');
        console.log('Map data keys:', Object.keys(mapData));
        
        const requiredFields = ['version', 'metadata', 'world', 'player', 'portal', 'enemies'];
        
        for (const field of requiredFields) {
            if (!mapData[field]) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
            console.log(`✓ Field ${field} exists`);
        }

        // Validate player data
        console.log('Validating player data...');
        console.log('Player data:', mapData.player);
        if (!mapData.player.startPosition || typeof mapData.player.startPosition.x !== 'number' || typeof mapData.player.startPosition.y !== 'number') {
            console.error('Invalid player start position');
            return false;
        }
        console.log('✓ Player data valid');

        // Validate portal data
        console.log('Validating portal data...');
        console.log('Portal data:', mapData.portal);
        if (!mapData.portal.position || typeof mapData.portal.position.x !== 'number' || typeof mapData.portal.position.y !== 'number') {
            console.error('Invalid portal position');
            return false;
        }
        console.log('✓ Portal data valid');

        // Validate enemies array
        console.log('Validating enemies data...');
        console.log('Enemies data:', mapData.enemies);
        if (!Array.isArray(mapData.enemies)) {
            console.error('Enemies must be an array');
            return false;
        }
        console.log('✓ Enemies data valid');

        for (const enemy of mapData.enemies) {
            if (!enemy.id || !enemy.type || !enemy.position || !enemy.enemyType) {
                console.error('Invalid enemy data:', enemy);
                return false;
            }
        }

        console.log('✓ All map data validation passed');
        return true;
    }

    // Get current map data
    getMapData() {
        return this.mapData;
    }

    // Set map data
    setMapData(mapData) {
        if (this.validateMapData(mapData)) {
            this.mapData = mapData;
            return true;
        }
        return false;
    }

    // Create a map from current game state
    createMapFromGameState() {
        if (!this.scene.player || !this.scene.portalSprite || !this.scene.enemies) {
            console.error('Cannot create map: missing game objects');
            return null;
        }

        const mapData = MapSystem.createMapData();
        
        // Update player position
        mapData.player.startPosition.x = this.scene.player.x;
        mapData.player.startPosition.y = this.scene.player.y;
        mapData.player.character = this.scene.player.characterKey;

        // Update portal position
        mapData.portal.position.x = this.scene.portalSprite.x;
        mapData.portal.position.y = this.scene.portalSprite.y;

        // Update enemy positions
        mapData.enemies = [];
        this.scene.enemies.forEach((enemy, index) => {
            mapData.enemies.push({
                id: `enemy_${index + 1}`,
                type: enemy.type,
                enemyType: enemy.enemyType,
                position: { x: enemy.x, y: enemy.y },
                properties: {
                    damage: enemy.damage,
                    health: enemy.health,
                    speed: enemy.speed,
                    patrolRange: enemy.patrolRange || 150
                }
            });
        });

        return mapData;
    }

    // Export map data as JSON string
    exportMapData(mapData = null) {
        const dataToExport = mapData || this.mapData || MapSystem.createMapData();
        return JSON.stringify(dataToExport, null, 2);
    }

    // Import map data from JSON string
    importMapData(jsonString) {
        try {
            const mapData = JSON.parse(jsonString);
            if (this.validateMapData(mapData)) {
                this.mapData = mapData;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing map data:', error);
            return false;
        }
    }
}
