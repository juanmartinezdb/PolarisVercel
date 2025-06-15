import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import logbookService from '../../services/logbookService';
import { useToast } from '../../contexts/ToastContext';
import LogbookEntry from './LogbookEntry';
import LogbookEditor from './LogbookEditor';
import './LogbookViewer.css';

const LogbookViewer = ({ campaign, onBack }) => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadEntries();
  }, [campaign.id]);

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch();
    } else {
      setShowSearchResults(false);
      setFilteredEntries(entries);
    }
  }, [searchTerm, entries]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const entriesData = await logbookService.getLogbookEntries(campaign.id);
      setEntries(entriesData);
      setFilteredEntries(entriesData);
    } catch (err) {
      showError('Error loading logbook entries');
      console.error('Error loading entries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const results = await logbookService.searchEntries(campaign.id, searchTerm);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to local search
      const localResults = entries.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(localResults);
      setShowSearchResults(true);
    }
  };

  const handleSearchResultSelect = (entry) => {
    setSelectedEntry(entry);
    setShowSearchResults(false);
    setSearchTerm('');
  };

  const checkTodayEntry = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return entries.find(entry => {
      const entryDate = format(new Date(entry.entry_date), 'yyyy-MM-dd');
      return entryDate === today;
    });
  };

  const handleNewEntry = () => {
    const todayEntry = checkTodayEntry();
    if (todayEntry) {
      showError('Ya tienes una entrada hoy, haz click sobre ella si quieres editarla');
      return;
    }
    setIsCreating(true);
  };

  const handleSaveEntry = async (entryData) => {
    try {
      await loadEntries();
      setIsEditing(false);
      setIsCreating(false);
      setSelectedEntry(null);
    } catch (err) {
      showError('Error guardando entrada');
      console.error('Error saving entry:', err);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await logbookService.deleteLogbookEntry(entryId);
      showSuccess('Entrada del cuaderno borrada con éxito');
      await loadEntries();
      setSelectedEntry(null);
    } catch (err) {
      showError('Error al borrar la entrada');
      console.error('Error deleting entry:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="logbook-loading">
        <div className="rpg-spinner"></div>
        <p>Opening the tome...</p>
      </div>
    );
  }

  if (isEditing || isCreating) {
    return (
      <LogbookEditor
        entry={selectedEntry}
        campaign={campaign}
        isCreating={isCreating}
        onSave={handleSaveEntry}
        onCancel={() => {
          setIsEditing(false);
          setIsCreating(false);
          setSelectedEntry(null);
        }}
      />
    );
  }

  if (selectedEntry) {
    return (
      <LogbookEntry
        entry={selectedEntry}
        onEdit={(entry) => {
          setSelectedEntry(entry);
          setIsEditing(true);
        }}
        onDelete={handleDeleteEntry}
        onBack={() => setSelectedEntry(null)}
        isEditable={true}
      />
    );
  }

  return (
    <div className="logbook-viewer">
      <div className="logbook-viewer-header">
        <button className="back-button" onClick={onBack}>
          ← Volver al estante
        </button>
        <h1 className="campaign-title">Cuaderno de {campaign.name}</h1>
        <button 
          className="new-entry-button"
          onClick={handleNewEntry}
        >
          Nueva entrada
        </button>
      </div>

      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Busca en el cuaderno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="logbook-search-input"
          />
        </div>
        
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.map(entry => (
              <div
                key={entry.id}
                className="search-result-item"
                onClick={() => handleSearchResultSelect(entry)}
              >
                <div className="result-title">{entry.title}</div>
                <div className="result-date">{format(new Date(entry.entry_date), 'MMM dd, yyyy')}</div>
                <div className="result-preview">
                  {entry.content.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="entries-list">
        {filteredEntries.length === 0 ? (
          <div className="empty-entries">
            <div className="empty-book-icon">
              <img src="/src/assets/images/spell-book.png" alt="Spell Book" />
            </div>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="entry-card"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="entry-date">
                {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
              </div>
              <h3 className="entry-title">{entry.title}</h3>
              <div className="entry-preview">
                {entry.content.substring(0, 150)}...
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogbookViewer;