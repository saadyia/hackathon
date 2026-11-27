
export function applyAidesTheme(container) {

  const colors = {
    '--bg': '#FFFDF4',
    '--surface': '#FFFFFF',
    '--surface-2': '#FFF5CC',

    '--ink': '#392553',
    '--muted': '#70647D',
    '--line': '#E4D9F0',

    '--primary': '#7954AD',
    '--primary-hover': '#57358C',
    '--primary-soft': '#FCE58A',
    '--primary-softer': '#FFF5CC',

    '--accent': '#57358C',
    '--accent-soft': '#EFE6FA',

    '--radius': '20px',
    '--radius-sm': '12px',

    '--shadow':
      '0 4px 20px rgba(87, 53, 140, 0.08)'
  };

  Object.entries(colors).forEach(([name, value]) => {
    container.style.setProperty(name, value);
  });

  container.style.color = 'var(--ink)';
  container.style.background = 'var(--bg)';
  container.style.borderRadius = '20px';
}
