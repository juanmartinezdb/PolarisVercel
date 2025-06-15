import React, { useState } from 'react';
import './LogbookShelf.css';

const BOOK_COLORS = [
  '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B22222',
  '#228B22', '#4682B4', '#9932CC', '#FF8C00', '#DC143C'
];

const ZODIAC_SYMBOLS = [
  '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓'
];

const LogbookShelf = ({ campaigns, onCampaignSelect }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipText, setTooltipText] = useState('')

  const getBookColor = (index) => {
    return BOOK_COLORS[index % BOOK_COLORS.length];
  };

  const getBookHeight = (index) => {
    const heights = [180, 200, 160, 190, 170, 185];
    return heights[index % heights.length];
  };

  const getBookWidth = (index) => {
    const widths = [40, 45, 35, 50, 38, 42];
    return widths[index % widths.length];
  };

  const getZodiacSymbol = (index) => {
    return ZODIAC_SYMBOLS[index % ZODIAC_SYMBOLS.length];
  };

  const handleMouseEnter = (e, campaignName) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
    setTooltipText(campaignName)
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  if (campaigns.length === 0) {
    return (
      <div className="empty-shelf">
        <div className="shelf-wood"></div>
        <p className="empty-message">El cuaderno que buscas está en otro castillo...</p>
      </div>
    );
  }

  return (
    <div className="logbook-shelf">
      <div className="shelf-background"></div>
      <div className="books-container">
        {campaigns.map((campaign, index) => (
          <div
            key={campaign.id}
            className="book-spine"
            style={{
              backgroundColor: campaign.color || getBookColor(index),
              height: `${getBookHeight(index)}px`,
              width: `${getBookWidth(index)}px`
            }}
            onClick={() => onCampaignSelect(campaign)}
            onMouseEnter={(e) => handleMouseEnter(e, campaign.name)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="book-title">
              <span className="book-text">{campaign.name}</span>
            </div>
            <div className="book-decoration">
              <div className="book-line"></div>
              <div className="book-symbol">{getZodiacSymbol(index)}</div>
              <div className="book-line"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="shelf-wood bottom-shelf"></div>
      
      {showTooltip && (
        <div 
          className="book-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          Abrir cuaderno de {tooltipText}
        </div>
      )}
    </div>
  );
};

export default LogbookShelf;