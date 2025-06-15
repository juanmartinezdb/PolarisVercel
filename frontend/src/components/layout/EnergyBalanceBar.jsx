import React, { useState, useEffect, useRef } from 'react';
import { balanceService } from '../../services/balanceService';
import './EnergyBalanceBar.css';

const BURNOUT_THRESHOLD = 40;
const PROCRASTINATION_THRESHOLD = 60;

// Rutas de las imágenes de indicadores
import { BALANCE_ICONS } from '../../utils/imageUtils';

const INDICATOR_IMAGE_SOURCES = {
  BURNOUT: BALANCE_ICONS.BURNOUT,
  EQUILIBRIUM: BALANCE_ICONS.EQUILIBRIUM,
  PROCRASTINATION: BALANCE_ICONS.PROCRASTINATION,
  NEUTRAL: BALANCE_ICONS.NEUTRAL
};

const BALANCE_STATES = {
  BURNOUT: 'burnout',
  EQUILIBRIUM: 'equilibrium',
  PROCRASTINATION: 'procrastination'
};

function EnergyBalanceBar() {
  const [balance, setBalance] = useState({ percentage: 50, state: BALANCE_STATES.EQUILIBRIUM });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const [images, setImages] = useState({
    BURNOUT: null,
    EQUILIBRIUM: null,
    PROCRASTINATION: null,
    NEUTRAL: null
  });
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Cargar imágenes
  useEffect(() => {
    let loadedCount = 0;
    const numImages = Object.keys(INDICATOR_IMAGE_SOURCES).length;
    const loadedImages = {};

    Object.entries(INDICATOR_IMAGE_SOURCES).forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        loadedImages[key] = img;
        if (loadedCount === numImages) {
          setImages(loadedImages);
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === numImages) {
          setImagesLoaded(true);
        }
      };
      img.src = src;
    });
  }, []);

  // Función para cargar datos de balance
  const fetchBalance = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const balanceData = await balanceService.getEnergyBalance();
      const calculatedState = getBalanceState(balanceData.percentage);
      setBalance({
        ...balanceData,
        state: calculatedState
      });
    } catch (error) {
      console.error('Failed to fetch energy balance:', error);
      setBalance({ percentage: 50, state: BALANCE_STATES.EQUILIBRIUM });
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Cargar datos de balance al montar el componente
  useEffect(() => {
    fetchBalance();
  }, []);

  // Función para refrescar manualmente el balance
  const handleRefresh = () => {
    fetchBalance(true);
  };

  const getBalanceState = (percentage) => {
    if (percentage < BURNOUT_THRESHOLD) {
      return BALANCE_STATES.BURNOUT;
    } else if (percentage > PROCRASTINATION_THRESHOLD) {
      return BALANCE_STATES.PROCRASTINATION;
    } else {
      return BALANCE_STATES.EQUILIBRIUM;
    }
  };

  const getBalanceMessage = () => {
    switch (balance.state) {
      case BALANCE_STATES.BURNOUT:
        return 'Zona de Burnout';
      case BALANCE_STATES.PROCRASTINATION:
        return 'Zona de Procrastinación';
      case BALANCE_STATES.EQUILIBRIUM:
        return 'Zona de Equilibrio';
      default:
        return 'Neutral';
    }
  };

  // Animación del canvas
  useEffect(() => {
    if (!balance || loading || !imagesLoaded || !canvasRef.current) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationRunning = true;

    const draw = (timestamp) => {
      if (!animationRunning || !canvasRef.current) return;
      
      const dpr = window.devicePixelRatio || 1;
      const parentElement = canvasRef.current.parentElement;
      if (!parentElement) return;

      const rect = parentElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animationFrameIdRef.current = requestAnimationFrame(draw);
        return;
      }
      
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }
      const renderWidth = rect.width;
      const renderHeight = rect.height;

      ctx.clearRect(0, 0, renderWidth, renderHeight);

      // Definir parámetros visuales según el estado
      let baseColor, glowColor, particleColor, waveFrequency, waveAmplitude, particleSpeed, starImage;
      const now = timestamp / 1000;

      switch (balance.state) {
        case BALANCE_STATES.BURNOUT:
          baseColor = 'rgba(255, 107, 107, 0.7)';
          glowColor = 'rgba(255, 107, 107, 0.5)';
          particleColor = 'rgba(255, 107, 107, 0.8)';
          waveFrequency = 0.05;
          waveAmplitude = renderHeight * 0.15;
          particleSpeed = 0.8;
          starImage = images.BURNOUT || images.NEUTRAL;
          break;
        case BALANCE_STATES.PROCRASTINATION:
          baseColor = 'rgba(33, 150, 243, 0.7)';
          glowColor = 'rgba(33, 150, 243, 0.4)';
          particleColor = 'rgba(33, 150, 243, 0.6)';
          waveFrequency = 0.02;
          waveAmplitude = renderHeight * 0.05;
          particleSpeed = 0.2;
          starImage = images.PROCRASTINATION || images.NEUTRAL;
          break;
        case BALANCE_STATES.EQUILIBRIUM:
        default:
          baseColor = 'rgba(76, 175, 80, 0.7)';
          glowColor = 'rgba(76, 175, 80, 0.5)';
          particleColor = 'rgba(76, 175, 80, 0.7)';
          waveFrequency = 0.03;
          waveAmplitude = renderHeight * 0.1;
          particleSpeed = 0.5;
          starImage = images.EQUILIBRIUM || images.NEUTRAL;
          break;
      }
      
      // Fondo sutil
      ctx.fillStyle = 'rgba(44, 24, 16, 0.4)';
      ctx.fillRect(0, 0, renderWidth, renderHeight);

      // Zona óptima destacada
      const optimalZoneStart = renderWidth * (BURNOUT_THRESHOLD / 100);
      const optimalZoneEnd = renderWidth * (PROCRASTINATION_THRESHOLD / 100);
      const optimalZoneWidth = optimalZoneEnd - optimalZoneStart;

      const optimalGradient = ctx.createLinearGradient(
        optimalZoneStart - optimalZoneWidth * 0.3, 0,
        optimalZoneEnd + optimalZoneWidth * 0.3, 0
      );
      optimalGradient.addColorStop(0, 'rgba(76, 175, 80, 0)');
      optimalGradient.addColorStop(0.3, 'rgba(76, 175, 80, 0.15)');
      optimalGradient.addColorStop(0.5, 'rgba(76, 175, 80, 0.25)');
      optimalGradient.addColorStop(0.7, 'rgba(76, 175, 80, 0.15)');
      optimalGradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
      ctx.fillStyle = optimalGradient;
      ctx.fillRect(
        optimalZoneStart - optimalZoneWidth * 0.3, 0,
        optimalZoneWidth * 1.6, renderHeight
      );

      // Ondas cósmicas
      const centerY = renderHeight / 2;
      const numWaves = 2;
      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        const wavePhase = now * particleSpeed * (0.8 + i * 0.4);
        const currentWaveAmplitude = waveAmplitude * (1 - i * 0.3);
        ctx.moveTo(0, centerY);
        for (let x = 0; x <= renderWidth; x += 5) {
          const y = centerY + Math.sin(x * waveFrequency + wavePhase + i * Math.PI / 2) * 
                   currentWaveAmplitude * (Math.sin(x / (renderWidth / (Math.PI * 2))) + 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(renderWidth, renderHeight);
        ctx.lineTo(0, renderHeight);
        ctx.closePath();
        
        const waveAlpha = 0.15 - i * 0.05;
        ctx.fillStyle = balance.state === BALANCE_STATES.BURNOUT ? 
          `rgba(255, 107, 107, ${waveAlpha})` :
          balance.state === BALANCE_STATES.PROCRASTINATION ? 
          `rgba(33, 150, 243, ${waveAlpha})` :
          `rgba(76, 175, 80, ${waveAlpha})`;
        ctx.fill();
      }
      
      // Dibujar el indicador estrella
      const indicatorPosition = renderWidth * (balance.percentage / 100);
      const starSize = renderHeight * 1.5;
      const starX = Math.max(starSize / 2, Math.min(renderWidth - starSize / 2, indicatorPosition)) - starSize / 2;
      const starY = centerY - starSize / 2;

      if (starImage && starImage.complete && starImage.naturalWidth > 0) {
        const pulse = (Math.sin(now * 1.5) + 1) / 2;
        const shadowBlur = 5 + pulse * 10;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.drawImage(starImage, starX, starY, starSize, starSize);
        ctx.shadowBlur = 0;
      } else {
        // Fallback: círculo simple
        ctx.beginPath();
        ctx.arc(indicatorPosition, centerY, renderHeight * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = particleColor || '#d4af37';
        ctx.fill();
      }
      
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw(performance.now());

    return () => {
      animationRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [balance, loading, imagesLoaded, images]);

  const renderContent = () => {
    if (loading && !balance) {
      return <div className="energy-balance-status-text">Cargando flujo de energía...</div>;
    }
    if (!balance) {
      return <div className="energy-balance-status-text">Datos de energía no disponibles.</div>;
    }
    return null;
  };

  const displayPercentage = balance ? balance.percentage : '--';

  return (
    <div className="energy-balance-bar-container">
      <div 
        className={`energy-bar-canvas-wrapper ${refreshing ? 'refreshing' : ''}`}
        onClick={handleRefresh}
        title="Click para actualizar balance de energía"
      >
        <canvas ref={canvasRef} />
        {renderContent()}
      </div>
      <span className="percentage">{displayPercentage}%</span>
    </div>
  );
}

export default EnergyBalanceBar;