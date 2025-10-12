import { useEffect, useRef } from 'react';

export default function GameComponent() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import Phaser to avoid SSR issues
    const initGame = async () => {
      const Phaser = (await import('phaser')).default;
      
      // Import game scenes
      const { LoadingScene } = await import('../src/scenes/LoadingScene');
      const { CharacterSelectScene } = await import('../src/scenes/CharacterSelectScene');
      const { GameScene } = await import('../src/scenes/GameScene');
      const { GameOverScene } = await import('../src/scenes/GameOverScene');
      const { VictoryScene } = await import('../src/scenes/VictoryScene');
      const { MapEditorScene } = await import('../src/scenes/MapEditorScene');

      // Import game configuration
      const { GAME_CONFIG } = await import('../src/data/config');

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height,
        parent: gameRef.current,
        backgroundColor: GAME_CONFIG.backgroundColor,
        physics: GAME_CONFIG.physics,
        scene: [
          LoadingScene,
          CharacterSelectScene,
          GameScene,
          GameOverScene,
          VictoryScene,
          MapEditorScene,
        ],
        scale: GAME_CONFIG.scale,
        render: GAME_CONFIG.render,
      };

      phaserGameRef.current = new Phaser.Game(config);
    };

    initGame();

    // Cleanup on unmount
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <div 
      ref={gameRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        margin: 0,
        padding: 0,
        position: 'relative',
      }}
    />
  );
}
