import React from 'react';
import { STATUS_ICONS } from '../../utils/imageUtils';
import './Modal.css';

const deleteIcon = STATUS_ICONS.delete;

const DeleteConfirmModal = ({ elementType, item, onConfirm, onClose }) => {
  const getElementName = () => {
    return item.name || item.title || 'este elemento';
  };

  const getElementTypeName = () => {
    switch (elementType) {
      case 'campaigns': return 'campaña';
      case 'open_quest': return 'misión abierta';
      case 'closed_quest': return 'misión cerrada';
      case 'dailies': return 'tarea diaria';
      case 'raids': return 'raid';
      case 'commission': return 'encargo';
      case 'rumor': return 'rumor';
      default: return 'elemento';
    }
  };

  const getArticle = () => {
    switch (elementType) {
      case 'commission': return 'el';
      case 'rumor': return 'el';
      default: return 'la';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
                ¿Estás seguro de que quieres eliminar {getArticle()} {getElementTypeName()} 
                <strong>"{getElementName()}"</strong>?
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

export default DeleteConfirmModal;