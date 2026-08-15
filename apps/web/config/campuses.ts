export interface CampusConfig {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  departments: string[];
  hostelBlocks: string[];
}

export const CAMPUS_REGISTRY: CampusConfig[] = [
  {
    id: "campus-cu",
    slug: "cu-chandigarh",
    name: "Chandigarh University",
    shortName: "CU",
    city: "Mohali / Gharuan",
    coordinates: { latitude: 30.7688, longitude: 76.5754 },
    radiusMeters: 1400,
    departments: ["Computer Science", "Engineering", "Management", "Biotech"],
    hostelBlocks: ["NC-1", "NC-2", "NC-3", "LC-1", "LC-2"]
  },
  {
    id: "campus-thapar",
    slug: "thapar-patiala",
    name: "Thapar Institute of Engineering & Technology",
    shortName: "TIET",
    city: "Patiala",
    coordinates: { latitude: 30.3538, longitude: 76.3639 },
    radiusMeters: 1600,
    departments: ["CSED", "ECED", "MED", "Civil"],
    hostelBlocks: ["Hostel A", "Hostel B", "Hostel J", "Hostel M", "Hostel N"]
  },
  {
    id: "campus-global",
    slug: "global",
    name: "Global Guest Network",
    shortName: "Global",
    city: "Worldwide",
    coordinates: { latitude: 28.6139, longitude: 77.2090 },
    radiusMeters: 5000,
    departments: ["General"],
    hostelBlocks: ["Public"]
  }
];
