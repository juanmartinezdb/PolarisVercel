import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sword, Map, BookOpen, Flag, Library, Star, Search, X, Plus } from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { taskService } from '../../services/taskService';
import AvatarDropdown from './AvatarDropdown';
import UserProfile from '../user/UserProfile';
import UserSettings from '../user/UserSettings';
import FormModal from '../ui/FormModal';
import ItemModal from '../ui/ItemModal';
import './TopBar.css';

const NAVIGATION_ITEMS = [
  { path: '/logbook', label: 'Bitácora', icon: BookOpen },
  { path: '/compendium', label: 'Compendium', icon: Library }
];

import campaignsIcon from '../../assets/images/types/campaigns.png';
import openQuestIcon from '../../assets/images/types/openquest.png';
import closedQuestIcon from '../../assets/images/types/closedquest.png';
import commissionIcon from '../../assets/images/types/commission.png';
import dailiesIcon from '../../assets/images/types/dailies.png';
import raidsIcon from '../../assets/images/types/raid.png';
import rumorIcon from '../../assets/images/types/rumor.png';

const CREATE_OPTIONS = [
  { id: 'campaigns', label: 'Campaña', icon: campaignsIcon },
  { id: 'open_quest', label: 'Misión Abierta', icon: openQuestIcon },
  { id: 'closed_quest', label: 'Misión Cerrada', icon: closedQuestIcon },
  { id: 'commission', label: 'Encargo', icon: commissionIcon },
  { id: 'dailies', label: 'Diaria', icon: dailiesIcon },
  { id: 'raids', label: 'Raid', icon: raidsIcon },
  { id: 'rumor', label: 'Rumor', icon: rumorIcon }
];

function TopBar({ onElementCreated }) {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedElementType, setSelectedElementType] = useState(null);
  
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedSearchItem, setSelectedSearchItem] = useState(null);
  
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleSettingsClick = () => {
    setShowSettingsModal(true);
  };



  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        setSearchLoading(true);
        const [tasks, dailies, raids, campaignsData] = await Promise.all([
          taskService.getTasks(),
          taskService.getDailies(),
          taskService.getRaids(),
          campaignService.getCampaigns()
        ]);

        const allItems = [
          ...campaignsData.map(item => ({ ...item, type: 'campaign' })),
          ...tasks.map(item => ({ ...item, type: getTaskType(item.task_type) })),
          ...dailies.map(item => ({ ...item, type: 'daily' })),
          ...raids.map(item => ({ ...item, type: 'raid' }))
        ];

        const filtered = allItems.filter(item => {
          const searchTerm = searchQuery.toLowerCase();
          const title = (item.title || item.name || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          return title.includes(searchTerm) || description.includes(searchTerm);
        });

        setSearchResults(filtered.slice(0, 10));
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCreateDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTaskType = (taskType) => {
    switch (taskType) {
      case 'open_quest': return 'open_quest';
      case 'closed_quest': return 'closed_quest';
      case 'commission': return 'commission';
      case 'rumor': return 'rumor';
      default: return taskType;
    }
  };

  const getItemIcon = (type) => {
    const iconMap = {
      campaign: campaignsIcon,
      campaigns: campaignsIcon,
      open_quest: openQuestIcon,
      closed_quest: closedQuestIcon,
      commission: commissionIcon,
      daily: dailiesIcon,
      dailies: dailiesIcon,
      raid: raidsIcon,
      raids: raidsIcon,
      rumor: rumorIcon
    };
    return iconMap[type] || openQuestIcon;
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleCreateOption = (optionId) => {
    setIsCreateDropdownOpen(false);
    setSelectedElementType(optionId);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (formData) => {
    try {
      let newItem;
      switch (selectedElementType) {
        case 'campaigns':
          newItem = await campaignService.createCampaign(formData);
          break;
        case 'open_quest':
        case 'closed_quest':
        case 'commission':
        case 'rumor':
          newItem = await taskService.createTask(formData);
          break;
        case 'dailies':
          newItem = await taskService.createDaily(formData);
          break;
        case 'raids':
          newItem = await taskService.createRaid(formData);
          break;
        default:
          throw new Error('Tipo de elemento no válido');
      }
      
      if (onElementCreated) {
        onElementCreated(newItem, selectedElementType);
      }
    } catch (error) {
      console.error('Error creating element:', error);
      throw error;
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedElementType(null);
  };

  const handleSearchResultClick = (item) => {
    setSelectedSearchItem(item);
    setShowSearchModal(true);
    setShowSearchResults(false);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSelectedSearchItem(null);
  };

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-content">
          <div className="logo-section">
            <Link to="/calendar" className="logo">
              <Star className="logo-icon" />
              <span>Iter Polaris</span>
            </Link>
          </div>

          <nav className="navigation">
            {NAVIGATION_ITEMS.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className="nav-link"
              >
                <Icon size={18} className="nav-icon" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Search Section */}
          <div className="search-section" ref={searchRef}>
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="clear-search-btn"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              

            </div>

            {showSearchResults && (
              <div className="search-results-dropdown">
                {searchLoading ? (
                  <div className="search-loading">
                    <div className="loading-spinner"></div>
                    <span>Buscando...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="search-results-list">
                    {searchResults.map((item, index) => (
                      <div
                        key={`${item.type}-${item.id}-${index}`}
                        className="search-result-item"
                        onClick={() => handleSearchResultClick(item)}
                      >
                        <img src={getItemIcon(item.type)} alt={item.type} className="result-icon" />
                        <div className="result-content">
                          <div className="result-title">{item.title || item.name}</div>
                          <div className="result-description">
                            {item.description && item.description.length > 30
                              ? `${item.description.substring(0, 30)}...`
                              : item.description || 'Sin descripción'
                            }
                          </div>
                          <div className="result-type">{item.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-search-results">
                    No se encontraron resultados para "{searchQuery}"
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="create-section" ref={dropdownRef}>
            <button 
              className="create-btn"
              onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
              aria-expanded={isCreateDropdownOpen}
            >
              <Plus size={16} />
              <span>Crear</span>
            </button>
            
            {isCreateDropdownOpen && (
              <div className="create-dropdown">
                {CREATE_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    className="create-option"
                    onClick={() => handleCreateOption(option.id)}
                  >
                    <img src={option.icon} alt={option.label} className="option-icon" />
                    <span className="option-label">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="user-section">
            <div className="user-info">
              <div className="user-details">
                <div className="user-name-container">
                  <span className="user-name">{user?.username?.toUpperCase()}</span>
                  <div className="level-badge">Nv.{user?.level}</div>
                </div>
                <div className="user-level">
                  <div className="xp-bar">
                    <div
                      className="xp-fill"
                      style={{ width: `${user?.xp_progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <AvatarDropdown 
              onProfileClick={handleProfileClick}
              onSettingsClick={handleSettingsClick}
            />
          </div>
        </div>
      </header>

      {showCreateModal && (
        <FormModal
          elementType={selectedElementType}
          onSubmit={handleCreateSubmit}
          onClose={handleCloseCreateModal}
          isVisible={showCreateModal}
          mode="create"
        />
      )}

      {showSearchModal && selectedSearchItem && (
        <ItemModal
          item={selectedSearchItem}
          onClose={handleCloseSearchModal}
        />
      )}

      {showProfileModal && (
        <UserProfile
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showSettingsModal && (
        <UserSettings
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
}

export default TopBar;