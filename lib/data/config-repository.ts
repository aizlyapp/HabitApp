import { supabase } from '@/lib/supabase';
import type { PropertySyncConfig } from '@/lib/data/ical-types';

/**
 * Repository for property sync configuration operations
 */
export async function fetchAllSyncConfigs(userId: string): Promise<PropertySyncConfig[]> {
    const { data, error } = await supabase
        .from('property_sync_config')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

    if (error) throw error;
    return (data || []) as PropertySyncConfig[];
}

export async function fetchSyncConfigById(
    userId: string,
    configId: string
): Promise<PropertySyncConfig | null> {
    const { data, error } = await supabase
        .from('property_sync_config')
        .select('*')
        .eq('user_id', userId)
        .eq('id', configId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as PropertySyncConfig;
}

export async function fetchSyncConfigByProperty(
    userId: string,
    propertyId: string
): Promise<PropertySyncConfig | null> {
    const { data, error } = await supabase
        .from('property_sync_config')
        .select('*')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as PropertySyncConfig;
}

export async function createSyncConfig(
    userId: string,
    config: Omit<PropertySyncConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<PropertySyncConfig> {
    const { data, error } = await supabase
        .from('property_sync_config')
        .insert({ ...config, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data as PropertySyncConfig;
}

export async function updateSyncConfig(
    userId: string,
    configId: string,
    updates: Partial<PropertySyncConfig>
): Promise<PropertySyncConfig> {
    const { data, error } = await supabase
        .from('property_sync_config')
        .update(updates)
        .eq('id', configId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data as PropertySyncConfig;
}

export async function deleteSyncConfig(userId: string, configId: string): Promise<void> {
    const { error } = await supabase
        .from('property_sync_config')
        .delete()
        .eq('id', configId)
        .eq('user_id', userId);

    if (error) throw error;
}

export async function fetchAutoSyncConfigs(): Promise<PropertySyncConfig[]> {
    const { data, error } = await supabase
        .from('property_sync_config')
        .select('*')
        .eq('auto_sync', true)
        .order('last_sync_at');

    if (error) {
        console.error('Error fetching auto-sync configs:', error);
        return [];
    }

    return (data || []) as PropertySyncConfig[];
}