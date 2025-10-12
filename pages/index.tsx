import Head from 'next/head';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the game component to avoid SSR issues
const GameComponent = dynamic(() => import('../components/GameComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
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
      
      <main>
        <GameComponent />
      </main>
    </>
  );
}
