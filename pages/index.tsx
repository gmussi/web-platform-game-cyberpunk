import Head from 'next/head';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the game component to avoid SSR issues
const GameComponent = dynamic(() => import('../src/components/GameComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      color: '#fff',
      fontSize: '24px'
    }}>
      Loading Game...
    </div>
  )
});

export default function Game() {
  return (
    <>
      <Head>
        <title>2D Platformer Game</title>
        <meta name="description" content="A 2D side-scrolling platformer game built with Phaser.js and TypeScript" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0
      }}>
        <GameComponent />
      </main>
    </>
  );
}
