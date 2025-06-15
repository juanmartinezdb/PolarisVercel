import React, { useState, useEffect } from 'react';
import { campaignService } from '../../services/campaignService';
import { useToast } from '../../contexts/ToastContext';
import LogbookShelf from './LogbookShelf';
import LogbookViewer from './LogbookViewer';
import './Logbook.css';

const Logbook = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showError } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const campaignsData = await campaignService.getCampaigns();
      setCampaigns(campaignsData);
    } catch (err) {
      showError('Error loading campaigns');
      console.error('Error loading campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
    setSearchTerm('');
  };

  const handleBackToShelf = () => {
    setSelectedCampaign(null);
    setSearchTerm('');
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="logbook-loading">
        <div className="rpg-spinner"></div>
        <p>Cargando cuadernos de Bitácora...</p>
      </div>
    );
  }

  return (
    <div className="logbook-container">
      {!selectedCampaign ? (
        <>
          <div className="logbook-header">
            <h1 className="logbook-title">Cuadernos de Bitácora</h1>
            <p className="logbook-subtitle">Escoje uno de tus tomos de progreso y registra tus logros de hoy</p>
          </div>

          <div className="logbook-search">
            <div className="search-container">
              <input
                type="text"
                placeholder="Encuentra el cuaderno que buscas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="logbook-search-input"
              />
            </div>
          </div>

          <LogbookShelf 
            campaigns={filteredCampaigns}
            onCampaignSelect={handleCampaignSelect}
          />
        </>
      ) : (
        <LogbookViewer 
          campaign={selectedCampaign}
          onBack={handleBackToShelf}
        />
      )}
    </div>
  );
};

export default Logbook;