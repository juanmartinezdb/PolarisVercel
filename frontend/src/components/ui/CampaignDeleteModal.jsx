import React, { useState } from 'react';
import { STATUS_ICONS } from '../../utils/imageUtils';
import './Modal.css';
import './CampaignDeleteModal.css';

const deleteIcon = STATUS_ICONS.delete;

const CampaignDeleteModal = ({ campaign, onConfirm, onClose }) => {
  const [transferItems, setTransferItems] = useState(true);

  const handleConfirm = () => {
    onConfirm(transferItems);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal campaign-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><img src={deleteIcon} alt="Eliminar" style={{width: '48px', height: '48px', marginRight: '12px'}} /> Eliminar Campaña</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="delete-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <p>
                ¿Estás seguro de que quieres eliminar la campaña 
                <strong>"{campaign.name}"</strong>?
              </p>
              <p className="warning-note">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <div className="campaign-delete-options">
            <h3>¿Qué hacer con el contenido de la campaña?</h3>
            
            <div className="option-group">
              <label className="option-item">
                <input
                  type="radio"
                  name="deleteOption"
                  value="transfer"
                  checked={transferItems}
                  onChange={() => setTransferItems(true)}
                />
                <div className="option-content">
                  <div className="option-title">📦 Transferir a "Story Mode"</div>
                  <div className="option-description">
                    Todas las tareas, dailies y raids se moverán a la campaña por defecto.
                    <strong> El logbook se eliminará permanentemente.</strong>
                  </div>
                </div>
              </label>

              <label className="option-item">
                <input
                  type="radio"
                  name="deleteOption"
                  value="delete"
                  checked={!transferItems}
                  onChange={() => setTransferItems(false)}
                />
                <div className="option-content">
                  <div className="option-title"><img src={deleteIcon} alt="Eliminar" style={{width: '32px', height: '32px', marginRight: '8px'}} /> Eliminar todo</div>
                  <div className="option-description">
                    Se eliminará todo el contenido de la campaña incluyendo tareas, 
                    dailies, raids y el logbook.
                  </div>
                </div>
              </label>
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
            onClick={handleConfirm}
            className="btn btn-danger"
          >
            Eliminar Campaña
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignDeleteModal;