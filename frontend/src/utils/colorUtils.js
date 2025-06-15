export const getContrastColor = (hexColor) => {
  const color = hexColor.replace('#', '');
  
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export const isLightColor = (hexColor) => {
  return getContrastColor(hexColor) === '#000000';
};

export const getColorClass = (hexColor) => {
  return isLightColor(hexColor) ? 'light-bg' : 'dark-bg';
};