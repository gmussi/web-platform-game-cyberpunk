class MapSystem {
    constructor(scene) {
        this.scene = scene;
        this.mapData = null;
        this.mapFileName = 'default.json';
    }

    // Save current map data to file with custom filename
    async saveMap(mapData = null) {
        const dataToSave = mapData || this.mapData;
        
        if (!dataToSave) {
            console.error('No map data available to save');
            return false;
        }
        
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

        // Create basic map structure
        const mapData = {
            version: "1.0",
            metadata: {
                name: "Generated Map",
                description: "Map generated from current game state",
                created: new Date().toISOString(),
                author: "Game System"
            },
            world: {
                width: 4100,
                height: 800,
                tileSize: 32
            },
            player: {
                startPosition: { x: 0, y: 0 },
                character: "A"
            },
            portal: {
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 }
            },
            enemies: [],
            platforms: [],
            collectibles: [],
            checkpoints: [],
            tiles: []
        };
        
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
        const dataToExport = mapData || this.mapData;
        
        if (!dataToExport) {
            console.error('No map data available to export');
            return null;
        }
        
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
