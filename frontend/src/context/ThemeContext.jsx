import {createContext, useContext, useState, useEffect} from 'react';

const ThemeContext = createContext();

export function ThemeProvider({children}) {
    const [theme, setTheme] = useState(() => {
        // Preferência salva tem prioridade
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;

        // Padrão do sistema: dark
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{theme, toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}