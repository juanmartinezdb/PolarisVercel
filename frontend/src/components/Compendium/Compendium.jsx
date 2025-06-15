import React, { useState, useEffect } from 'react';
import { campaignService } from '../../services/campaignService';
import { taskService } from '../../services/taskService';
import { useToast } from '../../contexts/ToastContext';
import CompendiumTable from './CompendiumTable';
import CompendiumFilters from './CompendiumFilters';
import FormModal from '../ui/FormModal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import CampaignDeleteModal from '../ui/CampaignDeleteModal';
import './Compendium.css';

const ELEMENT_TYPES = {
  CAMPAIGNS: 'campaigns',
  OPEN_QUEST: 'open_quest',
  CLOSED_QUEST: 'closed_quest',
  DAILIES: 'dailies',
  RAIDS: 'raids',
  COMMISSION: 'commission',
  RUMOR: 'rumor'
};

const ELEMENT_TYPE_LABELS = {
  [ELEMENT_TYPES.CAMPAIGNS]: 'Campañas',
  [ELEMENT_TYPES.OPEN_QUEST]: 'Misiones Abiertas',
  [ELEMENT_TYPES.CLOSED_QUEST]: 'Misiones Cerradas',
  [ELEMENT_TYPES.DAILIES]: 'Diarias',
  [ELEMENT_TYPES.RAIDS]: 'Raids',
  [ELEMENT_TYPES.COMMISSION]: 'Encargos',
  [ELEMENT_TYPES.RUMOR]: 'Rumores'
};

const ELEMENT_TYPE_ICONS = {
  [ELEMENT_TYPES.CAMPAIGNS]: '/src/assets/images/types/campaigns.png',
  [ELEMENT_TYPES.OPEN_QUEST]: '/src/assets/images/types/openquest.png',
  [ELEMENT_TYPES.CLOSED_QUEST]: '/src/assets/images/types/closedquest.png',
  [ELEMENT_TYPES.DAILIES]: '/src/assets/images/types/dailies.png',
  [ELEMENT_TYPES.RAIDS]: '/src/assets/images/types/raid.png',
  [ELEMENT_TYPES.COMMISSION]: '/src/assets/images/types/commission.png',
  [ELEMENT_TYPES.RUMOR]: '/src/assets/images/types/rumor.png'
};

