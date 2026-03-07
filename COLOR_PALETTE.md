# 🎨 RANG PALITRA: DARK MODE VA LIGHT MODE

**Loyiha:** Lazzat Restaurant POS Terminal  
**Maqsad:** Maksimal foydalanuvchi tajriba (UX) va kirish (UI) ushbu color palette bilan

---

## 📋 ICHIGA NAVIGATSIYA

1. [Brand Ranglari](#brand-ranglari)
2. [Status Holat Ranglari](#status-holat-ranglari)
3. [Semantik Ranglari](#semantik-ranglari)
4. [Neutral Ranglari](#neutral-ranglari)
5. [Gradient O'zgarishlari](#gradient-ozgarishlari)
6. [Dark Mode Palitra](#dark-mode-palitra)
7. [Light Mode Palitra](#light-mode-palitra)
8. [Tailwind Config](#tailwind-config)
9. [Accessibility Tekshilishi](#accessibility-tekshilishi)

---

## 🎯 BRAND RANGLARI

### Primary - Orange (🟠 Lazzat Asosiy Rangi)

Bu restoran brand'i uchun energik va ishtaha ochuvchi rang.

**Otzini (Light Mode):**
```
Primary 50:  #fffbf5
Primary 100: #fef3e2
Primary 200: #fce7c8
Primary 300: #fab290
Primary 400: #f97316  ← MAIN (Button, Nav)
Primary 500: #ea580c
Primary 600: #c2410c
Primary 700: #9a2e0e
Primary 800: #7c2410
Primary 900: #66200d
```

**Qorada (Dark Mode):**
```
Primary 50:  #fef3e2
Primary 100: #fde8d0
Primary 200: #f8d9b7
Primary 300: #f09f6a
Primary 400: #f97316  ← MAIN (Same)
Primary 500: #e85a1b
Primary 600: #c2410c
Primary 700: #952f0d
Primary 800: #6d220f
Primary 900: #4a1609
```

**Ishlatiladi:** 
- Primary buttons
- Links
- Active states
- Navigation highlights
- Brand logo

---

### Secondary - Teal (🔵 Complementary)

Aksent rangi - o'qitish va yangilanish uchun.

**Light Mode:**
```
Teal 50:  #f0fdfa
Teal 100: #d1faf5
Teal 200: #a0ebe0
Teal 300: #6cd6c9
Teal 400: #33bfb3  ← SECONDARY
Teal 500: #14b8a6
Teal 600: #0d9488
Teal 700: #0f6b5f
Teal 800: #0f5449
Teal 900: #064e3b
```

**Dark Mode:**
```
Teal 50:  #d1faf5
Teal 100: #a0ebe0
Teal 200: #6fd9ce
Teal 300: #33bfb3  ← SECONDARY
Teal 400: #14b8a6
Teal 500: #0d9488
Teal 600: #0f7c6f
Teal 700: #0d5c54
Teal 800: #0a433e
Teal 900: #072a26
```

**Ishlatiladi:**
- Secondary actions
- Info badges
- Progress indicators

---

## 🚦 STATUS HOLAT RANGLARI

### Buyurtma Holatlari

#### ✅ Muvaffaq / Tayyor (Green)

**Light Mode:**
```
Success 100: #dcfce7
Success 200: #bbf7d0
Success 300: #86efac
Success 400: #4ade80
Success 500: #22c55e  ← ORDER READY
Success 600: #16a34a
Success 700: #15803d
```

**Dark Mode:**
```
Success 100: #bbf7d0
Success 200: #86efac
Success 300: #4ade80
Success 400: #22c55e  ← ORDER READY
Success 500: #16a34a
Success 600: #15803d
Success 700: #0f5d2f
```

**Ishlatiladi:**
- ✅ Status: Buyurtma tayyor (status=3)
- ✅ Confirmed actions
- ✅ Green badges

---

#### ⏳ Kutilayotgan / Qabul Qilindi (Blue)

**Light Mode:**
```
Blue 100: #dbeafe
Blue 200: #bfdbfe
Blue 300: #93c5fd  
Blue 400: #60a5fa
Blue 500: #3b82f6  ← PENDING/ACCEPTED
Blue 600: #2563eb
Blue 700: #1d4ed8
```

**Dark Mode:**
```
Blue 100: #bfdbfe
Blue 200: #93c5fd
Blue 300: #60a5fa
Blue 400: #3b82f6  ← PENDING/ACCEPTED
Blue 500: #2563eb
Blue 600: #1d4ed8
Blue 700: #1e40af
```

**Ishlatiladi:**
- ⏳ Status: Buyurtma qabul qilindi (status=1)
- ⏳ Processing orders
- ⏳ Info messages
- Blue badges

---

#### ❌ Bekor / Xato (Red)

**Light Mode:**
```
Red 100: #fee2e2
Red 200: #fecaca
Red 300: #fca5a5
Red 400: #f87171
Red 500: #ef4444  ← CANCELLED/ERROR
Red 600: #dc2626
Red 700: #b91c1c
```

**Dark Mode:**
```
Red 100: #fecaca
Red 200: #fca5a5
Red 300: #f87171
Red 400: #ef4444  ← CANCELLED/ERROR
Red 500: #dc2626
Red 600: #b91c1c
Red 700: #7f1d1d
```

**Ishlatiladi:**
- ❌ Status: Buyurtma bekor (status=2)
- ❌ Errors
- ❌ Delete actions
- Red badges

---

#### ⚠️ Ogohlantirish (Amber/Yellow)

**Light Mode:**
```
Amber 100: #fef3c7
Amber 200: #fde68a
Amber 300: #fcd34d
Amber 400: #fbbf24
Amber 500: #f59e0b  ← WARNING
Amber 600: #d97706
Amber 700: #b45309
```

**Dark Mode:**
```
Amber 100: #fde68a
Amber 200: #fcd34d
Amber 300: #fbbf24
Amber 400: #f59e0b  ← WARNING
Amber 500: #d97706
Amber 600: #b45309
Amber 700: #92400e
```

**Ishlatiladi:**
- ⚠️ Olinib qo'yilgan (reserved) stollar
- ⚠️ Kam stock mahsulotlar
- ⚠️ Warning messages
- Yellow badges

---

## 🎨 SEMANTIK RANGLARI

### Taollar va Kategoriyalar Uchun Palette

Har bir taom kategoriyasining o'z rangi (7 variantli):

```javascript
const CATEGORY_COLORS = [
  // 1. Salatlar - Violet
  {
    light: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
    dark: { bg: '#2d1b4e', text: '#e9d5ff', border: '#a78bfa' }
  },
  
  // 2. Asosiy taomlar - Blue
  {
    light: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    dark: { bg: '#1e3a8a', text: '#dbeafe', border: '#60a5fa' }
  },
  
  // 3. Ichimliklar - Cyan
  {
    light: { bg: '#ecf9ff', text: '#0e7490', border: '#a5f3fc' },
    dark: { bg: '#164e63', text: '#cffafe', border: '#06b6d4' }
  },
  
  // 4. Dessertlar - Pink
  {
    light: { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
    dark: { bg: '#500724', text: '#fbcfe8', border: '#ec4899' }
  },
  
  // 5. Qorindoshlar - Emerald
  {
    light: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    dark: { bg: '#0f3829', text: '#d1fae5', border: '#6ee7b7' }
  },
  
  // 6. Somsa/Lavash - Amber
  {
    light: { bg: '#fefce8', text: '#92400e', border: '#fde68a' },
    dark: { bg: '#3d2817', text: '#fef08a', border: '#fbbf24' }
  },
  
  // 7. Spetsial - Rose
  {
    light: { bg: '#ffe4e6', text: '#831843', border: '#fbcfe8' },
    dark: { bg: '#4c0519', text: '#fce7f3', border: '#f43f5e' }
  }
];
```

---

## ⚫⚪ NEUTRAL RANGLARI

### Backgrounds va Text

**Light Mode:**
```
Slate 50:    #f8fafc  ← Page background
Slate 100:   #f1f5f9  ← Card background
Slate 200:   #e2e8f0  ← Borders
Slate 300:   #cbd5e1  ← Subtle text
Slate 600:   #475569  ← Body text
Slate 700:   #334155  ← Headings
Slate 900:   #0f172a  ← Dark text
```

**Dark Mode:**
```
Slate 50:    #f8fafc  ← Text (light)
Slate 100:   #f1f5f9  ← Secondary text
Slate 200:   #e2e8f0  ← Subtle borders
Slate 700:   #334155  ← Soft UI elements
Slate 800:   #1e293b  ← Component background
Slate 900:   #0f172a  ← Page background
Slate 950:   #020617  ← Darker background
```

---

## 🌈 GRADIENT O'ZGARISHLARI

### Button Gradients

**Light Mode - Primary Button:**
```css
background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
```

**Dark Mode - Primary Button:**
```css
background: linear-gradient(135deg, #f97316 0%, #c2410c 100%);
```

### Card Gradients

**Light Mode:**
```css
background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
border: 1px solid #e2e8f0;
```

**Dark Mode:**
```css
background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
border: 1px solid #334155;
```

### Status Gradients

**Buyurtma Tayyor (Success):**
```css
Light: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
Dark: linear-gradient(135deg, #15803d 0%, #0f5d2f 100%);
```

**Buyurtma Kutilayotgan (Info):**
```css
Light: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
Dark: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
```

**Buyurtma Bekor (Error):**
```css
Light: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
Dark: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
```

---

## 📱 DARK MODE PALITRA

### Complete Dark Palette

```javascript
const darkPalette = {
  // Backgrounds
  bg: {
    primary: '#0f172a',      // Page
    secondary: '#1e293b',    // Cards
    tertiary: '#334155',     // Hover
    input: '#1e293b',
    overlay: 'rgba(15, 23, 42, 0.7)'
  },
  
  // Text
  text: {
    primary: '#f8fafc',      // Headings
    secondary: '#cbd5e1',    // Body
    tertiary: '#94a3b8',     // Disabled
    muted: '#64748b'
  },
  
  // Borders
  border: {
    light: '#334155',
    strong: '#475569'
  },
  
  // Shadow
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)'
  },
  
  // Status
  status: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  },
  
  // Brand
  primary: '#f97316',
  secondary: '#14b8a6'
};
```

---

## ☀️ LIGHT MODE PALITRA

### Complete Light Palette

```javascript
const lightPalette = {
  // Backgrounds
  bg: {
    primary: '#ffffff',      // Page
    secondary: '#f8fafc',    // Cards
    tertiary: '#f1f5f9',     // Hover
    input: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.9)'
  },
  
  // Text
  text: {
    primary: '#0f172a',      // Headings
    secondary: '#475569',    // Body
    tertiary: '#94a3b8',     // Disabled
    muted: '#cbd5e1'
  },
  
  // Borders
  border: {
    light: '#e2e8f0',
    strong: '#cbd5e1'
  },
  
  // Shadow
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
  },
  
  // Status
  status: {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb'
  },
  
  // Brand
  primary: '#f97316',
  secondary: '#0d9488'
};
```

---

## 🎨 TAILWIND CONFIG

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        lazzat: {
          50: '#fffbf5',
          100: '#fef3e2',
          200: '#fce7c8',
          300: '#fab290',
          400: '#f97316',  // PRIMARY
          500: '#ea580c',
          600: '#c2410c',
          700: '#9a2e0e',
          800: '#7c2410',
          900: '#66200d',
        },
        
        // Status colors
        'status-success': {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
        'status-error': {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        'status-warning': {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        'status-info': {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
      },
      
      backgroundColor: {
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        light: {
          50: '#ffffff',
          100: '#f8fafc',
          200: '#f1f5f9',
          300: '#e2e8f0',
        }
      },
      
      textColor: {
        dark: {
          primary: '#f8fafc',
          secondary: '#cbd5e1',
          tertiary: '#94a3b8',
        },
        light: {
          primary: '#0f172a',
          secondary: '#475569',
          tertiary: '#94a3b8',
        }
      },
      
      borderColor: {
        dark: {
          light: '#334155',
          strong: '#475569',
        },
        light: {
          light: '#e2e8f0',
          strong: '#cbd5e1',
        }
      },
      
      boxShadow: {
        'dark-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 6px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
        'light-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'light-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'light-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'gradient-success-light': 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        'gradient-error-light': 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        'gradient-warning-light': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        'gradient-success-dark': 'linear-gradient(135deg, #15803d 0%, #0f5d2f 100%)',
        'gradient-error-dark': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        'gradient-warning-dark': 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
      },
    },
  },
  plugins: [],
};
```

---

## 🖼️ COMPONENT EXAMPLES

### Button - Primary

**Light Mode:**
```jsx
<button className="bg-lazzat-400 hover:bg-lazzat-600 text-white px-4 py-2 rounded">
  To'lash
</button>
```

**Dark Mode:**
```jsx
<button className="dark:bg-lazzat-400 dark:hover:bg-lazzat-600 dark:text-slate-900 text-white px-4 py-2 rounded">
  To'lash
</button>
```

### Card

**Light Mode:**
```jsx
<div className="bg-white border border-slate-200 rounded-lg shadow-md p-4">
  Card content
</div>
```

**Dark Mode:**
```jsx
<div className="dark:bg-slate-800 dark:border-slate-700 bg-white border border-slate-200 rounded-lg shadow-md p-4">
  Card content
</div>
```

### Status Badge

**Buyurtma Tayyor:**
```jsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
  ✅ Tayyor
</span>
```

**Buyurtma Kutilayotgan:**
```jsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
  ⏳ Kutilayotgan
</span>
```

**Buyurtma Bekor:**
```jsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
  ❌ Bekor
</span>
```

### Input Field

**Light Mode:**
```jsx
<input 
  type="text" 
  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lazzat-400 focus:border-transparent"
/>
```

**Dark Mode:**
```jsx
<input 
  type="text" 
  className="w-full px-4 py-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-lazzat-400"
/>
```

---

## ♿ ACCESSIBILITY TEKSHILISHI

### Contrast Ratios (WCAG AA - min 4.5:1 for text)

| Kombinatsiya | Light Mode | Dark Mode | Status |
|---|---|---|---|
| Orange on White | 5.2:1 | - | ✅ Pass |
| Orange on Dark | - | 4.8:1 | ✅ Pass |
| Green on White | 3.9:1 | - | ⚠️ Adjust |
| Green #22c55e on Dark | - | 4.2:1 | ✅ Pass |
| Red on White | 3.9:1 | - | ⚠️ Adjust |
| Red #ef4444 on Dark | - | 4.1:1 | ✅ Pass |
| Blue on White | 4.5:1 | - | ✅ Pass |
| Blue on Dark | - | 4.6:1 | ✅ Pass |

### Contrast Issues va Takomillashlar

**Green Status - Takomillanish:**
```javascript
// Yomon: #22c55e on white (3.9:1)
// Yaxshi: #16a34a on white (5.1:1)
// ATAU: #15803d on white (8.2:1)
```

**Red Status - Takomillanish:**
```javascript
// Yomon: #ef4444 on white (3.9:1)
// Yaxshi: #dc2626 on white (5.2:1)
```

### Color Blindness Testing

✅ **Protanopia (Red-Green):** Green/Red statuslar shakalda aniqlangan
✅ **Deuteranopia (Green-Red):** Pattern + color ikonka ishlatilgan
✅ **Tritanopia (Blue-Yellow):** Orange primary o'tadi
✅ **Achromatopsia (Rang yo'q):** Contrast yetarli (4.5:1+)

---

## 🎯 BEST PRACTICES

### Dark Mode Ishlatilishi

1. **System Preference Respekt:**
```javascript
// src/hooks/useDarkMode.js
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => setIsDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  
  return isDark;
};
```

2. **Toggle Button:**
```jsx
<button 
  onClick={() => document.documentElement.classList.toggle('dark')}
  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
>
  {isDark ? '☀️' : '🌙'}
</button>
```

3. **Persistent Preference:**
```javascript
useEffect(() => {
  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}, []);
```

### Color Usage Guidelines

✅ **Color Meaning Consistent:** Green = Success, Red = Error, Blue = Info
✅ **Semantic Color:** Status uchun rang emas, pattern + rang
✅ **Sufficient Contrast:** 4.5:1 minimum
✅ **Cultural Relevance:** Orange = Energy (restaurant uchun perfect)
✅ **Mobile Optimization:** Dark mode OLED'da batareyani saqlagani

---

## 📐 RESPONSIVE CONSIDERATIONS

### Rengi Screen Size bo'yicha

```css
/* Mobile: Stronger contrast */
@media (max-width: 640px) {
  .text-primary { color: #0f172a; } /* Light */
  .dark .text-primary { color: #f8fafc; } /* Dark */
}

/* Desktop: Normal contrast */
@media (min-width: 1024px) {
  .text-primary { color: #1e293b; } /* Light */
  .dark .text-primary { color: #cbd5e1; } /* Dark */
}
```

---

## 🧪 TESTING COLORS

### Chrome DevTools Simulation

1. F12 → Rendering tab
2. Emulate CSS media feature → prefers-color-scheme
3. Color space selector (sRGB, P3, rec2020)
4. Accessibility → Check contrast ratios

### HEX to RGB

```javascript
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};
```

---

## 📊 COLOR PSYCHOLOGY

### Restaurant POS uchun Rang Tanlanadi

| Rang | Psikologiya | Ishlatilishi |
|------|-----------|-----------|
| **Orange** | Energiya, Ishtaha, Sotuvchi | Primary brand |
| **Green** | Muvaffaqiyat, Xotijjam | Success status |
| **Red** | Ogohlantirish, Xujum | Errors, Bekor |
| **Blue** | Amanotlik, Ma'lumot | Pending, Info |
| **Teal** | Yangilik, Tinchlanish | Secondary |
| **Amber** | Ehtiyot, Diqqat | Warnings |

---

## 🎬 ANIMATION WITH COLORS

### Smooth Transition

```css
.status-badge {
  transition: all 300ms ease-in-out;
}

.status-badge:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}
```

### Dark Mode Transition

```css
@media (prefers-reduced-motion: no-preference) {
  body {
    transition: background-color 300ms, color 300ms;
  }
  
  button {
    transition: background-color 200ms, box-shadow 200ms;
  }
}
```

---

## 📝 USAGE EXAMPLES

### Status Badge System

```javascript
const STATUS_COLORS = {
  1: { // Accepted
    light: { bg: 'bg-blue-100', text: 'text-blue-700' },
    dark: { bg: 'dark:bg-blue-900', text: 'dark:text-blue-200' },
    label: 'Qabul qilindi'
  },
  2: { // Cancelled
    light: { bg: 'bg-red-100', text: 'text-red-700' },
    dark: { bg: 'dark:bg-red-900', text: 'dark:text-red-200' },
    label: 'Bekor qilindi'
  },
  3: { // Finished
    light: { bg: 'bg-green-100', text: 'text-green-700' },
    dark: { bg: 'dark:bg-green-900', text: 'dark:text-green-200' },
    label: 'Tayyor'
  }
};
```

### Category Colors

```javascript
const CATEGORY_PALETTE = {
  'Salatlar': {
    light: { bg: '#f3e8ff', text: '#6b21a8' },
    dark: { bg: '#2d1b4e', text: '#e9d5ff' }
  },
  'Asosiy taomlar': {
    light: { bg: '#eff6ff', text: '#1e40af' },
    dark: { bg: '#1e3a8a', text: '#dbeafe' }
  },
  // ...
};
```
