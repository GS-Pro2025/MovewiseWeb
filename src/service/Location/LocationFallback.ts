// Servicio con fallback automático
class LocationServiceV2 {
    constructor() {
        this.endpoints = [
            '/orders-locations-v2/',     // API V2 (preferida)
            '/orders-locations/',        // API V1 (fallback)
            '/orders-locations-fallback/' // Offline (último recurso)
        ];
    }

    async getCountries() {
        for (const endpoint of this.endpoints) {
            try {
                const response = await fetch(`${endpoint}?type=countries`);
                const data = await response.json();
                if (data.status === 'success') return data.data;
            } catch (error) {
                console.warn(`Failed to get countries from ${endpoint}:`, error);
            }
        }
        throw new Error('All location services failed');
    }

    async getStates(countryCode) {
        for (const endpoint of this.endpoints) {
            try {
                const response = await fetch(`${endpoint}?type=states&country_code=${countryCode}`);
                const data = await response.json();
                if (data.status === 'success') return data.data;
            } catch (error) {
                console.warn(`Failed to get states from ${endpoint}:`, error);
            }
        }
        throw new Error('All location services failed');
    }
}