// Utilidad para obtener rutas de imágenes de manera consistente
// Esto resuelve el problema de rutas absolutas que no funcionan en producción

// Función para obtener la ruta correcta de una imagen
export const getImagePath = (imagePath) => {
  // Si la ruta ya es un import, la devolvemos tal como está
  if (typeof imagePath === 'string' && !imagePath.startsWith('/src/')) {
    return imagePath;
  }
  
  // Convertir rutas absolutas /src/assets/... a rutas relativas
  if (imagePath.startsWith('/src/assets/')) {
    // En desarrollo, Vite puede manejar estas rutas
    // En producción, necesitamos usar la ruta relativa
    return imagePath.replace('/src/', '/');
  }
  
  return imagePath;
};

// Constantes para iconos de tipos de elementos
import campaignsIcon from '../assets/images/types/campaigns.png';
import openQuestIcon from '../assets/images/types/openquest.png';
import closedQuestIcon from '../assets/images/types/closedquest.png';
import commissionIcon from '../assets/images/types/commission.png';
import dailiesIcon from '../assets/images/types/dailies.png';
import raidsIcon from '../assets/images/types/raid.png';
import rumorIcon from '../assets/images/types/rumor.png';

// Constantes para iconos de estado
import pendingIcon from '../assets/images/pending.png';
import completedIcon from '../assets/images/completed.png';
import skippedIcon from '../assets/images/skipped.png';
import burnedIcon from '../assets/images/burned.png';
import balanceIcon from '../assets/images/balance.png';
import lazyIcon from '../assets/images/lazy.png';
import editIcon from '../assets/images/edit.png';
import deleteIcon from '../assets/images/delete.png';
import spellBookIcon from '../assets/images/spell-book.png';

// Constantes para iconos de raids
import defeatedIcon from '../assets/images/raids/defeated.png';
import easyRaidNegativeIcon from '../assets/images/raids/easy-raid-negative.png';
import easyRaidPositiveIcon from '../assets/images/raids/easy-raid-positive.png';
import normalRaidNegativeIcon from '../assets/images/raids/normal-raid-negative.png';
import normalRaidPositiveIcon from '../assets/images/raids/normal-raid-positive.png';
import hardRaidNegativeIcon from '../assets/images/raids/hard-raid-negative.png';
import hardRaidPositiveIcon from '../assets/images/raids/hard-raid-positive.png';

// Exportar constantes organizadas
export const ELEMENT_TYPE_ICONS = {
  campaigns: campaignsIcon,
  open_quest: openQuestIcon,
  closed_quest: closedQuestIcon,
  commission: commissionIcon,
  dailies: dailiesIcon,
  raids: raidsIcon,
  rumor: rumorIcon
};

export const STATUS_ICONS = {
  pending: pendingIcon,
  completed: completedIcon,
  skipped: skippedIcon,
  edit: editIcon,
  delete: deleteIcon,
  spellBook: spellBookIcon
};

export const BALANCE_ICONS = {
  BURNOUT: burnedIcon,
  EQUILIBRIUM: balanceIcon,
  PROCRASTINATION: lazyIcon,
  NEUTRAL: balanceIcon
};

export const RAID_ICONS = {
  defeated: defeatedIcon,
  'easy-negative': easyRaidNegativeIcon,
  'easy-positive': easyRaidPositiveIcon,
  'normal-negative': normalRaidNegativeIcon,
  'normal-positive': normalRaidPositiveIcon,
  'hard-negative': hardRaidNegativeIcon,
  'hard-positive': hardRaidPositiveIcon
};

// Función para obtener icono de raid basado en dificultad y energía
export const getRaidIcon = (difficulty, energyValue) => {
  const difficultyName = difficulty?.toLowerCase() || 'normal';
  const energyType = energyValue >= 0 ? 'positive' : 'negative';
  const iconKey = `${difficultyName}-${energyType}`;
  
  return RAID_ICONS[iconKey] || RAID_ICONS['normal-positive'];
};

// Función para obtener icono de estado de raid
export const getRaidStatusIcon = (status) => {
  if (status === 'defeated') {
    return RAID_ICONS.defeated;
  }
  return STATUS_ICONS.skipped;
};