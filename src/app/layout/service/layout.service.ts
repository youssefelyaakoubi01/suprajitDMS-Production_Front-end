import { Injectable, effect, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

export interface layoutConfig {
    preset?: string;
    primary?: string;
    surface?: string | undefined | null;
    darkTheme?: boolean;
    menuMode?: string;
}

interface LayoutState {
    staticMenuDesktopInactive?: boolean;
    overlayMenuActive?: boolean;
    configSidebarVisible?: boolean;
    staticMenuMobileActive?: boolean;
    menuHoverActive?: boolean;
}

interface MenuChangeEvent {
    key: string;
    routeEvent?: boolean;
}

// LocalStorage key for user preferences
const LAYOUT_CONFIG_KEY = 'dms_layout_config';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private isBrowser: boolean;

    // Default configuration
    private defaultConfig: layoutConfig = {
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: false,
        menuMode: 'static'
    };

    _config: layoutConfig;

    _state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    };

    layoutConfig: ReturnType<typeof signal<layoutConfig>>;

    layoutState = signal<LayoutState>(this._state);

    private configUpdate = new Subject<layoutConfig>();

    private overlayOpen = new Subject<any>();

    private menuSource = new Subject<MenuChangeEvent>();

    private resetSource = new Subject();

    menuSource$ = this.menuSource.asObservable();

    resetSource$ = this.resetSource.asObservable();

    configUpdate$ = this.configUpdate.asObservable();

    overlayOpen$ = this.overlayOpen.asObservable();

    theme = computed(() => (this.layoutConfig()?.darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().staticMenuMobileActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);

        // Load saved config from localStorage or use defaults
        this._config = this.loadConfigFromStorage();
        this.layoutConfig = signal<layoutConfig>(this._config);

        // Apply dark mode immediately if saved
        if (this.isBrowser && this._config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        }

        effect(() => {
            const config = this.layoutConfig();
            if (config) {
                this.onConfigUpdate();
                // Save to localStorage whenever config changes
                this.saveConfigToStorage(config);
            }
        });

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });
    }

    /**
     * Load configuration from localStorage
     */
    private loadConfigFromStorage(): layoutConfig {
        if (!this.isBrowser) {
            return { ...this.defaultConfig };
        }

        try {
            const savedConfig = localStorage.getItem(LAYOUT_CONFIG_KEY);
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Merge with defaults to ensure all properties exist
                return { ...this.defaultConfig, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load layout config from localStorage:', e);
        }

        return { ...this.defaultConfig };
    }

    /**
     * Save configuration to localStorage
     */
    private saveConfigToStorage(config: layoutConfig): void {
        if (!this.isBrowser) {
            return;
        }

        try {
            localStorage.setItem(LAYOUT_CONFIG_KEY, JSON.stringify(config));
        } catch (e) {
            console.warn('Failed to save layout config to localStorage:', e);
        }
    }

    /**
     * Get saved configuration (for external access)
     */
    getSavedConfig(): layoutConfig {
        return this.loadConfigFromStorage();
    }

    /**
     * Reset configuration to defaults
     */
    resetConfig(): void {
        if (this.isBrowser) {
            localStorage.removeItem(LAYOUT_CONFIG_KEY);
        }
        this.layoutConfig.set({ ...this.defaultConfig });
    }

    private handleDarkModeTransition(config: layoutConfig): void {
        if ((document as any).startViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
            this.onTransitionEnd();
        }
    }

    private startViewTransition(config: layoutConfig): void {
        const transition = (document as any).startViewTransition(() => {
            this.toggleDarkMode(config);
        });

        transition.ready
            .then(() => {
                this.onTransitionEnd();
            })
            .catch(() => {});
    }

    toggleDarkMode(config?: layoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    private onTransitionEnd() {
        this.transitionComplete.set(true);
        setTimeout(() => {
            this.transitionComplete.set(false);
        });
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));

            if (this.layoutState().overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, staticMenuMobileActive: !this.layoutState().staticMenuMobileActive }));

            if (this.layoutState().staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }

    onConfigUpdate() {
        this._config = { ...this.layoutConfig() };
        this.configUpdate.next(this.layoutConfig());
    }

    onMenuStateChange(event: MenuChangeEvent) {
        this.menuSource.next(event);
    }

    reset() {
        this.resetSource.next(true);
    }
}
