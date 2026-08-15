import { NextRequest, NextResponse } from 'next/server';
import osmtogeojson from 'osmtogeojson';

// In-memory cache to prevent Overpass rate limiting
// Key: lat-lng-radius, Value: { timestamp, geojson }
const cache = new Map<string, { timestamp: number, data: any }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude, radius = 1200 } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${radius}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return NextResponse.json(cached.data);
    }

    // Bounding box for Overpass QL (around the coordinates)
    const query = `
      [out:json][timeout:25];
      (
        way["building"](around:${radius},${latitude},${longitude});
        way["highway"~"footway|pedestrian|path"](around:${radius},${latitude},${longitude});
        way["amenity"](around:${radius},${latitude},${longitude});
        way["leisure"](around:${radius},${latitude},${longitude});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: AbortSignal.timeout(10000) // 10 second timeout for fallback
    }).catch(() => null);

    let osmData;
    if (!response || !response.ok) {
      console.warn('Overpass API failed or timed out. Falling back to default campus data.');
      osmData = {
        "version": 0.6,
        "generator": "Fallback Generator",
        "elements": [
          {
            "type": "way",
            "id": 1,
            "nodes": [101, 102, 103, 104, 101],
            "tags": { "building": "university", "name": "Fallback Main Building" }
          },
          { "type": "node", "id": 101, "lat": latitude + 0.001, "lon": longitude - 0.001 },
          { "type": "node", "id": 102, "lat": latitude + 0.001, "lon": longitude + 0.001 },
          { "type": "node", "id": 103, "lat": latitude - 0.001, "lon": longitude + 0.001 },
          { "type": "node", "id": 104, "lat": latitude - 0.001, "lon": longitude - 0.001 }
        ]
      };
    } else {
      osmData = await response.json();
    }
    const geojson = osmtogeojson(osmData);

    // Feature Enrichment & Height Calculator
    geojson.features = geojson.features.map((feature: any) => {
      const props = feature.properties || {};
      
      // Calculate Height
      let height = 12; // Default
      if (props.height) {
        height = parseFloat(props.height);
      } else if (props['building:levels']) {
        height = parseFloat(props['building:levels']) * 3.5;
      } else if (props.building) {
        if (props.building === 'university' || props.building === 'academic' || props.building === 'college') {
          height = 20;
        } else if (props.building === 'dormitory' || props.building === 'residential') {
          height = 18;
        } else {
          height = 14;
        }
      } else if (props.amenity) {
        height = 6;
      } else if (props.leisure) {
        height = 1;
      }
      
      // Categorize Color
      let color = '#334155'; // Default slate
      
      if (props.building === 'university' || props.building === 'academic' || props.building === 'college' || props.amenity === 'university') {
        color = '#4F46E5'; // Indigo
      } else if (props.building === 'dormitory' || props.building === 'residential') {
        color = '#0D9488'; // Teal
      } else if (props.amenity === 'cafe' || props.amenity === 'restaurant' || props.amenity === 'food_court' || props.amenity === 'library') {
        color = '#F59E0B'; // Amber
      } else if (props.leisure) {
        color = '#10B981'; // Forest Green
      } else if (props.highway) {
        color = '#475569'; // Slate for paths
      }

      // Categorize Type for filtering
      let category = 'other';
      if (props.building === 'dormitory' || props.building === 'residential') category = 'hostel';
      else if (props.amenity === 'cafe' || props.amenity === 'restaurant' || props.amenity === 'food_court') category = 'cafe';
      else if (props.building) category = 'building';
      else if (props.highway) category = 'path';

      feature.properties = {
        ...props,
        calcHeight: height,
        calcColor: color,
        layerCategory: category
      };

      return feature;
    });

    const result = { success: true, geojson };
    
    cache.set(cacheKey, { timestamp: Date.now(), data: result });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in OSM extract:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
