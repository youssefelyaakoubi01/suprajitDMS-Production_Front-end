/**
 * Position Model
 * Domain: DMS-Admin
 *
 * Represents user positions/roles in the system
 */

export interface Position {
    id: number;
    name: string;
    code: string;
    description?: string;
    color: string;
    icon: string;
    is_active: boolean;
    order: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface PositionCreate {
    name: string;
    code: string;
    description?: string;
    color?: string;
    icon?: string;
    is_active?: boolean;
    order?: number;
}

export const POSITION_COLORS = [
    { label: 'Succès (Vert)', value: 'success' },
    { label: 'Info (Bleu)', value: 'info' },
    { label: 'Avertissement (Orange)', value: 'warn' },
    { label: 'Danger (Rouge)', value: 'danger' },
    { label: 'Secondaire (Gris)', value: 'secondary' }
];

export const POSITION_ICONS = [
    { label: 'Utilisateur', value: 'pi pi-user', icon: 'pi pi-user' },
    { label: 'Bouclier (Admin)', value: 'pi pi-shield', icon: 'pi pi-shield' },
    { label: 'Utilisateurs', value: 'pi pi-users', icon: 'pi pi-users' },
    { label: 'Étoile', value: 'pi pi-star', icon: 'pi pi-star' },
    { label: 'Œil', value: 'pi pi-eye', icon: 'pi pi-eye' },
    { label: 'Livre', value: 'pi pi-book', icon: 'pi pi-book' },
    { label: 'Clé', value: 'pi pi-key', icon: 'pi pi-key' },
    { label: 'Engrenage', value: 'pi pi-cog', icon: 'pi pi-cog' },
    { label: 'Bureau', value: 'pi pi-briefcase', icon: 'pi pi-briefcase' },
    { label: 'ID Badge', value: 'pi pi-id-card', icon: 'pi pi-id-card' }
];
