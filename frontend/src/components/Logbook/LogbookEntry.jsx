import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DeleteLogbookEntryModal from './DeleteLogbookEntryModal';
import { STATUS_ICONS } from '../../utils/imageUtils';
import './LogbookEntry.css';

const editIcon = STATUS_ICONS.edit;
const deleteIcon = STATUS_ICONS.delete;

const MARKDOWN_COMPONENTS = {
  h1: ({ children }) => <h1 className="logbook-entry-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="logbook-entry-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="logbook-entry-h3">{children}</h3>,
  p: ({ children }) => <p className="logbook-entry-paragraph">{children}</p>,
  ul: ({ children }) => <ul className="logbook-entry-list">{children}</ul>,
  ol: ({ children }) => <ol className="logbook-entry-ordered-list">{children}</ol>,
  li: ({ children }) => <li className="logbook-entry-list-item">{children}</li>,
  blockquote: ({ children }) => <blockquote className="logbook-entry-quote">{children}</blockquote>,
  code: ({ children, inline }) => 
    inline ? 
      <code className="logbook-entry-inline-code">{children}</code> : 
      <code className="logbook-entry-code-block">{children}</code>,
  pre: ({ children }) => <pre className="logbook-entry-pre">{children}</pre>,
  strong: ({ children }) => <strong className="logbook-entry-bold">{children}</strong>,
  em: ({ children }) => <em className="logbook-entry-italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} className="logbook-entry-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  hr: () => <hr className="logbook-entry-divider" />,
  table: ({ children }) => <table className="logbook-entry-table">{children}</table>,
  thead: ({ children }) => <thead className="logbook-entry-table-head">{children}</thead>,
  tbody: ({ children }) => <tbody className="logbook-entry-table-body">{children}</tbody>,
  tr: ({ children }) => <tr className="logbook-entry-table-row">{children}</tr>,
  th: ({ children }) => <th className="logbook-entry-table-header">{children}</th>,
  td: ({ children }) => <td className="logbook-entry-table-cell">{children}</td>
};

const LogbookEntry = ({ entry, onEdit, onDelete, onBack, isEditable = true }) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEdit = () => {
    onEdit(entry);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete(entry.id);
    setShowDeleteModal(false);
  };

  return (
    <div 
      className="logbook-entry"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="logbook-entry-header">
        <div className="logbook-entry-header-left">
          <button 
            className="logbook-entry-back-btn"
            onClick={onBack}
            title="Volver al listado"
          >
            ← Volver
          </button>
        </div>
        <h2 className="logbook-entry-title">{entry.title}</h2>
        <div className="logbook-entry-meta">
          <span className="logbook-entry-date">{formatDate(entry.entry_date)}</span>
          {isEditable && showActions && (
            <div className="logbook-entry-actions">
              <button 
                className="logbook-entry-action-btn edit"
                onClick={handleEdit}
                title="Editar entrada"
              >
                <img src={editIcon} alt="Editar" className="logbook-entry-action-icon" />
              </button>
              <button 
                className="logbook-entry-action-btn delete"
                onClick={handleDelete}
                title="Eliminar entrada"
              >
                <img src={deleteIcon} alt="Eliminar" className="logbook-entry-action-icon" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="logbook-entry-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={MARKDOWN_COMPONENTS}
        >
          {entry.content}
        </ReactMarkdown>
      </div>
      {showDeleteModal && (
        <DeleteLogbookEntryModal
          entry={entry}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default LogbookEntry;