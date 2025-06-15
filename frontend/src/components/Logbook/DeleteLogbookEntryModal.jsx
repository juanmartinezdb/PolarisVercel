import React from 'react';
import { STATUS_ICONS } from '../../utils/imageUtils';
import '../ui/Modal.css';

const deleteIcon = STATUS_ICONS.delete;

const DeleteLogbookEntryModal = ({ entry, onConfirm, onClose }) => {
  const getEntryName = () => {
    return entry.title || 'esta entrada';
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '120px' }}>
      <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><img src={deleteIcon} alt="Eliminar" style={{width: '24px', height: '24px', marginRight: '8px'}} /> Confirmar Eliminación</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="delete-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <p>
                ¿Estás seguro de que quieres eliminar la entrada 
                <strong>"{getEntryName()}"</strong> del cuaderno?
              </p>
              <p className="warning-note">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            className="btn btn-danger"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteLogbookEntryModal;