export const getPlaceName = async (lat: number, lng: number): Promise<string> => {
    const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

    try {
        if (geoapifyKey) {
            const geoapifyRes = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${geoapifyKey}`);
            if (geoapifyRes.ok) {
                const geoapifyData = await geoapifyRes.json();
                const feature = geoapifyData?.features?.[0];
                const props = feature?.properties;

                if (props) {
                    const name = props.address_line1 || props.name || props.street;
                    const area = props.suburb || props.neighbourhood || props.city || props.town || props.state;

                    if (name && area) return `📍 ${name}, ${area}`;
                    if (name) return `📍 ${name}`;
                    if (area) return `📍 ${area}`;
                }
            }
        }

        // Fallback to OpenStreetMap Nominatim
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
