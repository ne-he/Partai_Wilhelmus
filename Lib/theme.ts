export type Theme = 'vintage' | 'minimal' | 'stellar' | 'light';

export interface ThemeConfig {
  '--bg-main': string;
  '--bg-card': string;
  '--bg-card2': string;
  '--accent': string;
  '--text-main': string;
  '--text-muted': string;
  '--border': string;
}

export const THEME_CONFIGS: Record<Theme, ThemeConfig> = {
  vintage: {
    '--bg-main': '#1a1612',
    '--bg-card': '#242018',
    '--bg-card2': '#2e2820',
    '--accent': '#c8a96e',
    '--text-main': '#f0e6d3',
    '--text-muted': '#9c8a72',
    '--border': '#3d3428',
  },
  minimal: {
    '--bg-main': '#f5f5f5',
    '--bg-card': '#ffffff',
    '--bg-card2': '#ebebeb',
    '--accent': '#4a7fa5',
    '--text-main': '#1a1a1a',
    '--text-muted': '#6b6b6b',
    '--border': '#d0d0d0',
  },
  stellar: {
    '--bg-main': '#050a18',
    '--bg-card': '#0d1530',
    '--bg-card2': '#111d3d',
    '--accent': '#6c8fff',
    '--text-main': '#e8eeff',
    '--text-muted': '#7a8ab0',
    '--border': '#1e2d5a',
  },
  light: {
    '--bg-main': '#f9f7f5',
    '--bg-card': '#ffffff',
    '--bg-card2': '#f0ede8',
    '--accent': '#c8a96e',
    '--text-main': '#1e1a15',
    '--text-muted': '#7a6e62',
    '--border': '#e0d8ce',
  },
};

export function applyTheme(theme: Theme, accent?: string): void {
  const config = THEME_CONFIGS[theme];
  const root = document.documentElement;

  (Object.keys(config) as Array<keyof ThemeConfig>).forEach((key) => {
    root.style.setProperty(key, config[key]);
  });

  if (accent) {
    root.style.setProperty('--accent', accent);
  }
}
