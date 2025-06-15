import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { logbookService } from '../../services/logbookService';
import { useToast } from '../../contexts/ToastContext';
import './LogbookEditor.css';

const MARKDOWN_COMPONENTS = {
  h1: ({ children }) => <h1 className="preview-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="preview-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="preview-h3">{children}</h3>,
  p: ({ children }) => <p className="preview-paragraph">{children}</p>,
  ul: ({ children }) => <ul className="preview-list">{children}</ul>,
  ol: ({ children }) => <ol className="preview-ordered-list">{children}</ol>,
  li: ({ children }) => <li className="preview-list-item">{children}</li>,
  blockquote: ({ children }) => <blockquote className="preview-quote">{children}</blockquote>,
  code: ({ children, inline }) => 
    inline ? 
      <code className="preview-inline-code">{children}</code> : 
      <code className="preview-code-block">{children}</code>,
  pre: ({ children }) => <pre className="preview-pre">{children}</pre>,
  strong: ({ children }) => <strong className="preview-bold">{children}</strong>,
  em: ({ children }) => <em className="preview-italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} className="preview-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  hr: () => <hr className="preview-divider" />
};

const MARKDOWN_TOOLBAR_BUTTONS = [
  { label: 'H1', action: '# ', title: 'Título 1' },
  { label: 'H2', action: '## ', title: 'Título 2' },
  { label: 'H3', action: '### ', title: 'Título 3' },
  { label: 'B', action: '**texto**', title: 'Negrita' },
  { label: 'I', action: '*texto*', title: 'Cursiva' },
  { label: 'Link', action: '[texto](url)', title: 'Enlace' },
  { label: 'Quote', action: '> ', title: 'Cita' },
  { label: 'Code', action: '`código`', title: 'Código en línea' },
  { label: 'List', action: '- ', title: 'Lista' },
  { label: 'OL', action: '1. ', title: 'Lista numerada' },
  { label: 'HR', action: '\n---\n', title: 'Línea horizontal' }
];

const LogbookEditor = ({ entry, campaign, isCreating, onSave, onCancel }) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [entryDate] = useState(
    entry?.entry_date ? new Date(entry.entry_date).toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]
  );
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const insertMarkdown = (action) => {
    const textarea = document.getElementById('content-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText;
    if (action.includes('texto')) {
      newText = action.replace('texto', selectedText || 'texto');
    } else {
      newText = action;
    }
    
    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('El título es requerido');
      return;
    }

    if (!campaign?.id) {
      showError('ID de campaña no encontrado');
      return;
    }

    setIsSaving(true);
    try {
      const entryData = {
        title: title.trim(),
        content: content.trim(),
        entry_date: entryDate,
        campaign_id: campaign.id
      };


      let savedEntry;
      if (entry?.id) {
        savedEntry = await logbookService.updateLogbookEntry(entry.id, entryData);
        showSuccess('Entrada actualizada exitosamente');
      } else {
        savedEntry = await logbookService.createLogbookEntry(entryData);
        showSuccess('Entrada creada exitosamente');
      }
      
      onSave(savedEntry);
    } catch (error) {
      console.error('Error saving entry:', error);
      console.error('Error details:', error.response?.data); 
      showError('Error al guardar la entrada');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      setIsPreview(!isPreview);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPreview]);

  return (
    <div className="logbook-editor">
      <div className="logbook-editor-header">
        <h2>{entry?.id ? 'Editar Entrada' : 'Nueva Entrada'}</h2>
        <div className="logbook-editor-actions">
          <button 
            className="logbook-editor-btn preview-toggle"
            onClick={() => setIsPreview(!isPreview)}
            title="Ctrl+P"
          >
            {isPreview ? 'Editor' : 'Vista Previa'}
          </button>
          <button 
            className="logbook-editor-btn save"
            onClick={handleSave}
            disabled={isSaving}
            title="Ctrl+S"
          >
            {isSaving ? 'Guardando...' : ' Guardar'}
          </button>
          <button 
            className="logbook-editor-btn cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="logbook-editor-form">
        <div className="logbook-editor-row">
          <div className="logbook-editor-field">
            <label htmlFor="title-input">Título</label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la entrada..."
              className="logbook-editor-input"
            />
          </div>
         
          <div className="logbook-editor-field date-field">
            <label htmlFor="date-input">Fecha</label>
            <div className="logbook-editor-date-display">
              {new Date(entryDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <input
              id="date-input"
              type="date"
              value={entryDate}
              readOnly
              className="logbook-editor-input logbook-editor-input-readonly"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="logbook-editor-content">
          {!isPreview ? (
            <>
              <div className="markdown-toolbar">
                {MARKDOWN_TOOLBAR_BUTTONS.map((button, index) => (
                  <button
                    key={index}
                    className="markdown-btn"
                    onClick={() => insertMarkdown(button.action)}
                    title={button.title}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
              <textarea
                id="content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe tu entrada en Markdown...\n\n# Título\n\nEscribe aquí tu contenido. Puedes usar **negrita**, *cursiva*, [enlaces](url), y más."
                className="logbook-editor-textarea"
              />
            </>
          ) : (
            <div className="logbook-editor-preview">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={MARKDOWN_COMPONENTS}
              >
                {content || '*Vista previa vacía - escribe algo en el editor*'}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogbookEditor;