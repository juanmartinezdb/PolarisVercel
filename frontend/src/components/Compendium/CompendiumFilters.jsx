import React, { useState } from 'react';
import './CompendiumFilters.css';

const CompendiumFilters = ({ filters, onFilterChange, elementType, availableFields, campaigns }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const handleCampaignToggle = (campaignId) => {
    const currentCampaigns = filters.campaignList || [];
    const isSelected = currentCampaigns.includes(campaignId.toString());
    
    const newCampaigns = isSelected 
      ? currentCampaigns.filter(id => id !== campaignId.toString())
      : [...currentCampaigns, campaignId.toString()];
    
    handleFilterChange('campaignList', newCampaigns);
  };

  const handleCheckboxChange = (key, value, checked) => {
    const currentValues = filters[key] || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    handleFilterChange(key, newValues);
  };

  const handleActiveToggle = (checked) => {
    handleFilterChange('showInactive', checked);
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      statusList: [],
      difficultyList: [],
      dayOfWeekList: [],
      deadlineDate: '',
      showDeleted: false,
      campaignList: []
    });
  };

  return (
    <div className="compendium-filters-compact">
      <div className="filters-main-bar">
        <div className="search-section">
          <div className="search-input-wrapper">           
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Buscar..."
              className="search-input-compact"
            />
          </div>
        </div>

        {campaigns && campaigns.length > 0 && (
          <div className="campaign-buttons">
            {campaigns.map(campaign => {
              const isSelected = (filters.campaignList || []).includes(campaign.id.toString());
              return (
                <button
                  key={campaign.id}
                  className={`campaign-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCampaignToggle(campaign.id)}
                  style={{
                    '--campaign-color': campaign.color,
                    borderColor: isSelected ? campaign.color : 'transparent'
                  }}
                  title={campaign.name}
                >
                  <span 
                    className="campaign-indicator" 
                    style={{ backgroundColor: campaign.color }}
                  ></span>
                  <span className="campaign-name">{campaign.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {(elementType === 'open_quest' || elementType === 'closed_quest' || 
          elementType === 'commission' || elementType === 'rumor') && (
          <div className="external-filters">
            <div className="filter-group">
              <label className="filter-label">Estado:</label>
              <div className="status-filters">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(filters.status || []).includes('pending')}
                    onChange={(e) => handleCheckboxChange('status', 'pending', e.target.checked)}
                  />
                  Pendiente
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(filters.status || []).includes('completed')}
                    onChange={(e) => handleCheckboxChange('status', 'completed', e.target.checked)}
                  />
                  Completado
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(filters.status || []).includes('skipped')}
                    onChange={(e) => handleCheckboxChange('status', 'skipped', e.target.checked)}
                  />
                  Saltado
                </label>
              </div>
            </div>
          </div>
        )}

        {(elementType === 'raids' || elementType === 'dailies') && (
          <div className="external-filters">
            <div className="filter-group">
              <label className="checkbox-label active-filter">
                <input
                  type="checkbox"
                  checked={filters.showInactive || false}
                  onChange={(e) => handleActiveToggle(e.target.checked)}
                />
                Incluir no activas
              </label>
            </div>
          </div>
        )}

        {(elementType === 'open_quest' || elementType === 'closed_quest' || elementType === 'raids') && (
          <button 
            className="filter-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Filtros avanzados"
          >
            <span className="filter-text">Filtros</span>
          </button>
        )}
      </div>
      
      {isExpanded && (elementType === 'open_quest' || elementType === 'closed_quest' || elementType === 'raids') && (
        <div className="advanced-filters">
          <div className="filters-container">
            {(elementType === 'open_quest' || elementType === 'closed_quest') && (
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Fecha límite:</label>
                  <input
                    type="date"
                    value={filters.deadlineDate || ''}
                    onChange={(e) => handleFilterChange('deadlineDate', e.target.value)}
                    className="date-input"
                  />
                  <button 
                    className="clear-date-btn"
                    onClick={() => handleFilterChange('deadlineDate', '')}
                    title="Limpiar fecha"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {elementType === 'raids' && (
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Dificultad:</label>
                  <div className="checkbox-group horizontal">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(filters.difficulty || []).includes('easy')}
                        onChange={(e) => handleCheckboxChange('difficulty', 'easy', e.target.checked)}
                      />
                      Fácil
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(filters.difficulty || []).includes('normal')}
                        onChange={(e) => handleCheckboxChange('difficulty', 'normal', e.target.checked)}
                      />
                      Normal
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(filters.difficulty || []).includes('hard')}
                        onChange={(e) => handleCheckboxChange('difficulty', 'hard', e.target.checked)}
                      />
                      Difícil
                    </label>
                  </div>
                </div>
              </div>
            )}

            {elementType === 'raids' && (
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Día de la semana:</label>
                  <div className="checkbox-group horizontal">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, index) => {
                      const dayValue = index === 6 ? 0 : index + 1;
                      return (
                        <label key={index} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={(filters.dayOfWeek || []).includes(dayValue)}
                            onChange={(e) => handleCheckboxChange('dayOfWeek', dayValue, e.target.checked)}
                          />
                          {day}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>


        </div>
      )}
    </div>
  );
};

export default CompendiumFilters;