import React from 'react';
import './TimeSlider.css';

const TIME_SLOTS_COUNT = 96; 
const MINUTES_PER_SLOT = 15;

function TimeSlider({ value, onChange, disabled = false }) {
    const timeToSliderValue = (timeString) => {
        if (!timeString) return 48;
        const [hours, minutes] = timeString.split(':').map(Number);
        return Math.floor((hours * 60 + minutes) / MINUTES_PER_SLOT);
    };

    const sliderValueToTime = (sliderValue) => {
        const totalMinutes = sliderValue * MINUTES_PER_SLOT;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const currentSliderValue = timeToSliderValue(value);
    const displayTime = sliderValueToTime(currentSliderValue);

    const handleSliderChange = (event) => {
        const newSliderValue = parseInt(event.target.value, 10);
        const newTime = sliderValueToTime(newSliderValue);
        onChange(newTime);
    };

    const fillPercent = (currentSliderValue / (TIME_SLOTS_COUNT - 1)) * 100;

    const getTimePeriod = (sliderValue) => {
        const hour = Math.floor((sliderValue * MINUTES_PER_SLOT) / 60);
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    };

    const timePeriod = getTimePeriod(currentSliderValue);
    const timeIcon = {
        morning: '🌞',
        afternoon: '☀️',
        evening: '🍺',
        night: '🕯️'
    }[timePeriod];

    return (
        <div className={`time-slider-container ${disabled ? 'disabled' : ''}`}>
            <label htmlFor="time-slider-input">Hora:
                <span className={`time-value-display ${timePeriod}`}>
                    <span className="time-icon" role="img" aria-label={timePeriod}>{timeIcon}</span>
                    {displayTime}
                </span>
            </label>
            <input
                type="range"
                id="time-slider-input"
                min={0}
                max={TIME_SLOTS_COUNT - 1}
                step={1}
                value={currentSliderValue}
                onChange={handleSliderChange}
                disabled={disabled}
                className="time-slider-input"
                style={{ '--fill-percent': `${fillPercent}%` }}
            />

        </div>
    );
}

export default TimeSlider;