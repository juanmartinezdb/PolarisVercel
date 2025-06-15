import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import './ColorPicker.css';

const PRESET_COLORS = [
  '#FF6B35', '#F7931E', '#FFD700', '#9ACD32',
  '#4ECDC4', '#45B7D1', '#6C5CE7', '#A29BFE',
  '#FD79A8', '#E84393', '#00B894', '#00CEC9',
  '#0984E3', '#FDCB6E'
];

function ColorPicker({ value = '#FFD700', onChange, disabled = false }) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handlePresetClick = (color) => {
    if (disabled) return;
    onChange(color);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (color) => {
    if (disabled) return;
    onChange(color);
  };

  return (
    <div className={`color-picker-container ${disabled ? 'disabled' : ''}`}>
      <label>Color:</label>
      
      <div className="color-preview" style={{ backgroundColor: value }}>
        <span className="color-value">{value}</span>
      </div>

      <div className="preset-colors">
        {PRESET_COLORS.map((color, index) => (
          <button
            key={`${color}-${index}`}
            type="button"
            className={`preset-color ${value === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handlePresetClick(color)}
            disabled={disabled}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>

      <div className="custom-picker-section">
        <button
          type="button"
          className={`custom-picker-toggle ${showCustomPicker ? 'active' : ''}`}
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          disabled={disabled}
        >
          {showCustomPicker ? 'Ocultar Personalizado' : 'Color Personalizado'}
        </button>

        {showCustomPicker && (
          <div className="chakra-color-picker-wrapper">
            <HexColorPicker
              color={value} 
              onChange={handleCustomColorChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ColorPicker;