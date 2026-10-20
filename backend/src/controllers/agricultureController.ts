import { Request, Response } from 'express';

interface CropProfile {
  id: string;
  name: string;
  kannada_name: string;
  category: 'Cereals & Millets' | 'Pulses' | 'Commercial & Cash' | 'Oilseeds' | 'Horticulture & Vegetables';
  seasons: string[];
  soil_types: string[];
  water_level: 'High' | 'Moderate' | 'Low';
  duration_days: string;
  expected_yield: string;
  sowing_window: string;
  irrigation_suitability: string[];
  agronomic_tips: string[];
  disease_management: string;
}

const CROP_DATABASE: CropProfile[] = [
  {
    id: 'ragi',
    name: 'Finger Millet (Ragi)',
    kannada_name: 'ರಾಗಿ (Ragi)',
    category: 'Cereals & Millets',
    seasons: ['Kharif', 'Summer'],
    soil_types: ['Red Soil', 'Red Loamy', 'Sandy Loam', 'Laterite', 'Clay Loam'],
    water_level: 'Low',
    duration_days: '105 - 120 days',
    expected_yield: '12 - 18 Quintals / Acre',
    sowing_window: 'July - August (Kharif), January (Summer)',
    irrigation_suitability: ['Rainfed', 'Sprinkler', 'Borewell', 'Drip'],
    agronomic_tips: [
      'Pre-treat seeds with Azospirillum (200g/acre) to improve nitrogen uptake.',
      'Maintain 22.5cm spacing between rows for optimal tillering.',
      'Highly drought-resistant; thrives across Southern Dry Zone of Karnataka (Mandya, Ramanagara, Tumakuru).'
    ],
    disease_management: 'Monitor for blast disease during rainy spells; spray Mancozeb or Pseudomonas fluorescens as prophylactic.'
  },
  {
    id: 'paddy',
    name: 'Paddy / Rice (Oryza sativa)',
    kannada_name: 'ಭತ್ತ (Bhatta)',
    category: 'Cereals & Millets',
    seasons: ['Kharif', 'Rabi'],
    soil_types: ['Clay Loam', 'Alluvial', 'Black Soil', 'Red Soil'],
    water_level: 'High',
    duration_days: '125 - 145 days',
    expected_yield: '25 - 32 Quintals / Acre',
    sowing_window: 'June - July (Kharif), November - December (Rabi)',
    irrigation_suitability: ['Canal', 'Borewell', 'Flood'],
    agronomic_tips: [
      'System of Rice Intensification (SRI) method reduces water usage by 30%.',
      'Incorporate green manure (Dhaincha or Sunnhemp) 15 days prior to transplanting.',
      'Maintain shallow 2-3cm standing water during vegetative tillering phase.'
    ],
    disease_management: 'Scout for stem borer and bacterial leaf blight; use neem oil extracts and pheromone traps.'
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane (Saccharum officinarum)',
    kannada_name: 'ಕಬ್ಬು (Kabbu)',
    category: 'Commercial & Cash',
    seasons: ['Perennial', 'Kharif'],
    soil_types: ['Clay Loam', 'Alluvial', 'Black Soil', 'Red Loamy'],
    water_level: 'High',
    duration_days: '300 - 365 days (10-12 months)',
    expected_yield: '40 - 60 Tonnes / Acre',
    sowing_window: 'January - March or June - August',
    irrigation_suitability: ['Drip', 'Canal', 'Borewell'],
    agronomic_tips: [
      'Subsurface drip fertigation increases sucrose yield and conserves 45% water.',
      'Earthing up should be completed within 90 days after planting to prevent lodging.',
      'Mandya and Cauvery basin represent premier high-recovery sugarcane belts.'
    ],
    disease_management: 'Install trichogramma egg parasitoids for internode borer biocontrol.'
  },
  {
    id: 'redgram',
    name: 'Pigeon Pea / Red Gram (Tur/Arhar)',
    kannada_name: 'ತೊಗರಿ (Togari)',
    category: 'Pulses',
    seasons: ['Kharif'],
    soil_types: ['Black Soil', 'Red Loamy', 'Clay Loam'],
    water_level: 'Low',
    duration_days: '150 - 180 days',
    expected_yield: '8 - 12 Quintals / Acre',
    sowing_window: 'June - July',
    irrigation_suitability: ['Rainfed', 'Borewell', 'Sprinkler'],
    agronomic_tips: [
      'Deep taproot system opens subsoil; fixes up to 40kg atmospheric nitrogen per hectare.',
      'Excellent as intercrop with Ragi, Maize or Groundnut (1:4 ratio).',
      'Requires minimal supplemental irrigation only at flowering and pod-filling.'
    ],
    disease_management: 'Spray NPV (Nuclear Polyhedrosis Virus) or Spinosad for pod borer (Helicoverpa armigera).'
  },
  {
    id: 'groundnut',
    name: 'Groundnut / Peanut (Arachis hypogaea)',
    kannada_name: 'ಕಡಲೆಕಾಯಿ (Kadalekayi)',
    category: 'Oilseeds',
    seasons: ['Kharif', 'Summer'],
    soil_types: ['Sandy Loam', 'Red Soil', 'Red Loamy'],
    water_level: 'Moderate',
    duration_days: '105 - 115 days',
    expected_yield: '10 - 15 Quintals / Acre',
    sowing_window: 'June - July (Rainfed), January (Irrigated)',
    irrigation_suitability: ['Sprinkler', 'Drip', 'Borewell'],
    agronomic_tips: [
      'Apply Gypsum (200kg/acre) at flowering stage for enhanced pod development and calcium assimilation.',
      'Ensure soil remains friable for easy peg penetration.',
      'Avoid waterlogging at all costs to prevent pod rot.'
    ],
    disease_management: 'Treat seeds with Trichoderma viride to prevent collar rot and stem rot.'
  },
  {
    id: 'maize',
    name: 'Maize / Corn (Zea mays)',
    kannada_name: 'ಮೆಕ್ಕೆಜೋಳ (Mekkejola)',
    category: 'Cereals & Millets',
    seasons: ['Kharif', 'Rabi'],
    soil_types: ['Red Loamy', 'Black Soil', 'Alluvial', 'Clay Loam'],
    water_level: 'Moderate',
    duration_days: '95 - 110 days',
    expected_yield: '25 - 35 Quintals / Acre',
    sowing_window: 'June - July (Kharif), October - November (Rabi)',
    irrigation_suitability: ['Drip', 'Canal', 'Borewell', 'Sprinkler'],
    agronomic_tips: [
      'Heavy nutrient consumer; balance NPK with zinc sulphate (10kg/acre) basal dose.',
      'Silking and grain filling are moisture-critical periods where water stress drastically cuts yields.'
    ],
    disease_management: 'Install pheromone traps to scout Fall Armyworm (FAW); release Trichogramma wasp cards.'
  },
  {
    id: 'cotton',
    name: 'Cotton (Gossypium)',
    kannada_name: 'ಹತ್ತಿ (Hatti)',
    category: 'Commercial & Cash',
    seasons: ['Kharif'],
    soil_types: ['Black Soil', 'Deep Loamy'],
    water_level: 'Moderate',
    duration_days: '150 - 170 days',
    expected_yield: '12 - 18 Quintals / Acre',
    sowing_window: 'May - June',
    irrigation_suitability: ['Drip', 'Borewell', 'Rainfed'],
    agronomic_tips: [
      'Thrives in black cotton soils with good moisture retention capacity.',
      'Nipping / terminal detopping at 80-90 days encourages lateral sympodial branching.'
    ],
    disease_management: 'Inspect lower leaf surfaces for whitefly and aphids; spray neem seed kernel extract (NSKE 5%).'
  },
  {
    id: 'tomato',
    name: 'Tomato (Solanum lycopersicum)',
    kannada_name: 'ಟೊಮ್ಯಾಟೊ (Tomato)',
    category: 'Horticulture & Vegetables',
    seasons: ['Kharif', 'Rabi', 'Summer'],
    soil_types: ['Red Loamy', 'Sandy Loam', 'Clay Loam'],
    water_level: 'Moderate',
    duration_days: '110 - 130 days',
    expected_yield: '15 - 25 Tonnes / Acre',
    sowing_window: 'Year-round under drip and staking',
    irrigation_suitability: ['Drip', 'Borewell'],
    agronomic_tips: [
      'Trellising / staking substantially reduces fungal transmission and boosts fruit grade.',
      'Silver-black plastic mulch conserves moisture and restricts weed emergence.'
    ],
    disease_management: 'Prophylactic application of Trichoderma and companion marigold planting to control root-knot nematodes.'
  }
];

