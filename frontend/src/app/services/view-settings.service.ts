import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

interface ViewSettings {
  fontSize: number;
  compactMode: boolean;
  theme: Theme;
  lineHeight: number;
}

const DEFAULT_SETTINGS: ViewSettings = {
  fontSize: 16,
  compactMode: false,
  theme: 'auto',
  lineHeight: 1.4
};

@Injectable({
  providedIn: 'root'
})
export class ViewSettingsService {
  private settingsSubject = new BehaviorSubject<ViewSettings>(DEFAULT_SETTINGS);
  
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
    this.applySettings();
  }

  increaseFontSize(): void {
    const settings = this.settingsSubject.value;
    if (settings.fontSize < 24) {
      this.updateSettings({ fontSize: settings.fontSize + 2 });
    }
  }

  decreaseFontSize(): void {
    const settings = this.settingsSubject.value;
    if (settings.fontSize > 12) {
      this.updateSettings({ fontSize: settings.fontSize - 2 });
    }
  }

  toggleCompactMode(): void {
    const settings = this.settingsSubject.value;
    this.updateSettings({ 
      compactMode: !settings.compactMode,
      lineHeight: !settings.compactMode ? 1.2 : 1.4
    });
  }

  setTheme(theme: Theme): void {
    this.updateSettings({ theme });
    this.applyTheme();
  }

  getTheme(): Theme {
    return this.settingsSubject.value.theme;
  }

  getFontSize(): number {
    return this.settingsSubject.value.fontSize;
  }

  isCompactMode(): boolean {
    return this.settingsSubject.value.compactMode;
  }

  private updateSettings(updates: Partial<ViewSettings>): void {
    const current = this.settingsSubject.value;
    const newSettings = { ...current, ...updates };
    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
    this.applySettings();
  }

  private saveSettings(settings: ViewSettings): void {
    try {
      localStorage.setItem('viewSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save view settings:', error);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('viewSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settingsSubject.next({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load view settings:', error);
    }
  }

  private applySettings(): void {
    const settings = this.settingsSubject.value;
    const root = document.documentElement;
    
    root.style.setProperty('--base-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--line-height', settings.lineHeight.toString());
    
    if (settings.compactMode) {
      root.style.setProperty('--node-spacing', '2px');
    } else {
      root.style.setProperty('--node-spacing', '4px');
    }
    
    this.applyTheme();
  }

  private applyTheme(): void {
    const theme = this.settingsSubject.value.theme;
    const effectiveTheme = theme === 'auto' ? this.getSystemTheme() : theme;
    
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  private getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  reset(): void {
    this.settingsSubject.next(DEFAULT_SETTINGS);
    this.saveSettings(DEFAULT_SETTINGS);
    this.applySettings();
  }
}

