import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../src/config/db.js';

export async function runSeeds() {
  console.log('[Seed] Checking if database seeding is needed...');

  const userCountRes = await query('SELECT COUNT(*) as count FROM users');
  const userCount = parseInt(userCountRes.rows[0].count, 10);

  if (userCount === 0) {
    console.log('[Seed] Seeding initial users and profiles (1 Admin, 2 Farmers, 2 Owners)...');

    const saltRounds = 10;
    const adminHash = await bcrypt.hash('Admin@123', saltRounds);
    const farmerHash = await bcrypt.hash('Farmer@123', saltRounds);
    const ownerHash = await bcrypt.hash('Owner@123', saltRounds);

    // 1. Seed Admin
    const adminId = crypto.randomUUID();
    const adminProfileId = crypto.randomUUID();
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [adminId, 'AgroRent System Admin', 'admin@agrorent.com', '9876543210', adminHash, 'ADMIN', true]
    );
    await query(
      `INSERT INTO admin_profiles (id, user_id, created_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [adminProfileId, adminId]
    );

    // 2. Seed Farmer 1
    const farmer1Id = crypto.randomUUID();
    const farmer1ProfileId = crypto.randomUUID();
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [farmer1Id, 'Ramesh Kumar', 'ramesh.farmer@agrorent.com', '9876543211', farmerHash, 'FARMER', true]
    );
    await query(
      `INSERT INTO farmer_profiles (id, user_id, address, village, taluk, district, state, pincode, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [farmer1ProfileId, farmer1Id, 'Plot 42, Green Valley Farms', 'Maddur Village', 'Maddur', 'Mandya', 'Karnataka', '571428']
    );

    // 3. Seed Farmer 2
    const farmer2Id = crypto.randomUUID();
    const farmer2ProfileId = crypto.randomUUID();
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [farmer2Id, 'Suresh Gowda', 'suresh.farmer@agrorent.com', '9876543212', farmerHash, 'FARMER', true]
    );
    await query(
      `INSERT INTO farmer_profiles (id, user_id, address, village, taluk, district, state, pincode, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [farmer2ProfileId, farmer2Id, 'Survey 18, Harohalli Fields', 'Harohalli', 'Kanakapura', 'Ramanagara', 'Karnataka', '562112']
    );

    // 4. Seed Owner 1
    const owner1Id = crypto.randomUUID();
    const owner1ProfileId = crypto.randomUUID();
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [owner1Id, 'Vikram Patil', 'vikram.owner@agrorent.com', '9876543213', ownerHash, 'OWNER', true]
    );
    await query(
      `INSERT INTO owner_profiles (id, user_id, address, village, taluk, district, state, pincode, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [owner1ProfileId, owner1Id, 'Agro Machinery Yard, Main Road', 'Channapatna Rural', 'Channapatna', 'Ramanagara', 'Karnataka', '562160']
    );

    // 5. Seed Owner 2
    const owner2Id = crypto.randomUUID();
    const owner2ProfileId = crypto.randomUUID();
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [owner2Id, 'Anita Sharma', 'anita.owner@agrorent.com', '9876543214', ownerHash, 'OWNER', true]
    );
    await query(
      `INSERT INTO owner_profiles (id, user_id, address, village, taluk, district, state, pincode, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [owner2ProfileId, owner2Id, 'Kisan Tractor & Tools Hub', 'Nelamangala', 'Nelamangala', 'Bangalore Rural', 'Karnataka', '562123']
    );

    console.log('[Seed] Database seeded successfully with 1 Admin, 2 Farmers, 2 Owners.');
  } else {
    console.log(`[Seed] Database already has ${userCount} users. Skipping user seed.`);
  }

  // Seed Initial Equipment if empty
  try {
    const eqCountRes = await query('SELECT COUNT(*) as count FROM equipment');
    const eqCount = parseInt(eqCountRes.rows[0]?.count || '0', 10);

    if (eqCount === 0) {
      console.log('[Seed] Seeding sample agricultural equipment...');
      const vikramRes = await query('SELECT id FROM users WHERE email = $1', ['vikram.owner@agrorent.com']);
      const anitaRes = await query('SELECT id FROM users WHERE email = $1', ['anita.owner@agrorent.com']);

      const vikramId = vikramRes.rows[0]?.id;
      const anitaId = anitaRes.rows[0]?.id;

      if (vikramId && anitaId) {
        const sampleEquipment = [
          {
            owner_id: vikramId,
            name: 'Mahindra 575 DI Tractor 45HP',
            category: 'Tractor',
            description: 'Powerful 45 HP 4-cylinder tractor with power steering and hydraulic lift. Ideal for heavy tillage, rotavator, and haulage in black or red soil.',
            brand: 'Mahindra',
            model: '575 DI XP Plus',
            image_url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 800,
            location: 'Channapatna, Ramanagara, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            owner_id: anitaId,
            name: 'John Deere 5050D Heavy Duty Tractor',
            category: 'Tractor',
            description: 'Reliable 50 HP John Deere tractor equipped with dual clutch, oil immersed disc brakes, and high backup torque.',
            brand: 'John Deere',
            model: '5050D PowerPro',
            image_url: 'https://images.unsplash.com/photo-1589874836640-27926e838b97?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 950,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            owner_id: vikramId,
            name: 'JCB 3DX EcoXcellence Backhoe Loader',
            category: 'JCB',
            description: 'Heavy duty earthmoving and trench excavation machine. Perfect for land leveling, farm pond digging, and clearing stubborn roots.',
            brand: 'JCB',
            model: '3DX Super',
            image_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 1400,
            location: 'Ramanagara Town, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            owner_id: vikramId,
            name: 'Kubota DC-68G Self-Propelled Paddy Harvester',
            category: 'Harvester',
            description: 'High efficiency combine harvester for paddy and wheat fields. Features crawler track for wet or marshy fields without getting stuck.',
            brand: 'Kubota',
            model: 'DC-68G',
            image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 2200,
            location: 'Mandya Rural, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            owner_id: anitaId,
            name: 'Shaktiman Regular Smart Rotary Tiller (Rotavator)',
            category: 'Rotavator',
            description: '6-feet multispeed gear box rotavator with L-type Boron steel blades. Produces fine soil tilth for seedbed preparation in one pass.',
            brand: 'Shaktiman',
            model: 'SRT-6',
            image_url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 500,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            owner_id: vikramId,
            name: 'Lemken 9-Tyne Spring Loaded Cultivator',
            category: 'Cultivator',
            description: 'Spring loaded cultivator designed to aerate soil, eliminate deep weeds, and prepare rough fields before sowing.',
            brand: 'Lemken',
            model: 'Achat 70/9',
            image_url: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 450,
            location: 'Channapatna, Ramanagara, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            owner_id: anitaId,
            name: 'Kirloskar 7.5 HP Diesel High Head Water Pump',
            category: 'Water Pump',
            description: 'Portable high-pressure centrifugal diesel pump with 3-inch inlet/outlet hose. Capable of lifting water from deep borewells or river canals.',
            brand: 'Kirloskar',
            model: 'KDS-715',
            image_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 300,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            owner_id: vikramId,
            name: 'Sonalika Tiger DI 50 Tractor (Pending Admin Verification)',
            category: 'Tractor',
            description: 'Brand new 52 HP tractor listing pending document verification by AgroRent administration.',
            brand: 'Sonalika',
            model: 'Tiger DI 50',
            image_url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=60',
            price_per_hour: 850,
            location: 'Ramanagara Town, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'PENDING',
          },
        ];

        for (const eq of sampleEquipment) {
          const eqId = crypto.randomUUID();
          await query(
            `INSERT INTO equipment (
              id, owner_id, name, category, description, brand, model,
              image_url, price_per_hour, location, availability_status, approval_status,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              eqId, eq.owner_id, eq.name, eq.category, eq.description, eq.brand, eq.model,
              eq.image_url, eq.price_per_hour, eq.location, eq.availability_status, eq.approval_status
            ]
          );
        }
        console.log(`[Seed] Seeded ${sampleEquipment.length} sample agricultural equipment items.`);
      }
    }
  } catch (err: any) {
    console.warn('[Seed] Could not seed equipment:', err.message);
  }

  // Seed Initial Animal & Bird Listings if empty
  try {
    const animalCountRes = await query('SELECT COUNT(*) as count FROM animal_listings');
    const animalCount = parseInt(animalCountRes.rows[0]?.count || '0', 10);

    if (animalCount === 0) {
      console.log('[Seed] Seeding sample animal and bird marketplace listings...');
      const vikramRes = await query('SELECT id FROM users WHERE email = $1', ['vikram.owner@agrorent.com']);
      const anitaRes = await query('SELECT id FROM users WHERE email = $1', ['anita.owner@agrorent.com']);

      const vikramId = vikramRes.rows[0]?.id;
      const anitaId = anitaRes.rows[0]?.id;

      if (vikramId && anitaId) {
        const sampleAnimals = [
          {
            seller_id: vikramId,
            listing_type: 'ANIMAL',
            category: 'Cow',
            name: 'Holstein Friesian High-Yield Dairy Cow',
            breed: 'Holstein Friesian',
            age: '3 years',
            gender: 'FEMALE',
            description: 'Second lactation pedigree HF dairy cow yielding 22-25 liters/day. Fully vaccinated, dewormed, docile temperament, and accustomed to machine milking.',
            price: 75000,
            quantity: 2,
            location: 'Channapatna, Ramanagara, Karnataka',
            image_url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&auto=format&fit=crop&q=60',
            health_status: 'FMD & Brucellosis Vaccinated, Vet Health Certificate available',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            seller_id: anitaId,
            listing_type: 'ANIMAL',
            category: 'Buffalo',
            name: 'Murrah Champion Milking Buffalo',
            breed: 'Murrah',
            age: '4 years',
            gender: 'FEMALE',
            description: 'Purebred black Murrah buffalo in peak second lactation. Yields 16 liters daily with high 7.8% fat content. Ideal for premium commercial dairy farms.',
            price: 85000,
            quantity: 1,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            image_url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=60',
            health_status: 'Vaccinated against HS and BQ, regular veterinary checkups',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            seller_id: vikramId,
            listing_type: 'ANIMAL',
            category: 'Goat',
            name: 'Pure South African Boer Stud Goat',
            breed: 'Boer',
            age: '1.5 years',
            gender: 'MALE',
            description: 'Exceptional genetics Boer stud buck for commercial crossbreeding. Fast growth rate, strong bone structure, weighing 68 kg.',
            price: 24000,
            quantity: 4,
            location: 'Ramanagara, Karnataka',
            image_url: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&auto=format&fit=crop&q=60',
            health_status: 'PPR and Enterotoxemia Vaccinated, dewormed on schedule',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            seller_id: anitaId,
            listing_type: 'BIRD',
            category: 'Chicken',
            name: 'Original Kadaknath Black Meat Free-Range Chickens',
            breed: 'Kadaknath',
            age: '6 months',
            gender: 'MALE',
            description: 'Authentic pure black Kadaknath cockerels raised in organic open-grazing yard. High protein, rich in iron, and low cholesterol native breed.',
            price: 1200,
            quantity: 20,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            image_url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=60',
            health_status: 'Marek & Ranikhet (RD) vaccinated, 100% antibiotic-free grain fed',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            seller_id: vikramId,
            listing_type: 'BIRD',
            category: 'Duck',
            name: 'White Pekin Fast-Growing Duck Pair',
            breed: 'White Pekin',
            age: '8 months',
            gender: 'FEMALE',
            description: 'Healthy white Pekin ducks accustomed to farm ponds and orchards. Excellent dual-purpose breed for premium table meat and heavy egg production.',
            price: 950,
            quantity: 15,
            location: 'Channapatna, Ramanagara, Karnataka',
            image_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=60',
            health_status: 'Duck plague and cholera vaccinated, very active',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            seller_id: anitaId,
            listing_type: 'ANIMAL',
            category: 'Goat',
            name: 'Sirohi High-Lactation Doe (Female Goat)',
            breed: 'Sirohi',
            age: '2 years',
            gender: 'FEMALE',
            description: 'Hardy Rajasthan Sirohi goat acclimatized to South Indian conditions. High disease resistance, yields 1.5 to 2 liters of rich milk daily.',
            price: 18500,
            quantity: 5,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            image_url: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=800&auto=format&fit=crop&q=60',
            health_status: 'Dewormed monthly, healthy hooves and teeth, ET vaccinated',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            seller_id: vikramId,
            listing_type: 'ANIMAL',
            category: 'Buffalo',
            name: 'Young Murrah Buffalo Heifer (Awaiting Verification)',
            breed: 'Murrah',
            age: '2 years',
            gender: 'FEMALE',
            description: 'Healthy heifer ready for first breeding. Clear pedigree records and calm demeanor.',
            price: 55000,
            quantity: 1,
            location: 'Channapatna, Ramanagara, Karnataka',
            image_url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=60',
            health_status: 'Routine vaccinations up to date',
            availability_status: 'AVAILABLE',
            approval_status: 'PENDING',
          },
        ];

        for (const item of sampleAnimals) {
          const animalId = crypto.randomUUID();
          await query(
            `INSERT INTO animal_listings (
              id, seller_id, listing_type, category, name, breed, age, gender,
              description, price, quantity, location, image_url, health_status,
              availability_status, approval_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              animalId, item.seller_id, item.listing_type, item.category, item.name, item.breed,
              item.age, item.gender, item.description, item.price, item.quantity, item.location,
              item.image_url, item.health_status, item.availability_status, item.approval_status
            ]
          );
        }
        console.log(`[Seed] Seeded ${sampleAnimals.length} sample animal & bird marketplace listings.`);
      }
    }
  } catch (err: any) {
    console.warn('[Seed] Could not seed animal listings:', err.message);
  }

  // Seed Initial Driver & Farm Worker Service Profiles if empty
  try {
    const serviceCountRes = await query('SELECT COUNT(*) as count FROM service_profiles');
    const serviceCount = parseInt(serviceCountRes.rows[0]?.count || '0', 10);

    if (serviceCount === 0) {
      console.log('[Seed] Seeding sample driver and farm worker service profiles...');
      const vikramRes = await query('SELECT id FROM users WHERE email = $1', ['vikram.owner@agrorent.com']);
      const anitaRes = await query('SELECT id FROM users WHERE email = $1', ['anita.owner@agrorent.com']);
      const farmerRes = await query('SELECT id FROM users WHERE email = $1', ['ramesh.farmer@agrorent.com']);

      const vikramId = vikramRes.rows[0]?.id;
      const anitaId = anitaRes.rows[0]?.id;
      const farmerId = farmerRes.rows[0]?.id;

      if (vikramId && anitaId) {
        const sampleServices = [
          {
            user_id: vikramId,
            service_type: 'DRIVER',
            name: 'Ramesh Patel',
            phone: '9845123401',
            profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
            description: 'Licensed heavy commercial and agricultural machinery driver with 8 years of experience in paddy, sugarcane, and cotton fields. Expert in John Deere and Mahindra tractor operation with deep ploughing and laser levelling.',
            experience_years: 8,
            skills: 'Tractor Driving, Rotavator Operation, Laser Levelling, Ploughing, Disc Harrow',
            price_per_hour: 350,
            price_per_day: 2500,
            location: 'Mandya, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            user_id: anitaId,
            service_type: 'DRIVER',
            name: 'Manjunath Gowda',
            phone: '9845123402',
            profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60',
            description: 'Professional heavy machinery and combine harvester operator with 6 years experience across Karnataka. Specializes in Claas harvesters and JCB excavation for farm pond digging and land clearance.',
            experience_years: 6,
            skills: 'Combine Harvester, JCB Excavator, Land Clearing, Pond Excavation, Paddy Harvesting',
            price_per_hour: 600,
            price_per_day: 4500,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            user_id: vikramId,
            service_type: 'DRIVER',
            name: 'Anand Kumar',
            phone: '9845123403',
            profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=60',
            description: 'Skilled small-machinery driver specializing in power tiller tilling in wetland paddy fields and orchard boom sprayers. Fast, punctual, and reliable.',
            experience_years: 4,
            skills: 'Power Tiller, Tractor Boom Sprayer, Wetland Puddling, Orchard Weeder',
            price_per_hour: 280,
            price_per_day: 2000,
            location: 'Channapatna, Ramanagara, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            user_id: anitaId,
            service_type: 'DRIVER',
            name: 'Suresh Nayak',
            phone: '9845123404',
            profile_image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=60',
            description: 'Commercial transport driver for grain transport from fields to APMC Mandis. Commercial heavy license with spotless driving record.',
            experience_years: 5,
            skills: 'Truck Driving, Grain Transport, APMC Hauling, Heavy Trailer',
            price_per_hour: 400,
            price_per_day: 3000,
            location: 'Ramanagara, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'PENDING',
          },
          {
            user_id: vikramId,
            service_type: 'FARM_WORKER',
            name: 'Lakshmi Devi',
            phone: '9845123405',
            profile_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
            description: 'Experienced agricultural worker and field team supervisor with 10 years experience in vegetable sowing, organic weeding, paddy transplantation, and cotton picking.',
            experience_years: 10,
            skills: 'Paddy Transplantation, Vegetable Harvesting, Hand Weeding, Drip Line Laying, Cotton Picking',
            price_per_hour: 150,
            price_per_day: 1000,
            location: 'Maddur, Mandya, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            user_id: anitaId,
            service_type: 'FARM_WORKER',
            name: 'Basavaraj Shivappa',
            phone: '9845123406',
            profile_image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60',
            description: 'Specialist farm technician with expertise in micro-irrigation installation, emitter cleaning, organic pesticide preparation, knapsack spraying, and pruning.',
            experience_years: 7,
            skills: 'Drip Irrigation Maintenance, Organic Spraying, Tree Pruning, Fertilizer Broadcasting, Polyhouse Care',
            price_per_hour: 200,
            price_per_day: 1400,
            location: 'Nelamangala, Bangalore Rural, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            user_id: vikramId,
            service_type: 'FARM_WORKER',
            name: 'Devendra Gowda',
            phone: '9845123407',
            profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60',
            description: 'Energetic all-round farm hand for fencing, fodder cutting with chaff cutters, animal feeding, canal cleaning, and post-harvest bagging.',
            experience_years: 5,
            skills: 'Fodder Cutting, Dairy Barn Assistance, Fencing, Grain Bagging, Soil Preparation',
            price_per_hour: 140,
            price_per_day: 950,
            location: 'Channapatna, Ramanagara, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'APPROVED',
          },
          {
            user_id: anitaId,
            service_type: 'FARM_WORKER',
            name: 'Revanna Swamy',
            phone: '9845123408',
            profile_image_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop&q=60',
            description: 'Skilled in careful plucking, post-harvest washing, grading by size/quality, and crate packaging for tomatoes, mangoes, and pomegranates.',
            experience_years: 3,
            skills: 'Fruit Plucking, Quality Sorting, Crate Packing, Post-Harvest Handling',
            price_per_hour: 160,
            price_per_day: 1100,
            location: 'Mandya, Karnataka',
            availability_status: 'AVAILABLE',
            approval_status: 'PENDING',
          },
        ];

        const insertedProfiles: any[] = [];
        for (const item of sampleServices) {
          const profileId = crypto.randomUUID();
          await query(
            `INSERT INTO service_profiles (
              id, user_id, service_type, name, phone, profile_image_url,
              description, experience_years, skills, price_per_hour, price_per_day,
              location, availability_status, approval_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              profileId, item.user_id, item.service_type, item.name, item.phone,
              item.profile_image_url, item.description, item.experience_years, item.skills,
              item.price_per_hour, item.price_per_day, item.location, item.availability_status, item.approval_status
            ]
          );
          insertedProfiles.push({ id: profileId, ...item });
        }
        console.log(`[Seed] Seeded ${sampleServices.length} sample driver & farm worker profiles.`);

        // Seed 1 completed service booking and 1 pending booking if farmer exists
        if (farmerId && insertedProfiles.length > 0) {
          const driverProfile = insertedProfiles[0]; // Ramesh Patel
          const workerProfile = insertedProfiles[4]; // Lakshmi Devi

          const booking1Id = crypto.randomUUID();
          await query(
            `INSERT INTO service_bookings (
              id, service_profile_id, farmer_id, provider_id, service_type,
              booking_date, start_time, end_time, duration_hours, price_per_hour, price_per_day,
              total_amount, booking_status, payment_status, work_location, work_description,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5,
              CURRENT_DATE - INTERVAL '2 days', '08:00', '16:00', 8, 350, 2500,
              2500, 'COMPLETED', 'PAID', 'Maddur Green Valley Plot 4', 'Tractor rotavator tilling for upcoming paddy season',
              CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days'
            )`,
            [booking1Id, driverProfile.id, farmerId, driverProfile.user_id, driverProfile.service_type]
          );

          const booking2Id = crypto.randomUUID();
          await query(
            `INSERT INTO service_bookings (
              id, service_profile_id, farmer_id, provider_id, service_type,
              booking_date, start_time, end_time, duration_hours, price_per_hour, price_per_day,
              total_amount, booking_status, payment_status, work_location, work_description,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5,
              CURRENT_DATE + INTERVAL '1 day', '09:00', '17:00', 8, 150, 1000,
              1000, 'PENDING', 'PENDING', 'Maddur Organic Vegetable Field 12', 'Assistance with chili seedlings transplantation and drip alignment',
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )`,
            [booking2Id, workerProfile.id, farmerId, workerProfile.user_id, workerProfile.service_type]
          );
          console.log('[Seed] Seeded 2 sample service bookings.');
        }
      }
    }
  } catch (err: any) {
    console.warn('[Seed] Could not seed service profiles:', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 7: Government Schemes & Farmer Resources Seeding
  // -------------------------------------------------------------
  try {
    const schemeCountRes = await query('SELECT COUNT(*) as count FROM government_schemes');
    const schemeCount = parseInt(schemeCountRes.rows[0].count, 10);

    if (schemeCount === 0) {
      console.log('[Seed] Seeding Phase 7: Government Schemes & Farmer Resources...');

      const sampleSchemes = [
        {
          title: 'PM-Kisan Samman Nidhi',
          short_description: 'Direct income support of ₹6,000 per year in three equal installments to all landholding farmer families across India.',
          full_description: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a central sector scheme with 100% funding from the Government of India. Under the scheme, an income support of ₹6,000 per year is provided in three equal installments of ₹2,000 each directly into the bank accounts of the farmer families across India via Direct Benefit Transfer (DBT). The funds help farmers meet various agricultural inputs and domestic obligations.',
          category: 'Financial Assistance',
          government_level: 'CENTRAL',
          state: 'CENTRAL',
          department: 'Ministry of Agriculture & Farmers Welfare',
          benefits: '• ₹6,000 per year disbursed directly into bank accounts via DBT in 3 installments of ₹2,000 every 4 months.\n• Transparent digital payment mechanism with no middlemen.\n• Coverage for all small, marginal, and large landholding cultivators.',
          eligibility: '• All landholding farmer families having cultivable landholding in their names.\n• Aadhaar card linked with active bank account and NPCI mapping.\n• Exclusion: Institutional landholders, farmer families holding constitutional posts, serving or retired government officers/employees, and professionals paying income tax.',
          required_documents: '1. Aadhaar Card of the applicant\n2. Land ownership documents (Record of Rights / RTC / Pahani)\n3. Active Bank Passbook with IFSC linked to Aadhaar\n4. Mobile number linked with Aadhaar for e-KYC',
          application_process: '1. Visit the official PM-KISAN portal (https://pmkisan.gov.in) or your nearest Common Service Centre (CSC) / Raitha Samparka Kendra.\n2. Click on "New Farmer Registration" under Farmers Corner.\n3. Enter Aadhaar number, state, district, sub-district, and land survey details.\n4. Complete e-KYC verification using OTP or biometric verification.\n5. State nodal officer verifies land records and approves eligibility.',
          official_url: 'https://pmkisan.gov.in',
          helpline: '155261 / 011-24300606',
          image_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: true,
        },
        {
          title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
          short_description: 'Comprehensive risk and crop loss insurance covering pre-sowing to post-harvest natural hazards with minimal farmer premium.',
          full_description: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) provides a comprehensive insurance cover against failure of crops, thereby helping in stabilizing the income of farmers and encouraging them to adopt innovative agricultural practices. Farmers pay a nominal uniform premium of only 2% for all Kharif crops, 1.5% for all Rabi crops, and 5% for annual commercial/horticultural crops, with the balance subsidized equally by the Central and State governments.',
          category: 'Crop Insurance',
          government_level: 'CENTRAL',
          state: 'CENTRAL',
          department: 'Department of Agriculture and Farmers Welfare',
          benefits: '• Comprehensive coverage for prevent sowing, mid-season adversity, localized risks (hailstorm, landslide, inundation), and post-harvest losses.\n• Minimal premium: 2% for Kharif crops, 1.5% for Rabi crops, and 5% for horticultural crops.\n• Fast claims settlement using satellite remote sensing and mobile app crop cutting experiments.',
          eligibility: '• All farmers including sharecroppers and tenant farmers growing notified crops in notified areas.\n• Applicable to both loanee farmers (holding crop loans) and non-loanee farmers.',
          required_documents: '1. Land ownership record (RTC / Pahani) or valid tenancy agreement\n2. Sowing certificate or crop sowing declaration from Village Accountant / Patwari\n3. Aadhaar Card copy\n4. Bank passbook showing active account number and IFSC',
          application_process: '1. Register online on the National Crop Insurance Portal (https://pmfby.gov.in) or visit your lending bank branch, CSC, or Agriculture Department office before the cut-off date.\n2. Select State, Season, Year, and Notified Crop.\n3. Fill in survey numbers, acreage, and upload bank and sowing proof.\n4. Pay farmer share of premium digitally and receive policy acknowledgement receipt.',
          official_url: 'https://pmfby.gov.in',
          helpline: '14447 (National Toll Free)',
          image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: true,
        },
        {
          title: 'Raitha Siri Scheme (Karnataka)',
          short_description: 'Karnataka state incentive of ₹10,000 per hectare for cultivating minor millets like Ragi, Navane, and Haraka.',
          full_description: 'Raitha Siri is an initiative of the Government of Karnataka to encourage the cultivation of climate-resilient nutritious minor millets including Finger Millet (Ragi), Foxtail Millet (Navane), Little Millet (Same), Kodo Millet (Haraka), Proso Millet (Baragu), and Barnyard Millet (Oodalu). Eligible registered farmers receive an incentive of ₹10,000 per hectare directly into their bank accounts via DBT.',
          category: 'Agriculture',
          government_level: 'STATE',
          state: 'KARNATAKA',
          department: 'Department of Agriculture, Government of Karnataka',
          benefits: '• Direct cash incentive of ₹10,000 per hectare (up to a maximum of 2 hectares per farmer family).\n• Promotes climate-resilient dryland crops with low water requirements.\n• Guaranteed procurement support and nutritional food security.',
          eligibility: '• Farmers holding agricultural land in Karnataka state.\n• Cultivating notified minor millets during Kharif or Rabi seasons.\n• Land and crop details must be registered and verified in the Karnataka FRUITS (Farmer Registration and Unified Beneficiary Information System) portal.',
          required_documents: '1. FRUITS ID / Registration Number\n2. Land Record (Pahani / RTC)\n3. Aadhaar Card\n4. Bank Passbook linked with Aadhaar / NPCI mapping',
          application_process: '1. Enroll in the Karnataka FRUITS portal (https://fruits.karnataka.gov.in) with your Aadhaar and land RTC.\n2. Ensure your minor millet crop is accurately recorded in the Village Crop Survey (Bele Darshini app).\n3. Submit application at nearest Raitha Samparka Kendra (RSK) or Taluk Agriculture Office.\n4. Field verification is conducted by Agriculture Officers, after which funds are disbursed via DBT.',
          official_url: 'https://raitamitra.karnataka.gov.in',
          helpline: '1800-425-3553 / 080-22212804',
          image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: true,
        },
        {
          title: 'Krishi Bhagya Scheme (Karnataka)',
          short_description: 'Up to 80-90% subsidy for constructing farm ponds (Krishi Honda), polythene lining, diesel/solar pump sets, and drip systems in rainfed areas.',
          full_description: 'The Krishi Bhagya scheme by the Karnataka Department of Agriculture focuses on sustainable dryland farming by conserving rainwater in farm ponds (Krishi Honda) and providing protective irrigation during dry spells. The package includes constructing farm ponds, polythene tarpaulin lining to stop percolation, diesel or solar pump sets, and shade net / micro-irrigation equipment with substantial subsidies.',
          category: 'Irrigation',
          government_level: 'STATE',
          state: 'KARNATAKA',
          department: 'Agriculture Department, Government of Karnataka',
          benefits: '• 80% subsidy for General category farmers and 90% subsidy for SC/ST farmers for farm ponds and micro-irrigation.\n• Reliable on-farm water reservoir protecting rainfed crops from acute drought.\n• Subsidies for diesel/solar pump lifting equipment and farm fence protection.',
          eligibility: '• Rainfed and dryland farmers residing in designated taluks of Karnataka.\n• Minimum cultivable land holding of 1 acre (0.4 hectares).\n• Must not have availed similar pond subsidy within the preceding 5 years.',
          required_documents: '1. Land RTC / Pahani showing ownership\n2. Caste Certificate (for SC/ST beneficiaries requesting 90% subsidy)\n3. Aadhaar Card\n4. Bank account passbook copy\n5. Passport size photographs',
          application_process: '1. Obtain application form from the local Raitha Samparka Kendra (RSK) or download from Raita Mitra portal.\n2. Submit filled form with land RTC and soil/water contour feasibility report.\n3. Pre-sanction inspection is performed by the Assistant Director of Agriculture.\n4. Pond excavation is completed, GPS tagged, and subsidy is directly credited to beneficiary or vendor account.',
          official_url: 'https://raitamitra.karnataka.gov.in',
          helpline: '1800-425-3553',
          image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: false,
        },
        {
          title: 'PM-KUSUM Solar Agriculture Pump Scheme',
          short_description: 'Up to 60% capital subsidy for installing standalone off-grid solar irrigation pumps and solarizing existing grid-connected tube wells.',
          full_description: 'Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM) aims to de-dieselise the farm sector and provide water and energy security to farmers. Under Component-B, individual farmers are supported to install standalone solar agriculture pumps of capacity up to 7.5 HP with financial support where Central and State governments each contribute 30% subsidy, with farmers contributing only 40% (or 10% with bank loans).',
          category: 'Equipment Subsidy',
          government_level: 'CENTRAL',
          state: 'CENTRAL',
          department: 'Ministry of New and Renewable Energy (MNRE)',
          benefits: '• Up to 60% total subsidy on solar water pump system (30% Central + 30% State).\n• Zero electricity bills and complete freedom from erratic rural power supply schedules.\n• Reliable daytime irrigation increasing multi-cropping yield by 30-50%.',
          eligibility: '• Individual farmers, groups of farmers, Water User Associations, and FPOs.\n• Having cultivable land with an existing functional borewell or open water source without grid electricity connection.',
          required_documents: '1. Aadhaar Card\n2. Land records (RTC/Pahani) with water source certification\n3. Electricity Supply Company (ESCOM) non-energized certificate\n4. Bank account details and self-declaration',
          application_process: '1. Register online on the state renewable energy development agency portal (e.g. KREDL in Karnataka) or PM-KUSUM portal.\n2. Select pump horsepower (3 HP, 5 HP, or 7.5 HP) and solar vendor from empanelled list.\n3. Deposit farmer beneficiary share.\n4. Empanelled vendor installs solar panel arrays, controller, and submersible pump with 5-year comprehensive warranty.',
          official_url: 'https://pmkusum.mnre.gov.in',
          helpline: '1800-180-3333',
          image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: true,
        },
        {
          title: 'Kisan Credit Card (KCC) Scheme',
          short_description: 'Concessional institutional credit up to ₹3 Lakh at an effective 4% interest rate for crop cultivation and post-harvest expenses.',
          full_description: 'The Kisan Credit Card (KCC) scheme provides adequate and timely institutional credit under a single window with flexible and simplified procedures to farmers for their cultivation and other short-term credit needs. Under the Interest Subvention Scheme, the standard 7% interest rate is reduced to an effective 4% per annum for farmers who make prompt repayments within 12 months.',
          category: 'Farmer Loans',
          government_level: 'CENTRAL',
          state: 'CENTRAL',
          department: 'Department of Financial Services / Ministry of Agriculture',
          benefits: '• Revolving cash credit limit based on cropping pattern, acreage, and scale of finance.\n• Low effective interest rate of 4% per annum on prompt loan repayments.\n• No collateral security required for agricultural loans up to ₹1.6 Lakh.\n• ATM-enabled RuPay debit card allowing easy cash withdrawal at rural ATMs.',
          eligibility: '• All farmers - individuals / joint borrowers who are owner cultivators.\n• Tenant farmers, oral lessees, and sharecroppers.\n• Animal husbandry, poultry, and fisheries farmers are also eligible for working capital credit up to ₹2 Lakh.',
          required_documents: '1. Completed KCC application form\n2. Two passport size photographs\n3. Identity & address proof (Aadhaar / Voter ID / Driving License)\n4. Land records (Pahani / RTC) attested by revenue authority',
          application_process: '1. Download standard one-page KCC application from your bank website or visit nearest commercial, regional rural, or cooperative bank branch.\n2. Submit identity documents and land cultivation certificate.\n3. Bank processes application and issues RuPay Kisan Credit Card within 14 working days.',
          official_url: 'https://www.myscheme.gov.in/schemes/kcc',
          helpline: '1800-115-526 / 1800-180-1551',
          image_url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: false,
        },
        {
          title: 'Pashu Bhagya Scheme (Karnataka)',
          short_description: 'Up to 33% subsidy (70% for SC/ST) on bank loans for purchasing dairy cows, buffaloes, sheep, goats, and poultry birds.',
          full_description: 'Pashu Bhagya is a flagship initiative of the Government of Karnataka administered by the Department of Animal Husbandry & Veterinary Services. It provides back-ended capital subsidies on loans sanctioned by commercial and cooperative banks to establish cattle units (cows/buffaloes), sheep/goat rearing units, and broiler/layer poultry units to ensure sustainable year-round rural livelihoods.',
          category: 'Livestock',
          government_level: 'STATE',
          state: 'KARNATAKA',
          department: 'Department of Animal Husbandry and Veterinary Services, Karnataka',
          benefits: '• 33% back-ended subsidy for general farmers and 70% for SC/ST beneficiaries on livestock bank loans.\n• Subsidized livestock insurance premiums (up to 50%) for registered animals.\n• Free veterinary health camps, ear-tagging, and vaccination support.',
          eligibility: '• Small, marginal farmers and rural agricultural laborers residing in Karnataka.\n• Priority given to women farmers, rural youth, and self-help group members.\n• Basic fodder cultivation or animal housing arrangement.',
          required_documents: '1. Aadhaar Card copy\n2. Caste Certificate (mandatory for SC/ST 70% subsidy quota)\n3. Bank account passbook\n4. Veterinary Officer recommendation certificate\n5. Residence / Domicile certificate',
          application_process: '1. Apply through the local Government Veterinary Hospital / Assistant Director of Animal Husbandry office.\n2. Attend brief training or verification session on dairy / livestock management.\n3. Bank issues loan sanction letter and Department releases subsidy portion upon animal procurement and tagging.',
          official_url: 'https://ahvs.karnataka.gov.in',
          helpline: '080-22864986 / 080-22864987',
          image_url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: false,
        },
        {
          title: 'Paramparagat Krishi Vikas Yojana (PKVY)',
          short_description: 'Financial support of ₹50,000 per hectare over 3 years for cluster-based organic farming and PGS-India certification.',
          full_description: 'Paramparagat Krishi Vikas Yojana (PKVY) is an extended component of Soil Health Management under the National Mission for Sustainable Agriculture (NMSA). It promotes organic farming through a cluster approach with Participatory Guarantee System (PGS) certification. Farmers in groups receive financial aid for soil enrichment, organic inputs procurement, seed processing, and direct market branding.',
          category: 'Organic Farming',
          government_level: 'CENTRAL',
          state: 'CENTRAL',
          department: 'Department of Agriculture & Farmers Welfare',
          benefits: '• ₹50,000 per hectare financial assistance over 3 years.\n• ₹31,000/ha provided directly via DBT for on-farm organic inputs (vermicompost, bio-fertilizers, neem cake).\n• Free PGS-India organic certification and marketing packaging support.',
          eligibility: '• Clusters of 20 or more farmers forming groups covering at least 20-50 hectares of adjoining farmland.\n• Willingness to transition to 100% chemical-free organic farming practices.',
          required_documents: '1. Group Farmer list with Aadhaar and survey numbers\n2. Land ownership proof (RTC / Patta)\n3. Cluster resolution deed and bank account of Farmer Producer Group',
          application_process: '1. Form a cluster with neighboring farmers and contact the Regional Council or District Agriculture Office.\n2. Register cluster on the PGS-India portal (https://pgsindia-ncof.gov.in).\n3. Department sanctions cluster action plan and disburses stage-wise funds into group account.',
          official_url: 'https://pgsindia-ncof.gov.in',
          helpline: '0120-2764906',
          image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=60',
          status: 'PUBLISHED',
          featured: false,
        },
      ];

      const insertedSchemes: any[] = [];
      for (const scheme of sampleSchemes) {
        const id = crypto.randomUUID();
        await query(
          `INSERT INTO government_schemes (
            id, title, short_description, full_description, category,
            government_level, state, department, benefits, eligibility,
            required_documents, application_process, official_url, helpline,
            image_url, status, featured, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )`,
          [
            id, scheme.title, scheme.short_description, scheme.full_description, scheme.category,
            scheme.government_level, scheme.state, scheme.department, scheme.benefits, scheme.eligibility,
            scheme.required_documents, scheme.application_process, scheme.official_url, scheme.helpline,
            scheme.image_url, scheme.status, scheme.featured
          ]
        );
        insertedSchemes.push({ id, ...scheme });
      }
      console.log(`[Seed] Seeded ${sampleSchemes.length} authentic government schemes.`);

      // Seed 1 saved scheme for Ramesh (Farmer 1)
      const farmerUser = await query("SELECT id FROM users WHERE email = 'ramesh.farmer@agrorent.com'");
      if (farmerUser.rows.length > 0 && insertedSchemes.length > 0) {
        const savedId = crypto.randomUUID();
        await query(
          `INSERT INTO saved_schemes (id, user_id, scheme_id, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [savedId, farmerUser.rows[0].id, insertedSchemes[0].id]
        );
        console.log('[Seed] Seeded initial saved scheme for Ramesh Kumar (Farmer).');
      }

      // Seed Farmer Educational Resources
      const sampleResources = [
        {
          title: 'Complete Drip Irrigation Installation & Maintenance Guide',
          description: 'A practical, field-tested handbook covering filter cleaning, lateral pipe layout, and pressure regulation for water conservation.',
          category: 'Irrigation',
          resource_type: 'GUIDE',
          content: 'Drip irrigation delivers water and dissolved nutrients directly to the root zone of plants in controlled amounts. Essential components include screen and disc filters, venturi fertilizer injectors, sub-main PVC pipelines, and UV-stabilized dripper laterals.\n\nKey Maintenance Checklist:\n1. Flush gravel and disc filters weekly to avoid clogging from silt and algae.\n2. Perform acid treatment (hydrochloric or phosphoric acid) once a season to dissolve calcium bicarbonate scale.\n3. Check emitter discharge rate across the furthest lateral rows twice a month.\n4. Close end-caps securely and bury sub-main pipes at least 1.5 feet deep to prevent tractor wheel damage.',
          image_url: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=60',
          official_url: 'https://raitamitra.karnataka.gov.in',
          status: 'PUBLISHED',
        },
        {
          title: 'Soil Health Card: Sampling Guide & Fertilizer Optimization',
          description: 'Step-by-step instructions to collect representative soil samples from agricultural plots and balance NPK application.',
          category: 'Soil Health',
          resource_type: 'ARTICLE',
          content: 'Proper soil testing helps identify nutrient deficiencies, optimal pH levels, and organic carbon content, reducing wasteful expenditure on excess chemical fertilizers.\n\nSampling Procedure:\n1. Divide your farm into homogenous sampling units based on crop history and slope.\n2. Collect 8-10 V-shaped sub-samples (up to 15 cm depth) in a zigzag pattern across each plot.\n3. Mix thoroughly on clean plastic sheet, discard debris and stones.\n4. Use quartering method to reduce sample size to 500 grams.\n5. Air dry in shade, pack in clean cloth bag, and label with survey number for delivery to your local Krishi Vigyan Kendra (KVK).',
          image_url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=60',
          official_url: 'https://soilhealth.dac.gov.in',
          status: 'PUBLISHED',
        },
        {
          title: 'PM-Kisan e-KYC Completion & Aadhaar Seeding Manual',
          description: 'Official instructions for completing face-authentication eKYC or OTP biometric authentication for PM-Kisan installments.',
          category: 'Financial Assistance',
          resource_type: 'DOCUMENT',
          content: 'To receive PM-Kisan financial installments without interruption, farmers must ensure mandatory e-KYC compliance and active Aadhaar-bank account seeding.\n\nHow to Complete eKYC:\n1. Download the PM-KISAN Mobile App on any Android smartphone.\n2. Login with your registered Aadhaar number.\n3. Select Facial Authentication e-KYC mode.\n4. Look into the front camera in good lighting, blink twice as instructed, and facial scan completes instantly without visiting any kiosk.\n5. Alternatively, visit your nearest Grama One / Bangalore One / CSC center for biometric fingerprint validation.',
          image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60',
          official_url: 'https://pmkisan.gov.in',
          status: 'PUBLISHED',
        },
        {
          title: 'Integrated Pest Management (IPM) for Kharif Paddy & Maize',
          description: 'Environment-friendly pest suppression strategies combining pheromone traps, trichogramma parasitoids, and bio-pesticides.',
          category: 'Crop Management',
          resource_type: 'ARTICLE',
          content: 'Integrated Pest Management (IPM) combines cultural, mechanical, biological, and minimum chemical methods to manage insect pests below economic threshold levels.\n\nKey Practices:\n• Install 5 yellow sticky traps per acre for sucking pests (aphids, thrips, whiteflies).\n• Erect bird perches (10 per acre) during early vegetative stages for natural insect predation.\n• Release Trichogramma egg parasitoids @ 50,000/ha at 10-day intervals for stem borer management.\n• Spray 5% Neem Seed Kernel Extract (NSKE) at first sighting of leaf folder larvae.',
          image_url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=60',
          official_url: 'https://ppqs.gov.in',
          status: 'PUBLISHED',
        },
        {
          title: 'Karnataka Krishi Call Centre & Agronomist Support Directory',
          description: 'Direct contact numbers, toll-free lines, and expert consultation desks across regional Agricultural Universities and KVKs.',
          category: 'Helpline & Support',
          resource_type: 'HELPLINE',
          content: 'Farmers in Karnataka can connect directly with university agricultural scientists, veterinary doctors, and crop protection officers free of charge.\n\nKey Contacts:\n• Kisan Call Centre (National Toll Free): 1800-180-1551 (Available 6:00 AM to 10:00 PM in Kannada & English)\n• Karnataka Agriculture Department Helpline: 1800-425-3553\n• UAS Bangalore Crop Advisory Desk: 080-23636831\n• Weather Forecast & SMS Advisory: mKisan portal (https://mkisan.gov.in)',
          image_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60',
          official_url: 'https://raitamitra.karnataka.gov.in',
          status: 'PUBLISHED',
        },
        {
          title: 'Vermicompost Unit Construction & Earthworm Inoculation Guide',
          description: 'Step-by-step setup tutorial for building low-cost vermicompost beds using farm waste, cow dung, and Eisenia fetida worms.',
          category: 'Organic Farming',
          resource_type: 'GUIDE',
          content: 'Vermicomposting turns farm crop residue and livestock manure into nutrient-rich organic manure in 45-60 days.\n\nConstruction Steps:\n1. Build brick masonry beds of dimensions 10 ft length × 3 ft width × 2 ft height under thatched shade.\n2. Lay bottom 3-inch layer of dry coconut coir / chopped paddy straw for drainage.\n3. Add 15-day pre-decomposed cow dung and farm waste in alternating layers.\n4. Introduce red earthworms (Eisenia fetida) @ 1 kg per 100 kg biomass.\n5. Maintain 30-40% moisture by sprinkling water every 2-3 days.\n6. Harvest fine dark granules from top layer after 50 days.',
          image_url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=60',
          official_url: 'https://ncof.dacnet.nic.in',
          status: 'PUBLISHED',
        },
      ];

      for (const resItem of sampleResources) {
        const id = crypto.randomUUID();
        await query(
          `INSERT INTO farmer_resources (
            id, title, description, category, content, resource_type,
            image_url, official_url, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )`,
          [
            id, resItem.title, resItem.description, resItem.category, resItem.content,
            resItem.resource_type, resItem.image_url, resItem.official_url, resItem.status
          ]
        );
      }
      console.log(`[Seed] Seeded ${sampleResources.length} farmer educational resources.`);
    }
  } catch (err: any) {
    console.warn('[Seed] Could not seed Phase 7 schemes & resources:', err.message);
  }

  // Phase 9: Seed Locations, Equipment Coordinates, Service Coordinates, and Sample Delivery Tracking
  try {
    console.log('[Seed] Checking Phase 9 Location & Delivery Tracking seeds...');

    // 1. Update equipment coordinates if missing
    await query(`
      UPDATE equipment SET latitude = 12.6518, longitude = 77.2089
      WHERE latitude IS NULL AND (location ILIKE '%Channapatna%' OR location ILIKE '%Ramanagara%')
    `);
    await query(`
      UPDATE equipment SET latitude = 12.5844, longitude = 77.0450
      WHERE latitude IS NULL AND (location ILIKE '%Maddur%' OR location ILIKE '%Mandya%')
    `);
    await query(`
      UPDATE equipment SET latitude = 12.9716, longitude = 77.5946
      WHERE latitude IS NULL AND (location ILIKE '%Bangalore%' OR location ILIKE '%Bengaluru%')
    `);
    await query(`
      UPDATE equipment SET latitude = 13.3379, longitude = 77.1017
      WHERE latitude IS NULL
    `);

    // 2. Update service profiles coordinates & service radius if missing
    await query(`
      UPDATE service_profiles 
      SET latitude = 12.9716, longitude = 77.5946, service_radius_km = 35.00
      WHERE latitude IS NULL AND service_type = 'DRIVER'
    `);
    await query(`
      UPDATE service_profiles 
      SET latitude = 12.5844, longitude = 77.0450, service_radius_km = 25.00
      WHERE latitude IS NULL AND service_type = 'FARM_WORKER'
    `);

    // 3. Seed user_locations for sample farmers
    const locCountRes = await query('SELECT COUNT(*) as count FROM user_locations');
    const locCount = parseInt(locCountRes.rows[0]?.count || '0', 10);
    if (locCount === 0) {
      const rameshRes = await query('SELECT id FROM users WHERE email = $1', ['ramesh.farmer@agrorent.com']);
      const sureshRes = await query('SELECT id FROM users WHERE email = $1', ['suresh.farmer@agrorent.com']);

      const rameshId = rameshRes.rows[0]?.id;
      const sureshId = sureshRes.rows[0]?.id;

      if (rameshId) {
        await query(`
          INSERT INTO user_locations (id, user_id, label, address, city, state, pincode, latitude, longitude, is_default, created_at, updated_at)
          VALUES 
            ($1, $2, 'FARM', 'Plot 42, Green Valley Paddy Fields, Maddur Rural', 'Maddur', 'Karnataka', '571428', 12.5844, 77.0450, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ($3, $2, 'HOME', 'No. 14, Main Bazaar Road, Maddur Town', 'Maddur', 'Karnataka', '571428', 12.5890, 77.0495, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
        `, [crypto.randomUUID(), rameshId, crypto.randomUUID()]);
      }

      if (sureshId) {
        await query(`
          INSERT INTO user_locations (id, user_id, label, address, city, state, pincode, latitude, longitude, is_default, created_at, updated_at)
          VALUES 
            ($1, $2, 'FARM', 'Survey 18, Harohalli Sericulture & Sugarcane Fields', 'Kanakapura', 'Karnataka', '562112', 12.5461, 77.4172, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
        `, [crypto.randomUUID(), sureshId]);
      }
      console.log('[Seed] Seeded sample farm and home locations for demo farmers.');
    }

    // 4. Seed or link an active animal order with live delivery tracking
    const orderCheck = await query('SELECT id, buyer_id, seller_id FROM animal_orders LIMIT 1');
    if (orderCheck.rows.length > 0) {
      const order = orderCheck.rows[0];
      const driverRes = await query("SELECT id FROM service_profiles WHERE service_type = 'DRIVER' LIMIT 1");
      const driverId = driverRes.rows[0]?.id || null;

      // Update order to IN_TRANSIT with delivery coordinates
      await query(`
        UPDATE animal_orders
        SET delivery_status = 'IN_TRANSIT',
            delivery_latitude = 12.5844,
            delivery_longitude = 77.0450,
            assigned_driver_id = $1,
            estimated_delivery_date = CURRENT_TIMESTAMP + INTERVAL '1 day'
        WHERE id = $2 AND (delivery_status IS NULL OR delivery_status = 'PENDING')
      `, [driverId, order.id]);

      // Seed tracking breadcrumbs if empty
      const trackCountRes = await query('SELECT COUNT(*) as count FROM delivery_tracking WHERE animal_order_id = $1', [order.id]);
      if (parseInt(trackCountRes.rows[0]?.count || '0', 10) === 0) {
        await query(`
          INSERT INTO delivery_tracking (id, animal_order_id, driver_id, status, latitude, longitude, note, created_at)
          VALUES
            ($1, $2, $3, 'ASSIGNED', 12.6518, 77.2089, 'Specialized livestock transport vehicle assigned to order.', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
            ($4, $2, $3, 'PICKED_UP', 12.6518, 77.2089, 'Animal inspected, health verified, and safely loaded.', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
            ($5, $2, $3, 'IN_TRANSIT', 12.6100, 77.1200, 'Transit underway on NH-275 towards destination farm.', CURRENT_TIMESTAMP - INTERVAL '15 minutes')
        `, [
          crypto.randomUUID(), order.id, driverId,
          crypto.randomUUID(),
          crypto.randomUUID(),
        ]);
        console.log('[Seed] Seeded initial delivery tracking timeline and GPS points for sample order.');
      }
    }
  } catch (err: any) {
    console.warn('[Seed] Could not seed Phase 9 location/tracking data:', err.message);
  }
}

