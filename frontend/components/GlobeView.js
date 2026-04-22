'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function GlobeView({ posts = [], onBack }) {
  const globeRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: 1200,
    height: 800
  });

  useEffect(() => {
    setMounted(true);

    const updateSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const markerPoints = useMemo(() => {
    const locationGroups = new Map();

    posts.forEach((p, index) => {
      const baseLat = Number(p?.lat ?? 12.9716);
      const baseLng = Number(p?.lng ?? 77.5946);
      const key = `${baseLat.toFixed(3)}-${baseLng.toFixed(3)}`;

      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }

      locationGroups.get(key).push({
        id: index,
        baseLat,
        baseLng,
        text: p?.content ?? 'No comment available'
      });
    });

    const spreadPoints = [];

    locationGroups.forEach((items) => {
      const total = items.length;
      const radius = total > 1 ? 0.35 : 0;

      items.forEach((item, i) => {
        const angle = total > 1 ? (i / total) * Math.PI * 2 : 0;
        const latOffset = total > 1 ? Math.cos(angle) * radius : 0;
        const lngOffset = total > 1 ? Math.sin(angle) * radius : 0;

        spreadPoints.push({
          id: item.id,
          lat: item.baseLat + latOffset,
          lng: item.baseLng + lngOffset,
          text: item.text
        });
      });
    });

    return spreadPoints;
  }, [posts]);

  useEffect(() => {
    if (!mounted || !globeRef.current) return;

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
    controls.enableZoom = true;
    controls.enablePan = false;

    globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 1.75 }, 0);
  }, [mounted, screenSize]);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  if (!mounted) return null;

  return (
    <div style={styles.page}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        style={styles.particles}
        options={{
          fullScreen: { enable: false },
          background: { color: 'transparent' },
          particles: {
            number: { value: 16 },
            color: { value: ['#f8fafc', '#d1d5db', '#94a3b8'] },
            opacity: { value: 0.05 },
            size: { value: { min: 1, max: 2 } },
            move: { enable: false }
          },
          detectRetina: true
        }}
      />

      <div style={styles.backTextLeft}>WHIS</div>
      <div style={styles.backTextRight}>PERS</div>

      <div style={styles.glow} />

      <button
        onClick={() => {
          if (onBack) onBack();
          else window.history.back();
        }}
        style={styles.backButton}
      >
        ← Back
      </button>

      <div style={styles.globeWrap}>
        <Globe
          ref={globeRef}
          width={screenSize.width}
          height={screenSize.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#f1f5f9"
          atmosphereAltitude={0.1}
          htmlElementsData={markerPoints}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.035}
          htmlElement={(d) => {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.width = 'max-content';
            wrapper.style.transform = 'translate(-50%, -100%)';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';

            const bubble = document.createElement('div');
            bubble.innerText = d.text;
            bubble.style.background =
              'linear-gradient(180deg, rgba(10,10,12,0.9) 0%, rgba(6,6,8,0.86) 100%)';
            bubble.style.border = '1px solid rgba(255,255,255,0.14)';
            bubble.style.color = 'rgba(255,255,255,0.88)';
            bubble.style.padding = '10px 14px';
            bubble.style.borderRadius = '16px';
            bubble.style.fontSize = '12px';
            bubble.style.fontWeight = '500';
            bubble.style.lineHeight = '1.4';
            bubble.style.textAlign = 'center';
            bubble.style.whiteSpace = 'normal';
            bubble.style.maxWidth = '220px';
            bubble.style.marginBottom = '10px';
            bubble.style.boxShadow =
              '0 0 20px rgba(255,255,255,0.05), 0 0 36px rgba(0,0,0,0.28)';
            bubble.style.backdropFilter = 'blur(8px)';
            bubble.style.WebkitBackdropFilter = 'blur(8px)';

            const pin = document.createElement('div');
            pin.style.width = '16px';
            pin.style.height = '16px';
            pin.style.background = 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)';
            pin.style.borderRadius = '50% 50% 50% 0';
            pin.style.transform = 'rotate(-45deg)';
            pin.style.position = 'relative';
            pin.style.boxShadow = '0 0 10px rgba(255,255,255,0.16)';

            const innerDot = document.createElement('div');
            innerDot.style.width = '6px';
            innerDot.style.height = '6px';
            innerDot.style.background = '#ffffff';
            innerDot.style.borderRadius = '50%';
            innerDot.style.position = 'absolute';
            innerDot.style.top = '5px';
            innerDot.style.left = '5px';

            pin.appendChild(innerDot);
            wrapper.appendChild(bubble);
            wrapper.appendChild(pin);

            return wrapper;
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'fixed',
    inset: 0,
    background: '#000',
    overflow: 'hidden',
    zIndex: 999
  },
  particles: {
    position: 'absolute',
    inset: 0,
    zIndex: 0
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '68vw',
    height: '68vw',
    maxWidth: '900px',
    maxHeight: '900px',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(255,255,255,0.11) 0%, rgba(226,232,240,0.07) 28%, rgba(148,163,184,0.04) 48%, rgba(0,0,0,0) 72%)',
    filter: 'blur(46px)',
    zIndex: 1,
    pointerEvents: 'none'
  },
  backTextLeft: {
    position: 'absolute',
    left: '5%',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 'clamp(70px, 10vw, 160px)',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.055)',
    letterSpacing: '-0.05em',
    zIndex: 1,
    pointerEvents: 'none',
    userSelect: 'none'
  },
  backTextRight: {
    position: 'absolute',
    right: '5%',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 'clamp(70px, 10vw, 160px)',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.055)',
    letterSpacing: '-0.05em',
    zIndex: 1,
    pointerEvents: 'none',
    userSelect: 'none'
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 5,
    background: 'rgba(10,10,12,0.88)',
    color: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 0 12px rgba(255,255,255,0.03)'
  },
  globeWrap: {
    position: 'absolute',
    inset: 0,
    zIndex: 2
  }
};