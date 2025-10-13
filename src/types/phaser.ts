// Phaser.js type declarations for TypeScript
declare namespace Phaser {
  const AUTO: number;
  const CANVAS: number;
  const WEBGL: number;

  namespace Input {
    namespace Keyboard {
      class KeyCodes {
        static SPACE: number;
        static LEFT: number;
        static RIGHT: number;
        static UP: number;
        static DOWN: number;
        static S: number;
        static L: number;
        static E: number;
        static M: number;
        static G: number;
        static H: number;
        static T: number;
      }

      function JustDown(key: Key): boolean;

      interface Key {
        isDown: boolean;
      }

      interface CursorKeys {
        left: Key;
        right: Key;
        up: Key;
        down: Key;
      }
    }

    interface KeyboardManager {
      createCursorKeys(): CursorKeys;
      addKey(keyCode: number): Key;
      addKeys(keys: string): { [key: string]: Key };
      on(event: string, callback: Function): this;
    }

    interface InputManager {
      keyboard: KeyboardManager;
      on(event: string, callback: Function): this;
      mousePointer: Pointer;
    }

    interface Pointer {
      x: number;
      y: number;
      isDown: boolean;
      rightButtonDown(): boolean;
    }
  }

  namespace Physics {
    namespace Arcade {
      class Sprite extends Phaser.GameObjects.Sprite {
        body: Phaser.Physics.Arcade.Body;
        constructor(
          scene: Phaser.Scene,
          x: number,
          y: number,
          texture: string,
          frame?: string | number
        );
      }

      interface Body {
        velocity: { x: number; y: number };
        touching: { down: boolean; up: boolean; left: boolean; right: boolean };
        blocked: { left: boolean; right: boolean; up: boolean; down: boolean };
        setSize(width: number, height: number): void;
        setOffset(x: number, y: number): void;
        setBounce(value: number): void;
        setDragX(value: number): void;
        setImmovable(value: boolean): void;
        setAllowGravity(value: boolean): void;
        setVelocity(x: number, y: number): void;
        setVelocityX(value: number): void;
        setVelocityY(value: number): void;
        setGravityY(value: number): void;
        setCollideWorldBounds(value: boolean): void;
        enable: boolean;
      }

      class Group {
        constructor(
          scene: Phaser.Scene,
          children?: Phaser.GameObjects.GameObject[]
        );
        add(child: Phaser.GameObjects.GameObject): void;
      }

      class StaticGroup {
        constructor(
          scene: Phaser.Scene,
          children?: Phaser.GameObjects.GameObject[]
        );
        add(child: Phaser.GameObjects.GameObject): void;
      }

      class World {
        setBounds(x: number, y: number, width: number, height: number): void;
      }

      class Collider {
        static add(
          scene: Phaser.Scene,
          object1: Phaser.GameObjects.GameObject,
          object2: Phaser.GameObjects.GameObject,
          callback?: Function
        ): Phaser.Physics.Arcade.Collider;
        static overlap(
          scene: Phaser.Scene,
          object1: Phaser.GameObjects.GameObject,
          object2: Phaser.GameObjects.GameObject,
          callback?: Function
        ): Phaser.Physics.Arcade.Collider;
      }
    }

    interface PhysicsManager {
      add: {
        existing(
          gameObject: Phaser.GameObjects.GameObject
        ): Phaser.GameObjects.GameObject;
        group(
          children?: Phaser.GameObjects.GameObject[]
        ): Phaser.Physics.Arcade.Group;
        staticGroup(
          children?: Phaser.GameObjects.GameObject[]
        ): Phaser.Physics.Arcade.StaticGroup;
        collider(
          object1: any,
          object2: any,
          callback?: Function
        ): Phaser.Physics.Arcade.Collider;
        overlap(
          object1: any,
          object2: any,
          callback?: Function
        ): Phaser.Physics.Arcade.Collider;
      };
      world: Phaser.Physics.Arcade.World;
      overlap(
        object1: any,
        object2: any,
        callback?: Function
      ): Phaser.Physics.Arcade.Collider;
    }
  }

  namespace GameObjects {
    class GameObject extends Phaser.Events.EventEmitter {
      scene: Phaser.Scene;
      x: number;
      y: number;
      width: number;
      height: number;
      active: boolean;
      visible: boolean;
      depth: number;

      setPosition(x: number, y: number): this;
      setVisible(value: boolean): this;
      setActive(value: boolean): this;
      setDepth(value: number): this;
      setFlipX(value: boolean): this;
      setTint(value: number): this;
      setScale(value: number): this;
      setDisplaySize(width: number, height: number): this;
      setInteractive(): this;
      destroy(): void;
    }

    class Sprite extends GameObject {
      texture: Phaser.Textures.Texture;
      anims: Phaser.Animations.AnimationState;
      body: Phaser.Physics.Arcade.Body;

      constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        frame?: string | number
      );
      play(key: string): this;
      setTexture(key: string, frame?: string | number): this;
      setVelocityX(value: number): this;
      setVelocityY(value: number): this;
      setBounce(value: number): this;
      setDragX(value: number): this;
      setCollideWorldBounds(value: boolean): this;
      clearTint(): this;
    }

    class Image extends Sprite {
      constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        frame?: string | number
      );
      setScrollFactor(value: number): this;
      setFrame(frame: string | number): this;
    }

    class Rectangle extends GameObject {
      constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor?: number,
        fillAlpha?: number
      );
      setFillStyle(color: number, alpha?: number): this;
      setScrollFactor(value: number): this;
      setInteractive(): this;
      setOrigin(x: number, y?: number): this;
      setStrokeStyle(lineWidth: number, color: number, alpha?: number): this;
      body: Phaser.Physics.Arcade.Body;
    }

    class Text extends GameObject {
      text: string;
      style: Phaser.Types.GameObjects.Text.TextStyle;

      constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        text: string,
        style?: Phaser.Types.GameObjects.Text.TextStyle
      );
      setText(text: string): this;
      setOrigin(x: number, y?: number): this;
      setFill(fill: string): this;
      setBackgroundColor(color: string): this;
      setInteractive(): this;
      setScrollFactor(value: number): this;
    }

    class Graphics extends GameObject {
      fillStyle(color: number, alpha?: number): this;
      fillRect(x: number, y: number, width: number, height: number): this;
      generateTexture(
        key: string,
        width: number,
        height: number
      ): Phaser.Textures.Texture;
      lineStyle(width: number, color: number, alpha?: number): this;
      moveTo(x: number, y: number): this;
      lineTo(x: number, y: number): this;
      strokePath(): this;
      clear(): this;
      fillGradientStyle(
        topLeft: number,
        topRight: number,
        bottomLeft: number,
        bottomRight: number,
        alpha?: number
      ): this;
      fillRoundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ): this;
      strokeRoundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ): this;
      setScrollFactor(value: number): this;
    }

    class Circle extends GameObject {
      constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        radius: number,
        fillColor?: number,
        fillAlpha?: number
      );
      setScrollFactor(value: number): this;
    }

    class Group {
      constructor(
        scene: Phaser.Scene,
        children?: Phaser.GameObjects.GameObject[]
      );
      add(child: Phaser.GameObjects.GameObject): void;
      children: Phaser.GameObjects.GameObject[];
    }
  }

  class Scene extends Phaser.Events.EventEmitter {
    scene: Phaser.Scene;
    add: Phaser.GameObjects.GameObjectFactory;
    physics: Phaser.Physics.PhysicsManager;
    input: Phaser.Input.InputManager;
    cameras: Phaser.Cameras.Scene2D.CameraManager;
    time: Phaser.Time.Clock;
    sound: Phaser.Sound.SoundManager;
    textures: Phaser.Textures.TextureManager;
    anims: Phaser.Animations.AnimationManager;
    tweens: Phaser.Tweens.TweenManager;
    events: Phaser.Events.EventEmitter;
    load: Phaser.Loader.LoaderPlugin;
    children: Phaser.GameObjects.GameObject[];
    sys: Phaser.Scenes.Systems;

    constructor(config?: Phaser.Types.Scenes.SettingsConfig);
    preload(): void;
    create(): void;
    update(time: number, delta: number): void;
    shutdown(): void;
    start(key: string, data?: any): void;
  }

  namespace Scenes {
    interface Systems {
      game: Phaser.Game;
    }
  }

  namespace GameObjects {
    interface GameObjectFactory {
      existing(
        gameObject: Phaser.GameObjects.GameObject
      ): Phaser.GameObjects.GameObject;
      sprite(
        x: number,
        y: number,
        texture: string,
        frame?: string | number
      ): Phaser.GameObjects.Sprite;
      image(
        x: number,
        y: number,
        texture: string,
        frame?: string | number
      ): Phaser.GameObjects.Image;
      text(
        x: number,
        y: number,
        text: string,
        style?: Phaser.Types.GameObjects.Text.TextStyle
      ): Phaser.GameObjects.Text;
      rectangle(
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor?: number,
        fillAlpha?: number
      ): Phaser.GameObjects.Rectangle;
      graphics(): Phaser.GameObjects.Graphics;
      circle(
        x: number,
        y: number,
        radius: number,
        fillColor?: number,
        fillAlpha?: number
      ): Phaser.GameObjects.Circle;
      group(
        children?: Phaser.GameObjects.GameObject[]
      ): Phaser.GameObjects.Group;
    }
  }

  namespace Cameras {
    namespace Scene2D {
      class Camera {
        worldView: { x: number; y: number; width: number; height: number };
        setBounds(x: number, y: number, width: number, height: number): void;
        startFollow(target: Phaser.GameObjects.GameObject): void;
        setDeadzone(width: number, height: number): void;
        setZoom(value: number): void;
        centerOn(x: number, y: number): void;
        getWorldPoint(x: number, y: number): { x: number; y: number };
        setViewport(x: number, y: number, width: number, height: number): this;
        ignore(
          gameObjects:
            | Phaser.GameObjects.GameObject
            | Phaser.GameObjects.GameObject[]
        ): this;
        scrollX: number;
        scrollY: number;
      }

      class CameraManager {
        main: Camera;
        add(x?: number, y?: number, width?: number, height?: number): Camera;
      }
    }
  }

  namespace Time {
    class Clock {
      now: number;
      delayedCall(
        delay: number,
        callback: Function,
        args?: any[],
        callbackScope?: any
      ): Phaser.Time.TimerEvent;
    }

    class TimerEvent {
      constructor(
        delay: number,
        callback: Function,
        args?: any[],
        callbackScope?: any
      );
    }
  }

  namespace Sound {
    class SoundManager {
      add(
        key: string,
        config?: Phaser.Types.Sound.SoundConfig
      ): Phaser.Sound.BaseSound;
    }

    class BaseSound {
      play(): void;
      stop(): void;
      destroy(): void;
    }
  }

  namespace Textures {
    class TextureManager {
      exists(key: string): boolean;
      get(key: string): Phaser.Textures.Texture;
      addSpriteSheet(
        key: string,
        source: HTMLImageElement,
        config: Phaser.Types.Textures.SpriteSheetConfig
      ): Phaser.Textures.Texture;
    }

    class Texture {
      key: string;
      source: HTMLImageElement[];
      getSourceImage(): HTMLImageElement;
    }
  }

  namespace Animations {
    class AnimationManager {
      create(
        config: Phaser.Types.Animations.Animation
      ): Phaser.Animations.Animation;
    }

    class AnimationState {
      currentAnim: { key: string };
      create(
        config: Phaser.Types.Animations.Animation
      ): Phaser.Animations.Animation;
    }

    class Animation {
      key: string;
    }
  }

  namespace Tweens {
    class TweenManager {
      add(config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween;
    }

    class Tween {
      constructor(targets: any, config: Phaser.Types.Tweens.TweenBuilderConfig);
      stop(): void;
    }
  }

  namespace Events {
    class EventEmitter {
      on(event: string, callback: Function): this;
      emit(event: string, ...args: any[]): boolean;
    }
  }

  namespace Math {
    namespace Distance {
      function Between(x1: number, y1: number, x2: number, y2: number): number;
    }
  }

  namespace Types {
    namespace Input {
      namespace Keyboard {
        interface CursorKeys {
          left: Phaser.Input.Keyboard.Key;
          right: Phaser.Input.Keyboard.Key;
          up: Phaser.Input.Keyboard.Key;
          down: Phaser.Input.Keyboard.Key;
        }
      }
    }

    namespace GameObjects {
      namespace Text {
        interface TextStyle {
          fontSize?: string;
          fill?: string;
          fontStyle?: string;
          stroke?: string;
          strokeThickness?: number;
          backgroundColor?: string;
          padding?: { x?: number; y?: number };
        }
      }
    }

    namespace Scenes {
      interface SettingsConfig {
        key?: string;
        active?: boolean;
        visible?: boolean;
        pack?: Phaser.Types.Loader.FilePackConfig;
      }
    }

    namespace Sound {
      interface SoundConfig {
        volume?: number;
        loop?: boolean;
        fadeIn?: {
          duration: number;
          from: number;
          to: number;
        };
      }
    }

    namespace Textures {
      interface SpriteSheetConfig {
        frameWidth: number;
        frameHeight: number;
        startFrame?: number;
        endFrame?: number;
      }
    }

    namespace Animations {
      interface Animation {
        key: string;
        frames: Array<{ key: string }>;
        frameRate?: number;
        repeat?: number;
      }
    }

    namespace Tweens {
      interface TweenBuilderConfig {
        targets: any;
        x?: number;
        y?: number;
        duration?: number;
        repeat?: number;
        yoyo?: boolean;
        ease?: string;
        alpha?: number;
      }
    }

    namespace Loader {
      interface FilePackConfig {
        files: Array<{ type: string; key: string; url: string }>;
      }

      class LoaderPlugin {
        image(key: string, url: string): void;
        audio(key: string, url: string): void;
        start(): void;
      }
    }
  }

  class Game {
    scale: Phaser.Scale.ScaleManager;
    canvas: HTMLCanvasElement;

    constructor(config: Phaser.Types.Core.GameConfig);
  }

  namespace Scale {
    class ScaleManager {
      width: number;
      height: number;
    }
  }

  namespace Types {
    namespace Core {
      interface GameConfig {
        type?: number;
        width?: number;
        height?: number;
        parent?: string;
        backgroundColor?: string;
        physics?: {
          default?: string;
          arcade?: {
            gravity?: { x?: number; y: number };
            debug?: boolean;
          };
        };
        scene?: Phaser.Scene[];
        scale?: {
          mode?: number;
          autoCenter?: number;
        };
        render?: {
          antialias?: boolean;
        };
      }
    }
  }
}

declare const Phaser: typeof Phaser;
