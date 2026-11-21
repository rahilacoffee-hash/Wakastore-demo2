import { createContext, useContext, useEffect, useState } from 'react'
const ThemeContext = createContext(null)
export function ThemeProvider({ children }) { const [theme, setTheme] = useState(() => localStorage.getItem('waka-theme') || 'light'); useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('waka-theme', theme) }, [theme]); return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider> }
export const useTheme = () => useContext(ThemeContext)