export class AgricultureController {
  /**
   * POST /api/agriculture/crop-recommendation
   * Body:
   *  location: string
   *  soil_type: string
   *  season: string
   *  water_availability: string
   *  farm_size?: number
   *  previous_crop?: string
   *  irrigation_type?: string
   */
  static async getCropRecommendation(req: Request, res: Response): Promise<any> {
    try {
      const {
        location = 'Karnataka',
        soil_type = 'Red Soil',
        season = 'Kharif',
        water_availability = 'Moderate',
        farm_size = 2,
        previous_crop = '',
        irrigation_type = 'Borewell'
      } = req.body;

      // Normalization
      const normSoil = soil_type.toLowerCase();
      const normSeason = season.toLowerCase();
      const normWater = water_availability.toLowerCase();
      const normIrrigation = irrigation_type.toLowerCase();

      // Transparent scoring algorithm based on agronomic match
      const scoredCrops = CROP_DATABASE.map(crop => {
        let score = 50; // Base score
        const matchReasons: string[] = [];

        // 1. Season match (30 pts)
        const seasonMatch = crop.seasons.some(s => s.toLowerCase() === normSeason || s.toLowerCase() === 'perennial');
        if (seasonMatch) {
          score += 30;
          matchReasons.push(`Optimal sowing season for ${season}`);
        } else {
          score -= 25;
        }

        // 2. Soil match (25 pts)
        const soilMatch = crop.soil_types.some(st => normSoil.includes(st.toLowerCase()) || st.toLowerCase().includes(normSoil));
        if (soilMatch) {
          score += 20;
          matchReasons.push(`Highly suited to ${soil_type}`);
        } else {
          score -= 10;
        }

        // 3. Water availability alignment (20 pts)
        if (normWater === 'low' || normWater === 'rainfed') {
          if (crop.water_level === 'Low') {
            score += 20;
            matchReasons.push('Low water requirement matching rainfed/arid conditions');
          } else if (crop.water_level === 'High') {
            score -= 30;
          }
        } else if (normWater === 'high') {
          if (crop.water_level === 'High' || crop.water_level === 'Moderate') {
            score += 15;
            matchReasons.push('Abundant water supply supports high-yield potential');
          }
        } else {
          // Moderate
          if (crop.water_level === 'Moderate' || crop.water_level === 'Low') {
            score += 15;
          }
        }

        // 4. Irrigation system compatibility (10 pts)
        const irriMatch = crop.irrigation_suitability.some(i => normIrrigation.includes(i.toLowerCase()));
        if (irriMatch) {
          score += 10;
          matchReasons.push(`Compatible with ${irrigation_type} system`);
        }

        // 5. Crop rotation bonus
        if (previous_crop && previous_crop.toLowerCase() !== crop.name.toLowerCase()) {
          // If previous was legume/cereal rotation
          if (previous_crop.toLowerCase().includes('paddy') && crop.category === 'Pulses') {
            score += 10;
            matchReasons.push('Optimal cereal-to-pulse nitrogen replenishment rotation');
          } else if (previous_crop.toLowerCase().includes('ragi') && crop.category === 'Oilseeds') {
            score += 8;
            matchReasons.push('Breaks pest life cycle after millets');
          }
        }

        const clampedScore = Math.min(Math.max(score, 15), 98);

        return {
          ...crop,
          suitability_score: clampedScore,
          suitability_label: clampedScore >= 80 ? 'Highly Recommended' : clampedScore >= 60 ? 'Suitable' : 'Moderate Consideration',
          match_reasons: matchReasons,
        };
      });

      // Filter and sort by highest suitability
      scoredCrops.sort((a, b) => b.suitability_score - a.suitability_score);

      return res.status(200).json({
        success: true,
        data: scoredCrops.slice(0, 5),
        query: {
          location,
          soil_type,
          season,
          water_availability,
          farm_size: Number(farm_size),
          previous_crop: previous_crop || 'None specified',
          irrigation_type,
        },
        recommended_crops: scoredCrops.slice(0, 5),
        educational_disclaimer:
          'DISCLAIMER: Recommendations are for educational and advisory guidance based on agronomic standards. Please conduct a soil laboratory test and verify with your local Raitha Samparka Kendra or Krishi Vigyan Kendra (KVK) before final commercial sowing.',
      });
    } catch (error: any) {
      console.error('[AgricultureController.getCropRecommendation error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process crop recommendation',
      });
    }
  }
}
