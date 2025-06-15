import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import EnergyBalanceBar from './EnergyBalanceBar';
import { useToast } from '../../contexts/ToastContext';
import './Layout.css';

function Layout({ children }) {
  const location = useLocation();
  const { showSuccess } = useToast();

  const handleElementCreated = (newElement, elementType) => {
    console.log('Nuevo elemento creado:', newElement, 'Tipo:', elementType);
    
    const elementLabels = {
      'campaigns': 'Campaña',
      'open_quest': 'Misión Abierta',
      'closed_quest': 'Misión Cerrada',
      'commission': 'Encargo',
      'dailies': 'Diaria',
      'raids': 'Raid',
      'rumor': 'Rumor'
    };
    
    const elementLabel = elementLabels[elementType] || 'Elemento';
    showSuccess(`¡${elementLabel} creada exitosamente!`);
    
    if (location.pathname === '/calendar') {
      const refreshEvent = new CustomEvent('calendarRefresh', {
        detail: { newElement, elementType }
      });
      window.dispatchEvent(refreshEvent);
    }
  };

  return (
    <div className="app-layout">
      <TopBar onElementCreated={handleElementCreated} />
      <EnergyBalanceBar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;