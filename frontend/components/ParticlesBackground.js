'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function GlobeView({ posts = [], onLocationClick }) {
  const globeRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ✅ Prepare markers
  useEffect(() => {
    const formatted = posts.slice(0, 80).map(p => ({
      lat: p.lat || 12.9716,
      lng: p.lng || 77.5946,
      post: p
    }));
    setLabels(formatted);
  }, [posts]);

  // ✅ Auto rotate
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls?.();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;
      }
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      overflow: 'hidden',
      zIndex: 2
    }}>

      {/* 🟣 BACK TEXT */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '140px',
        fontWeight: 'bold',
        color: 'white',
        opacity: 0.05,
        zIndex: 1,
        textShadow: '0 0 60px rgba(168,85,247,0.8)'
      }}>
        WHISPERS
      </div>

      {/* 🌍 GLOBE */}
      <Globe
        ref={globeRef}
        width={typeof window !== "undefined" ? window.innerWidth : 800}
        height={typeof window !== "undefined" ? window.innerHeight : 600}

        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"

        atmosphereColor="#a855f7"
        atmosphereAltitude={0.25}

        htmlElementsData={labels}
        htmlElement={(d) => {
          const el = document.createElement('div');
          el.innerHTML = '💬';
          el.style.fontSize = '20px';
          el.style.color = '#a855f7';
          el.style.textShadow = '0 0 12px #a855f7';
          el.style.cursor = 'pointer';

          el.onclick = () => onLocationClick(d.post);
          return el;
        }}
      />

      {/* 📂 SIDEBAR */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: sidebarOpen ? 0 : '-300px',
        width: '300px',
        height: '100%',
        background: '#0a0a0a',
        color: 'white',
        padding: '20px',
        transition: '0.3s',
        zIndex: 10,
        overflowY: 'auto'
      }}>
        <h3>Whispers</h3>
        {posts.map((p, i) => (
          <p key={i} style={{ fontSize: 14, marginBottom: 10 }}>
            {p.content}
          </p>
        ))}
      </div>

      {/* 🔘 TOGGLE BUTTON */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 20,
          background: '#111',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        {sidebarOpen ? '←' : '→'}
      </button>

    </div>
  );
}