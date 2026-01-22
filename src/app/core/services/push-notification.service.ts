/**
 * Push Notification Service
 * Handles Web Push subscription and management for downtime alerts
 *
 * Features:
 * - Service Worker registration
 * - Push subscription management
 * - VAPID key handling
 * - Permission management
 */
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, from, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PushSubscriptionState {
    isSupported: boolean;
    isSubscribed: boolean;
    permission: PushPermissionState;
    subscription: PushSubscription | null;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class PushNotificationService implements OnDestroy {
    private readonly SW_PATH = '/custom-sw.js';
    private readonly ENDPOINT = 'maintenance/push';

    // Service Worker registration
    private swRegistration: ServiceWorkerRegistration | null = null;

    // VAPID public key (fetched from backend)
    private vapidPublicKey: string | null = null;

    // State management
    private stateSubject = new BehaviorSubject<PushSubscriptionState>({
        isSupported: false,
        isSubscribed: false,
        permission: 'default',
        subscription: null,
        error: null
    });
    public state$ = this.stateSubject.asObservable();

    // Cleanup
    private destroy$ = new Subject<void>();

    constructor(private api: ApiService) {
        this.checkSupport();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ==================== PUBLIC API ====================

    /**
     * Initialize the push notification service
     * Should be called on app startup
     */
    async init(): Promise<boolean> {
        const state = this.stateSubject.value;

        if (!state.isSupported) {
            console.warn('[Push] Push notifications not supported');
            return false;
        }

        try {
            // Fetch VAPID key from backend
            await this.fetchVapidPublicKey();

            // Register service worker
            await this.registerServiceWorker();

            // Check existing subscription
            await this.checkExistingSubscription();

            return true;
        } catch (error) {
            console.error('[Push] Initialization failed:', error);
            this.updateState({ error: 'Failed to initialize push notifications' });
            return false;
        }
    }

    /**
     * Request permission and subscribe to push notifications
     */
    async subscribe(employeeId?: number): Promise<PushSubscription | null> {
        const state = this.stateSubject.value;

        if (!state.isSupported) {
            console.warn('[Push] Push notifications not supported');
            return null;
        }

        if (!this.swRegistration) {
            await this.registerServiceWorker();
        }

        if (!this.vapidPublicKey) {
            await this.fetchVapidPublicKey();
        }

        if (!this.vapidPublicKey) {
            this.updateState({ error: 'VAPID public key not available' });
            return null;
        }

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            this.updateState({ permission: permission as PushPermissionState });

            if (permission !== 'granted') {
                console.warn('[Push] Notification permission denied');
                return null;
            }

            // Subscribe to push
            const subscription = await this.swRegistration!.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            console.log('[Push] Subscribed:', subscription.endpoint);

            // Send subscription to backend
            await this.sendSubscriptionToBackend(subscription, employeeId);

            this.updateState({
                isSubscribed: true,
                subscription,
                error: null
            });

            return subscription;
        } catch (error) {
            console.error('[Push] Subscription failed:', error);
            this.updateState({ error: 'Failed to subscribe to push notifications' });
            return null;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(): Promise<boolean> {
        const state = this.stateSubject.value;

        if (!state.subscription) {
            return true;
        }

        try {
            // Unsubscribe from push manager
            await state.subscription.unsubscribe();

            // Notify backend
            await this.removeSubscriptionFromBackend(state.subscription.endpoint);

            this.updateState({
                isSubscribed: false,
                subscription: null,
                error: null
            });

            console.log('[Push] Unsubscribed successfully');
            return true;
        } catch (error) {
            console.error('[Push] Unsubscribe failed:', error);
            this.updateState({ error: 'Failed to unsubscribe from push notifications' });
            return false;
        }
    }

    /**
     * Check if push is supported and permission state
     */
    getPermissionState(): PushPermissionState {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission as PushPermissionState;
    }

    /**
     * Check if currently subscribed
     */
    isSubscribed(): boolean {
        return this.stateSubject.value.isSubscribed;
    }

    /**
     * Get current state as observable
     */
    getState(): Observable<PushSubscriptionState> {
        return this.state$;
    }

    /**
     * Send a test notification
     */
    async sendTestNotification(): Promise<boolean> {
        const state = this.stateSubject.value;

        if (!state.subscription) {
            console.warn('[Push] Not subscribed, cannot send test');
            return false;
        }

        try {
            const response = await this.api.post<{ status: string }>(`${this.ENDPOINT}/test`, {
                endpoint: state.subscription.endpoint
            }).toPromise();

            return response?.status === 'sent';
        } catch (error) {
            console.error('[Push] Test notification failed:', error);
            return false;
        }
    }

    // ==================== PRIVATE METHODS ====================

    private checkSupport(): void {
        const isSupported = 'serviceWorker' in navigator &&
                          'PushManager' in window &&
                          'Notification' in window;

        const permission = this.getPermissionState();

        this.updateState({
            isSupported,
            permission
        });
    }

    private async registerServiceWorker(): Promise<void> {
        if (this.swRegistration) {
            return;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register(this.SW_PATH, {
                scope: '/'
            });

            console.log('[Push] Service Worker registered:', this.swRegistration.scope);

            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;

        } catch (error) {
            console.error('[Push] Service Worker registration failed:', error);
            throw error;
        }
    }

    private async fetchVapidPublicKey(): Promise<void> {
        try {
            const response = await this.api.get<{ publicKey: string }>(`${this.ENDPOINT}/vapid-public-key`).toPromise();

            if (response?.publicKey) {
                this.vapidPublicKey = response.publicKey;
                console.log('[Push] VAPID public key fetched');
            }
        } catch (error) {
            console.error('[Push] Failed to fetch VAPID public key:', error);
            // Use a fallback key for development (should be synced with backend)
            this.vapidPublicKey = 'BOR8uRoMVE5IvWOgO2m485YC2Z6wdI8IEATNEFb446kOCpxLAb3_I7WJ_e3xx4UDJtJ-RpH6eQCx8UZz5rCpJJg';
        }
    }

    private async checkExistingSubscription(): Promise<void> {
        if (!this.swRegistration) {
            return;
        }

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();

            if (subscription) {
                console.log('[Push] Existing subscription found');
                this.updateState({
                    isSubscribed: true,
                    subscription
                });
            }
        } catch (error) {
            console.error('[Push] Error checking existing subscription:', error);
        }
    }

    private async sendSubscriptionToBackend(subscription: PushSubscription, employeeId?: number): Promise<void> {
        const subscriptionJson = subscription.toJSON();

        const payload = {
            endpoint: subscriptionJson.endpoint,
            keys: subscriptionJson.keys,
            employee_id: employeeId
        };

        try {
            await this.api.post(`${this.ENDPOINT}/subscribe`, payload).toPromise();
            console.log('[Push] Subscription sent to backend');
        } catch (error) {
            console.error('[Push] Failed to send subscription to backend:', error);
            throw error;
        }
    }

    private async removeSubscriptionFromBackend(endpoint: string): Promise<void> {
        try {
            await this.api.post(`${this.ENDPOINT}/unsubscribe`, { endpoint }).toPromise();
            console.log('[Push] Subscription removed from backend');
        } catch (error) {
            console.error('[Push] Failed to remove subscription from backend:', error);
            // Don't throw - local unsubscribe succeeded
        }
    }

    private updateState(partial: Partial<PushSubscriptionState>): void {
        const current = this.stateSubject.value;
        this.stateSubject.next({ ...current, ...partial });
    }

    /**
     * Convert a base64 string to Uint8Array for applicationServerKey
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }
}
