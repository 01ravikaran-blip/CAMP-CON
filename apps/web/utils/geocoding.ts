export const getPlaceName = async (lat: number, lng: number): Promise<string> => {
    try {
        // Use OpenStreetMap Nominatim API (Free, requires User-Agent)
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: {
                'User-Agent': 'SmartCampusApp/1.0'
            }
        });

        if (!res.ok) return '📍 GPS Location';

        const data = await res.json();

        // Construct a short, readable name
        // Prioritize: Amenity (Starbucks) > Building > Road > Suburb
        if (data.address) {
            const name = data.address.amenity || data.address.building || data.address.road;
            const area = data.address.suburb || data.address.neighbourhood || data.address.city || data.address.town;

            if (name && area) return `📍 ${name}, ${area}`;
            if (name) return `📍 ${name}`;
            if (area) return `📍 ${area}`;
        }

        return '📍 GPS Location';
    } catch (e) {
        console.error("Geocoding failed", e);
        return '📍 GPS Location';
    }
};
