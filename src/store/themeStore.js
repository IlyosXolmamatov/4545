import { create } from 'zustand';

const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create((set) => {
  // localStorage dan boshlang'ich qiymat
  const saved = localStorage.getItem('theme');
  const initial = saved ? saved === 'dark' : false;
  applyTheme(initial);

  return {
    isDark: initial,

    toggle: () =>
      set((state) => {
        const next = !state.isDark;
        localStorage.setItem('theme', next ? 'dark' : 'light');
        applyTheme(next);
        return { isDark: next };
      }),
  };
});