const Compendium = () => {
  const [selectedType, setSelectedType] = useState(ELEMENT_TYPES.CAMPAIGNS);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    statusList: [],
    difficultyList: [],
    dayOfWeekList: [],
    deadlineDate: '',
    showDeleted: false,
    campaignList: []
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    loadData();
    loadUserFilters();
  }, [selectedType]);

  useEffect(() => {
    const handleSettingsChange = () => {
      loadUserFilters();
    };

    window.addEventListener('userSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('userSettingsChanged', handleSettingsChange);
  }, [selectedType]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [data, filters, sortConfig]);

  const loadCampaigns = async () => {
    try {
      const campaignsData = await campaignService.getCampaigns();
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
  };

  const loadUserFilters = () => {
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      const compendiumSettings = userSettings.compendium || {};
      
      let newFilters = {
        search: '',
        statusList: [],
        difficultyList: [],
        dayOfWeekList: [],
        deadlineDate: '',
        showDeleted: false,
        campaignList: [],
        status: [],
        showInactive: false
      };

      if (selectedType === ELEMENT_TYPES.OPEN_QUEST || 
          selectedType === ELEMENT_TYPES.CLOSED_QUEST ||
          selectedType === ELEMENT_TYPES.COMMISSION ||
          selectedType === ELEMENT_TYPES.RUMOR) {
        
        const statusFilters = [];
        if (compendiumSettings.statusesPending) statusFilters.push('pending');
        if (compendiumSettings.statusesCompleted) statusFilters.push('completed');
        if (compendiumSettings.statusesSkipped) statusFilters.push('skipped');
        
        newFilters.status = statusFilters;
      }

      if (selectedType === ELEMENT_TYPES.RAIDS || selectedType === ELEMENT_TYPES.DAILIES) {
        newFilters.showInactive = !compendiumSettings.onlyActiveRaidsAndDailies;
      }

      setFilters(newFilters);
    } catch (error) {
      console.error('Error loading user filters:', error);
      setFilters({
        search: '',
        statusList: [],
        difficultyList: [],
        dayOfWeekList: [],
        deadlineDate: '',
        showDeleted: false,
        campaignList: [],
        status: [],
        showInactive: false
      });
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let result = [];
      
      switch (selectedType) {
        case ELEMENT_TYPES.CAMPAIGNS:
          result = await campaignService.getCampaigns();
          break;
        case ELEMENT_TYPES.OPEN_QUEST:
        case ELEMENT_TYPES.CLOSED_QUEST:
        case ELEMENT_TYPES.COMMISSION:
        case ELEMENT_TYPES.RUMOR:
          result = await taskService.getTasks({ type: selectedType });
          break;
        case ELEMENT_TYPES.DAILIES:
          result = await taskService.getDailies();
          break;
        case ELEMENT_TYPES.RAIDS:
          result = await taskService.getRaids();
          break;
        default:
          result = [];
      }
      
      setData(result);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
      showError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...data];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableFields = getSearchableFields(item);
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }
    
    if (filters.campaignList && filters.campaignList.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedType === ELEMENT_TYPES.CAMPAIGNS) {
          return filters.campaignList.includes(item.id.toString());
        }
        return filters.campaignList.includes(item.campaign_id?.toString());
      });
    }
    
    if (filters.statusList && filters.statusList.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedType === ELEMENT_TYPES.CAMPAIGNS) {
          return filters.statusList.includes(item.is_default ? 'default' : 'normal');
        }
        return filters.statusList.includes(item.status);
      });
    }

    if (filters.status && filters.status.length > 0 && hasField('status')) {
      filtered = filtered.filter(item => {
        if (selectedType === ELEMENT_TYPES.CAMPAIGNS) {
          return filters.status.includes(item.is_default ? 'default' : 'normal');
        }
        return filters.status.includes(item.status);
      });
    }
    
    if (filters.difficultyList && filters.difficultyList.length > 0 && hasField('difficulty')) {
      filtered = filtered.filter(item => filters.difficultyList.includes(item.difficulty));
    }

    if (filters.difficulty && filters.difficulty.length > 0 && hasField('difficulty')) {
      filtered = filtered.filter(item => filters.difficulty.includes(item.difficulty));
    }
    
    if (filters.dayOfWeekList && filters.dayOfWeekList.length > 0 && hasField('day_of_week')) {
      filtered = filtered.filter(item => filters.dayOfWeekList.includes(item.day_of_week?.toString()));
    }

    if (filters.dayOfWeek && filters.dayOfWeek.length > 0 && hasField('day_of_week')) {
      filtered = filtered.filter(item => filters.dayOfWeek.includes(item.day_of_week));
    }
    
    if (filters.deadlineDate && hasField('due_date')) {
      const filterDate = new Date(filters.deadlineDate);
      filtered = filtered.filter(item => {
        if (!item.due_date) return false;
        const itemDate = new Date(item.due_date);
        return itemDate <= filterDate;
      });
    }
    
    if (!filters.showDeleted && hasField('deleted_at')) {
      filtered = filtered.filter(item => !item.deleted_at);
    }

    if (!filters.showInactive && hasField('is_active')) {
      filtered = filtered.filter(item => item.is_active !== false);
    }
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (aValue > bValue) comparison = 1;
        if (aValue < bValue) comparison = -1;
        
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    
    setFilteredData(filtered);
  };

  const getSearchableFields = (item) => {
    const commonFields = [item.name, item.title, item.description];
    
    switch (selectedType) {
      case ELEMENT_TYPES.CAMPAIGNS:
        return [...commonFields];
      default:
        return [...commonFields, item.notes];
    }
  };

  const hasField = (fieldName) => {
    if (data.length === 0) return false;
    return data[0].hasOwnProperty(fieldName);
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    loadData();
    loadCampaigns();
  };

  const getColumns = () => {
    switch (selectedType) {
      case ELEMENT_TYPES.CAMPAIGNS:
        return [
          { key: 'name', label: 'Nombre', sortable: true },
          { key: 'description', label: 'Descripción', sortable: true },
          { key: 'color', label: 'Color', sortable: false },
          { key: 'created_at', label: 'Fecha Creación', sortable: true },
          { key: 'actions', label: 'Acciones', sortable: false }
        ];
      case ELEMENT_TYPES.DAILIES:
        return [
          { key: 'title', label: 'Nombre', sortable: true },
          { key: 'description', label: 'Descripción', sortable: true },
          { key: 'is_active', label: 'Activo', sortable: true },
          { key: 'actions', label: 'Acciones', sortable: false }
        ];
      case ELEMENT_TYPES.RAIDS:
        return [
          { key: 'title', label: 'Nombre', sortable: true },
          { key: 'description', label: 'Descripción', sortable: true },
          { key: 'energy_value', label: 'Energía', sortable: true },
          { key: 'difficulty', label: 'Dificultad', sortable: true },
          { key: 'day_of_week', label: 'Día de la Semana', sortable: true },
          { key: 'start_time', label: 'Hora', sortable: true },
          { key: 'duration', label: 'Duración', sortable: true },
          { key: 'is_active', label: 'Activo', sortable: true },
          { key: 'actions', label: 'Acciones', sortable: false }
        ];
      case ELEMENT_TYPES.OPEN_QUEST:
        return [
          { key: 'title', label: 'Nombre', sortable: true },
          { key: 'description', label: 'Descripción', sortable: true },
          { key: 'energy_value', label: 'Energía', sortable: true },
          { key: 'status', label: 'Estado', sortable: true },
          { key: 'due_date_only', label: 'Fecha Límite', sortable: true },
          { key: 'actions', label: 'Acciones', sortable: false }
        ];
      case ELEMENT_TYPES.CLOSED_QUEST:
        return [
          { key: 'title', label: 'Nombre', sortable: true },
          { key: 'description', label: 'Descripción', sortable: true },
          { key: 'energy_value', label: 'Energía', sortable: true },
          { key: 'status', label: 'Estado', sortable: true },
          { key: 'due_datetime', label: 'Fecha y Hora', sortable: true },
          { key: 'actions', label: 'Acciones', sortable: false }
        ];
      case ELEMENT_TYPES.COMMISSION:
      case ELEMENT_TYPES.RUMOR:
        return [
          { key: 'title', label: 'Nombre', sortable: true },
          { key: 'description', label: 'Descripción', sortable: true },
          { key: 'energy_value', label: 'Energía', sortable: true },
          { key: 'status', label: 'Estado', sortable: true },
          { key: 'actions', label: 'Acciones', sortable: false }
        ];
      default:
        return [
          { key: 'title', label: 'Nombre', sortable: true },
          { key: 'description', label: 'Descripción', sortable: true },
          { key: 'actions', label: 'Acciones', sortable: false }
        ];
    }
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item) => {
    const isStoryMode = item.campaign?.is_default || item.is_default;
    if (isStoryMode) {
      showError('No se puede eliminar la campaña Story Mode');
      return;
    }
    
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleCreateSubmit = async (formData) => {
    try {
      let createdItem;
      const dataToSend = { ...formData };
      
      switch (selectedType) {
        case ELEMENT_TYPES.CAMPAIGNS:
          createdItem = await campaignService.createCampaign(dataToSend);
          await loadCampaigns();
          break;
        case ELEMENT_TYPES.OPEN_QUEST:
        case ELEMENT_TYPES.CLOSED_QUEST:
        case ELEMENT_TYPES.COMMISSION:
        case ELEMENT_TYPES.RUMOR:
          dataToSend.task_type = selectedType === ELEMENT_TYPES.OPEN_QUEST ? 'open_quest' : 
                                selectedType === ELEMENT_TYPES.CLOSED_QUEST ? 'closed_quest' :
                                selectedType === ELEMENT_TYPES.COMMISSION ? 'commission' : 'rumor';
          createdItem = await taskService.createTask(dataToSend);
          break;
        case ELEMENT_TYPES.DAILIES:
          createdItem = await taskService.createDaily(dataToSend);
          break;
        case ELEMENT_TYPES.RAIDS:
          createdItem = await taskService.createRaid(dataToSend);
          break;
        default:
          throw new Error('Tipo de elemento no soportado');
      }
      
      setData(prev => [createdItem, ...prev]);
      setShowCreateModal(false);
      showSuccess(`${ELEMENT_TYPE_LABELS[selectedType]} creado exitosamente`);
    } catch (error) {
      console.error('Error creating item:', error);
      showError('Error al crear el elemento');
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      let updatedItem;
      
      switch (selectedType) {
        case ELEMENT_TYPES.CAMPAIGNS:
          updatedItem = await campaignService.updateCampaign(selectedItem.id, formData);
          await loadCampaigns();
          break;
        case ELEMENT_TYPES.OPEN_QUEST:
        case ELEMENT_TYPES.CLOSED_QUEST:
        case ELEMENT_TYPES.COMMISSION:
        case ELEMENT_TYPES.RUMOR:
          const taskData = {
            ...formData,
            task_type: selectedType === ELEMENT_TYPES.OPEN_QUEST ? 'open_quest' : 
                       selectedType === ELEMENT_TYPES.CLOSED_QUEST ? 'closed_quest' :
                       selectedType === ELEMENT_TYPES.COMMISSION ? 'commission' : 'rumor'
          };
          updatedItem = await taskService.updateTask(selectedItem.id, taskData);
          break;
        case ELEMENT_TYPES.DAILIES:
          updatedItem = await taskService.updateDaily(selectedItem.id, formData);
          break;
        case ELEMENT_TYPES.RAIDS:
          updatedItem = await taskService.updateRaid(selectedItem.id, formData);
          break;
        default:
          throw new Error('Tipo de elemento no soportado');
      }
      
      setData(prev => prev.map(item => 
        item.id === selectedItem.id ? updatedItem : item
      ));
      
      setShowEditModal(false);
      setSelectedItem(null);
      showSuccess(`${ELEMENT_TYPE_LABELS[selectedType]} actualizado exitosamente`);
    } catch (error) {
      console.error('Error updating item:', error);
      showError('Error al actualizar el elemento');
    }
  };

  const handleDeleteConfirm = async (transferItems = true) => {
    try {
      const isStoryMode = selectedItem.campaign?.is_default || selectedItem.is_default;
      if (isStoryMode) {
        showError('No se puede eliminar la campaña Story Mode');
        return;
      }
      
      switch (selectedType) {
        case ELEMENT_TYPES.CAMPAIGNS:
          await campaignService.deleteCampaign(selectedItem.id, transferItems);
          await loadCampaigns();
          break;
        case ELEMENT_TYPES.OPEN_QUEST:
        case ELEMENT_TYPES.CLOSED_QUEST:
        case ELEMENT_TYPES.COMMISSION:
        case ELEMENT_TYPES.RUMOR:
          await taskService.deleteTask(selectedItem.id);
          break;
        case ELEMENT_TYPES.DAILIES:
          await taskService.deleteDaily(selectedItem.id);
          break;
        case ELEMENT_TYPES.RAIDS:
          await taskService.deleteRaid(selectedItem.id);
          break;
        default:
          throw new Error('Tipo de elemento no soportado');
      }
      
      setData(prev => prev.filter(item => item.id !== selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
      showSuccess(`${ELEMENT_TYPE_LABELS[selectedType]} eliminado exitosamente`);
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Error al eliminar el elemento');
    }
  };

  return (
    <div className="compendium">
      <div className="compendium-header">
        <h1 className="compendium-title">Compendium</h1>
      </div>
      
      <div className="compendium-navigation">
        <div className="navigation-tabs">
          {Object.entries(ELEMENT_TYPES).map(([key, value]) => (
            <button
              key={key}
              className={`nav-tab ${selectedType === value ? 'active' : ''}`}
              onClick={() => setSelectedType(value)}
            >
              {ELEMENT_TYPE_ICONS[value].startsWith('/') ? (
                <img className="tab-icon" src={ELEMENT_TYPE_ICONS[value]} alt={ELEMENT_TYPE_LABELS[value]} />
              ) : (
                <span className="tab-icon">{ELEMENT_TYPE_ICONS[value]}</span>
              )}
              <span className="tab-label">{ELEMENT_TYPE_LABELS[value]}</span>
            </button>
          ))}
        </div>
        <div className="navigation-actions">
          <button className="compendium-btn create" onClick={handleCreate}>
            Crear {ELEMENT_TYPE_LABELS[selectedType].slice(0, -1)}
          </button>
        </div>
      </div>
      
      <div className="compendium-content">
        <div className="compendium-section-header">
          <h2 className="section-title">
            {ELEMENT_TYPE_ICONS[selectedType].startsWith('/') ? (
              <img className="section-icon" src={ELEMENT_TYPE_ICONS[selectedType]} alt={ELEMENT_TYPE_LABELS[selectedType]} />
            ) : (
              <span className="section-icon">{ELEMENT_TYPE_ICONS[selectedType]}</span>
            )}
            {ELEMENT_TYPE_LABELS[selectedType]}
          </h2>
          <div className="section-stats">
            <span className="stats-total">
              Total: {filteredData.length}
              {filteredData.length !== data.length && (
                <span className="stats-filtered"> (de {data.length})</span>
              )}
            </span>
          </div>
        </div>
        
        <CompendiumFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          elementType={selectedType}
          campaigns={campaigns}
          availableFields={{
            hasStatus: hasField('status'),
            hasDifficulty: selectedType === ELEMENT_TYPES.RAIDS && hasField('difficulty'),
            hasDayOfWeek: selectedType === ELEMENT_TYPES.RAIDS && hasField('day_of_week'),
            hasTimeOfDay: selectedType === ELEMENT_TYPES.CLOSED_QUEST && hasField('due_time'),
            hasDeadlineDate: (selectedType === ELEMENT_TYPES.OPEN_QUEST || selectedType === ELEMENT_TYPES.CLOSED_QUEST) && hasField('due_date'),
            hasEnergyType: hasField('energy_type'),
            hasDeleted: hasField('deleted_at')
          }}
        />
        
        {isLoading ? (
          <div className="compendium-loading">
            <div className="loading-spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="compendium-error">
            <p>{error}</p>
            <button className="compendium-btn retry" onClick={handleRefresh}>
              Reintentar
            </button>
          </div>
        ) : (
          <CompendiumTable 
            data={filteredData}
            columns={getColumns()}
            sortConfig={sortConfig}
            onSort={handleSort}
            elementType={selectedType}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh} 
          />
        )}
      </div>
      
      {showCreateModal && (
        <FormModal
          elementType={selectedType}
          mode="create"
          onSubmit={handleCreateSubmit}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      
      {showEditModal && selectedItem && (
        <FormModal
          elementType={selectedType}
          mode="edit"
          editItem={selectedItem}
          onSubmit={handleEditSubmit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
        />
      )}
      
      {showDeleteModal && selectedItem && (
        selectedType === ELEMENT_TYPES.CAMPAIGNS ? (
          <CampaignDeleteModal
            campaign={selectedItem}
            onConfirm={handleDeleteConfirm}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedItem(null);
            }}
          />
        ) : (
          <DeleteConfirmModal
            elementType={selectedType}
            item={selectedItem}
            onConfirm={handleDeleteConfirm}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedItem(null);
            }}
          />
        )
      )}
    </div>
  );
};

export default Compendium;