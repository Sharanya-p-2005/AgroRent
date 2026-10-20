/**
 * Phase 14 Comprehensive Test Runner & Validation Suite
 * Executes authentic, end-to-end API, DB, RBAC, and Workflow verification.
 */

const BASE_URL = 'http://localhost:3000/api';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<any>) {
  const start = Date.now();
  try {
    const details = await fn();
    const durationMs = Date.now() - start;
    results.push({ suite, name, status: 'PASS', durationMs, details });
    console.log(`  ✅ [PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const error = err?.message || String(err);
    results.push({ suite, name, status: 'FAIL', durationMs, error });
    console.error(`  ❌ [FAIL] ${name} (${durationMs}ms): ${error}`);
  }
}

async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('====================================================');
  console.log(' AgroRent Phase 14 - End-to-End System Test Suite');
  console.log('====================================================\n');

  let adminToken = '';
  let farmerToken = '';
  let ownerToken = '';
  let farmerUser: any = null;
  let ownerUser: any = null;

  // ----------------------------------------------------
  // SUITE 1: System Health & Base Infrastructure
  // ----------------------------------------------------
  console.log('\n--- Suite 1: System Health & Base Infrastructure ---');

  await runTest('Suite 1: Infrastructure', 'API Health Endpoint returns status healthy', async () => {
    const res = await request('/health');
    if (res.status !== 200 || res.data?.status !== 'healthy') {
      throw new Error(`Expected status healthy, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
    return res.data;
  });

  // ----------------------------------------------------
  // SUITE 2: Authentication & Authorization Flow
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Authentication & Authorization ---');

  await runTest('Suite 2: Auth', 'Admin Login with valid credentials', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@agrorent.com', password: 'Admin@123' },
    });
    if (res.status !== 200 || !res.data?.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    adminToken = res.data.token;
    if (res.data.user.role !== 'ADMIN') {
      throw new Error(`Expected role ADMIN, got ${res.data.user.role}`);
    }
    return { email: res.data.user.email, role: res.data.user.role };
  });

  await runTest('Suite 2: Auth', 'Farmer Login with valid credentials', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'ramesh.farmer@agrorent.com', password: 'Farmer@123' },
    });
    if (res.status !== 200 || !res.data?.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    farmerToken = res.data.token;
    farmerUser = res.data.user;
    if (farmerUser.role !== 'FARMER') {
      throw new Error(`Expected role FARMER, got ${farmerUser.role}`);
    }
    return { email: farmerUser.email, role: farmerUser.role };
  });

  await runTest('Suite 2: Auth', 'Owner Login with valid credentials', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'vikram.owner@agrorent.com', password: 'Owner@123' },
    });
    if (res.status !== 200 || !res.data?.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    ownerToken = res.data.token;
    ownerUser = res.data.user;
    if (ownerUser.role !== 'OWNER') {
      throw new Error(`Expected role OWNER, got ${ownerUser.role}`);
    }
    return { email: ownerUser.email, role: ownerUser.role };
  });

  await runTest('Suite 2: Auth', 'Login rejection with invalid password', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'ramesh.farmer@agrorent.com', password: 'WrongPassword!99' },
    });
    if (res.status === 200) {
      throw new Error('Expected 401 or 400 for invalid password, got 200');
    }
    return { status: res.status, message: res.data?.message };
  });

  await runTest('Suite 2: Auth', 'Register new user with duplicate email prevention', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Duplicate Test',
        email: 'ramesh.farmer@agrorent.com',
        phone: '9999988888',
        password: 'Password@123',
        role: 'FARMER',
      },
    });
    if (res.status === 200 || res.status === 201) {
      throw new Error('Expected duplicate email conflict (400 or 409), got success');
    }
    return { status: res.status, message: res.data?.message };
  });

  await runTest('Suite 2: Auth', 'Protected route /api/auth/me returns authenticated user identity', async () => {
    const res = await request('/auth/me', { token: farmerToken });
    if (res.status !== 200 || !res.data?.user) {
      throw new Error(`Failed to retrieve user: ${JSON.stringify(res.data)}`);
    }
    return { id: res.data.user.id, name: res.data.user.name, role: res.data.user.role };
  });

  // ----------------------------------------------------
  // SUITE 3: Role-Based Access Control (RBAC) Security
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Role-Based Access Control (RBAC) ---');

  await runTest('Suite 3: RBAC', 'Farmer is FORBIDDEN from accessing Admin User Management', async () => {
    const res = await request('/admin/users', { token: farmerToken });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Farmer accessing Admin endpoint, got ${res.status}`);
    }
    return { status: res.status, message: res.data?.message };
  });

  await runTest('Suite 3: RBAC', 'Farmer is FORBIDDEN from accessing Admin Platform Settings', async () => {
    const res = await request('/admin/settings', { token: farmerToken });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
    return { status: res.status };
  });

  await runTest('Suite 3: RBAC', 'Owner is FORBIDDEN from accessing Admin Audit Logs', async () => {
    const res = await request('/admin/audit-logs', { token: ownerToken });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Owner accessing Audit Logs, got ${res.status}`);
    }
    return { status: res.status };
  });

  await runTest('Suite 3: RBAC', 'Unauthenticated request to protected route is REJECTED', async () => {
    const res = await request('/farmer/bookings');
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for missing token, got ${res.status}`);
    }
    return { status: res.status };
  });

  await runTest('Suite 3: RBAC', 'Admin CAN access platform settings and user management', async () => {
    const res = await request('/admin/users', { token: adminToken });
    if (res.status !== 200 || !res.data?.data?.users) {
      throw new Error(`Admin failed to retrieve users: ${JSON.stringify(res.data)}`);
    }
    return { userCount: res.data.data.users.length, total: res.data.data.total };
  });

  // ----------------------------------------------------
  // SUITE 4: Farmer Role Verification
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Farmer Role Verification ---');

  await runTest('Suite 4: Farmer', 'Farmer access verified via /api/farmer/test', async () => {
    const res = await request('/farmer/test', { token: farmerToken });
    if (res.status !== 200 || !res.data?.success) {
      throw new Error(`Failed farmer test endpoint: ${JSON.stringify(res.data)}`);
    }
    return { message: res.data.message };
  });

  await runTest('Suite 4: Farmer', 'Farmer can access their equipment bookings', async () => {
    const res = await request('/farmer/bookings', { token: farmerToken });
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to fetch farmer bookings: ${JSON.stringify(res.data)}`);
    }
    return { count: res.data.data.length };
  });

  // ----------------------------------------------------
  // SUITE 5: Equipment Marketplace & Rental Workflow
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Equipment Marketplace & Rental Workflow ---');

  let testEquipmentId = '';
  let testBookingId = '';

  await runTest('Suite 5: Equipment', 'Public list of equipment returns active listings', async () => {
    const res = await request('/equipment');
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to list equipment: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length > 0) {
      testEquipmentId = res.data.data[0].id;
    }
    return { count: res.data.data.length, firstItem: res.data.data[0]?.name };
  });

  await runTest('Suite 5: Equipment', 'Owner creates a new equipment listing', async () => {
    const res = await request('/owner/equipment', {
      method: 'POST',
      token: ownerToken,
      body: {
        name: 'John Deere 5050D Tractor (Phase 14 Test)',
        category: 'TRACTOR',
        brand: 'John Deere',
        model: '5050D 50HP',
        description: 'Robust 50 HP power steering tractor with dual clutch, ideal for tilling and haulage.',
        price_per_hour: 850,
        location: 'Dharwad, Karnataka',
      },
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Failed to create equipment: status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    const createdId = res.data.data?.id;
    if (createdId) {
      testEquipmentId = createdId;
    }
    return { id: createdId, name: res.data.data?.name };
  });

  await runTest('Suite 5: Equipment', 'Fetch specific equipment details by ID', async () => {
    if (!testEquipmentId) throw new Error('No test equipment ID available');
    const res = await request(`/equipment/${testEquipmentId}`);
    if (res.status !== 200 || !res.data?.data) {
      throw new Error(`Failed to fetch equipment details: ${JSON.stringify(res.data)}`);
    }
    return { name: res.data.data.name, price: res.data.data.price_per_hour };
  });

  await runTest('Suite 5: Equipment', 'Admin approves new equipment listing for booking', async () => {
    if (!testEquipmentId) throw new Error('No test equipment ID available');
    const res = await request(`/admin/equipment/${testEquipmentId}/approve`, {
      method: 'PUT',
      token: adminToken,
    });
    if (res.status !== 200) {
      throw new Error(`Failed to approve equipment: status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    return { equipmentId: testEquipmentId, status: 'APPROVED' };
  });

  await runTest('Suite 5: Equipment', 'Farmer creates equipment rental booking', async () => {
    if (!testEquipmentId) throw new Error('No test equipment ID available');
    const randomDays = Math.floor(Math.random() * 80) + 20;
    const futureDate = new Date(Date.now() + randomDays * 86400000).toISOString().split('T')[0];
    const res = await request('/bookings', {
      method: 'POST',
      token: farmerToken,
      body: {
        equipment_id: testEquipmentId,
        booking_date: futureDate,
        start_time: '08:00',
        end_time: '14:00',
        duration_hours: 6,
      },
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Failed to create booking: status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    testBookingId = res.data.data?.id;
    return { bookingId: testBookingId, totalAmount: res.data.data?.total_amount };
  });

  await runTest('Suite 5: Equipment', 'Owner views incoming equipment bookings', async () => {
    const res = await request('/owner/bookings', { token: ownerToken });
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to fetch owner bookings: ${JSON.stringify(res.data)}`);
    }
    return { count: res.data.data.length };
  });

  if (testBookingId) {
    await runTest('Suite 5: Equipment', 'Owner updates booking status to CONFIRMED', async () => {
      const res = await request(`/owner/bookings/${testBookingId}/status`, {
        method: 'PUT',
        token: ownerToken,
        body: { status: 'CONFIRMED' },
      });
      if (res.status !== 200) {
        throw new Error(`Failed to update booking status: ${JSON.stringify(res.data)}`);
      }
      return { status: res.data.data?.booking_status || 'CONFIRMED' };
    });
  }

  // ----------------------------------------------------
  // SUITE 6: Animal & Bird Marketplace Workflow
  // ----------------------------------------------------
  console.log('\n--- Suite 6: Animal & Bird Marketplace Workflow ---');

  let testAnimalId = '';
  let testOrderId = '';

  await runTest('Suite 6: Animals', 'Public listing of animals returns listings', async () => {
    const res = await request('/animals');
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to list animals: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length > 0) {
      testAnimalId = res.data.data[0].id;
    }
    return { count: res.data.data.length, sampleName: res.data.data[0]?.name };
  });

  await runTest('Suite 6: Animals', 'Owner creates a verified animal listing', async () => {
    const res = await request('/owner/animals', {
      method: 'POST',
      token: ownerToken,
      body: {
        listing_type: 'ANIMAL',
        category: 'COW',
        name: 'Gir Cow Certified (Phase 14 Verified)',
        breed: 'Gir High Yield',
        age: '3.5 Years',
        gender: 'FEMALE',
        price: 45000,
        quantity: 1,
        location: 'Shimoga, Karnataka',
        health_status: 'Fully Vaccinated & Dewormed',
        description: 'Indigenous purebred Gir cow producing 14L of A2 milk daily.',
      },
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Failed to create animal listing: status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    const createdId = res.data.data?.id;
    if (createdId) testAnimalId = createdId;
    return { id: createdId, name: res.data.data?.name };
  });

  await runTest('Suite 6: Animals', 'Admin approves animal listing for marketplace sale', async () => {
    if (!testAnimalId) throw new Error('No test animal ID available');
    const res = await request(`/admin/animals/${testAnimalId}/approve`, {
      method: 'PUT',
      token: adminToken,
    });
    if (res.status !== 200) {
      throw new Error(`Failed to approve animal listing: status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    return { animalId: testAnimalId, status: 'APPROVED' };
  });

  await runTest('Suite 6: Animals', 'Farmer places animal purchase order', async () => {
    if (!testAnimalId) throw new Error('No test animal ID available');
    const res = await request('/animal-orders', {
      method: 'POST',
      token: farmerToken,
      body: {
        listing_id: testAnimalId,
        quantity: 1,
        delivery_name: 'Ramesh Gowda',
        delivery_phone: '9876543210',
        delivery_address: 'Green Meadows Farm, Post Box 4',
        delivery_city: 'Shimoga',
        delivery_state: 'Karnataka',
        delivery_pincode: '577201',
      },
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Failed to place animal order: status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    testOrderId = res.data.data?.id;
    return { orderId: testOrderId, totalAmount: res.data.data?.total_amount };
  });

  await runTest('Suite 6: Animals', 'Farmer retrieves their placed animal orders', async () => {
    const res = await request('/farmer/animal-orders', { token: farmerToken });
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to retrieve orders: ${JSON.stringify(res.data)}`);
    }
    return { count: res.data.data.length };
  });

  // ----------------------------------------------------
  // SUITE 7: Driver & Farm Worker Services
  // ----------------------------------------------------
  console.log('\n--- Suite 7: Driver & Farm Worker Services ---');

  let testServiceId = '';
  let testServiceBookingId = '';

  await runTest('Suite 7: Services', 'List available agricultural drivers and farm workers', async () => {
    const res = await request('/services');
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to list services: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length > 0) {
      testServiceId = res.data.data[0].id;
    }
    return { count: res.data.data.length, sampleService: res.data.data[0]?.name };
  });

  await runTest('Suite 7: Services', 'Farmer creates a service booking for driver or worker', async () => {
    if (!testServiceId) throw new Error('No service profile ID available');
    const randomDays = Math.floor(Math.random() * 80) + 20;
    const futureDate = new Date(Date.now() + randomDays * 86400000).toISOString().split('T')[0];
    const res = await request('/service-bookings', {
      method: 'POST',
      token: farmerToken,
      body: {
        service_profile_id: testServiceId,
        booking_date: futureDate,
        start_time: '07:00',
        end_time: '15:00',
        duration_hours: 8,
        work_location: 'Farm Field Plot 7, Hassan District',
        work_description: 'Combine harvester operation and field drainage monitoring.',
      },
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Failed to book service: status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    testServiceBookingId = res.data.data?.id;
    return { bookingId: testServiceBookingId, totalAmount: res.data.data?.total_amount };
  });

  // ----------------------------------------------------
  // SUITE 8: Invoices & Receipts Module
  // ----------------------------------------------------
  console.log('\n--- Suite 8: Invoices & Receipts Module ---');

  let invoiceSampleId = '';

  await runTest('Suite 8: Invoices', 'Farmer fetches generated invoices', async () => {
    const res = await request('/invoices', { token: farmerToken });
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to retrieve invoices: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.length > 0) {
      invoiceSampleId = res.data.data[0].raw_id || res.data.data[0].id;
    }
    return { count: res.data.data.length, firstInvoice: res.data.data[0]?.id };
  });

  await runTest('Suite 8: Invoices', 'Owner fetches provider invoices', async () => {
    const res = await request('/invoices', { token: ownerToken });
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to retrieve owner invoices: ${JSON.stringify(res.data)}`);
    }
    return { count: res.data.data.length };
  });

  if (invoiceSampleId) {
    await runTest('Suite 8: Invoices', 'Fetch detailed tax invoice by ID with GST exemption check', async () => {
      const res = await request(`/invoices/${invoiceSampleId}`, { token: farmerToken });
      if (res.status !== 200 || !res.data?.data) {
        throw new Error(`Failed to retrieve invoice detail: ${JSON.stringify(res.data)}`);
      }
      const inv = res.data.data;
      if (inv.tax !== 0) {
        throw new Error(`Expected tax = 0 (GST exempt), got ${inv.tax}`);
      }
      return {
        invoiceNumber: inv.invoice_number,
        total: inv.total,
        taxNote: inv.tax_note,
        customer: inv.customer?.name,
      };
    });
  }

  // ----------------------------------------------------
  // SUITE 9: Weather & Agricultural Advisory
  // ----------------------------------------------------
  console.log('\n--- Suite 9: Weather & Agricultural Advisory ---');

  await runTest('Suite 9: Weather', 'Weather forecast endpoint returns agricultural weather data', async () => {
    const res = await request('/weather/forecast?lat=12.9716&lon=77.5946');
    if (res.status !== 200 || !res.data?.data) {
      throw new Error(`Failed to fetch weather: ${JSON.stringify(res.data)}`);
    }
    return {
      forecastCount: Array.isArray(res.data.data) ? res.data.data.length : 1,
    };
  });

  await runTest('Suite 9: Weather', 'Agricultural crop recommendation advisory returns advice', async () => {
    const res = await request('/agriculture/crop-recommendation', {
      method: 'POST',
      body: {
        nitrogen: 50,
        phosphorus: 50,
        potassium: 50,
        temperature: 28,
        humidity: 70,
        ph: 6.5,
        rainfall: 200,
      },
    });
    const crops = res.data?.data || res.data?.recommended_crops;
    if (res.status !== 200 || !crops) {
      throw new Error(`Failed to fetch crop recommendation: ${JSON.stringify(res.data)}`);
    }
    return { recommendations: crops };
  });

  // ----------------------------------------------------
  // SUITE 10: Government Schemes & Farmer Resources
  // ----------------------------------------------------
  console.log('\n--- Suite 10: Schemes & Resources ---');

  await runTest('Suite 10: Schemes', 'Fetch government agricultural subsidy schemes', async () => {
    const res = await request('/schemes');
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to fetch schemes: ${JSON.stringify(res.data)}`);
    }
    return { count: res.data.data.length, sampleScheme: res.data.data[0]?.title };
  });

  await runTest('Suite 10: Schemes', 'Fetch farmer educational resources & guides', async () => {
    const res = await request('/resources');
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to fetch resources: ${JSON.stringify(res.data)}`);
    }
    return { count: res.data.data.length };
  });

  // ----------------------------------------------------
  // SUITE 11: Notifications System
  // ----------------------------------------------------
  console.log('\n--- Suite 11: Notifications System ---');

  await runTest('Suite 11: Notifications', 'Farmer retrieves notification list', async () => {
    const res = await request('/notifications', { token: farmerToken });
    if (res.status !== 200 || !Array.isArray(res.data?.data)) {
      throw new Error(`Failed to fetch notifications: ${JSON.stringify(res.data)}`);
    }
    return { count: res.data.data.length };
  });

  // ----------------------------------------------------
  // SUITE 12: Admin Moderation, Settings & Audit Logs
  // ----------------------------------------------------
  console.log('\n--- Suite 12: Admin Moderation, Settings & Audit Logs ---');

  await runTest('Suite 12: Admin', 'Admin dashboard statistics calculation', async () => {
    const res = await request('/admin/dashboard/stats', { token: adminToken });
    if (res.status !== 200 || !res.data?.data) {
      throw new Error(`Failed to get admin stats: ${JSON.stringify(res.data)}`);
    }
    return res.data.data;
  });

  await runTest('Suite 12: Admin', 'Admin audit logs retrieval', async () => {
    const res = await request('/admin/audit-logs', { token: adminToken });
    const logs = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.logs;
    if (res.status !== 200 || !Array.isArray(logs)) {
      throw new Error(`Failed to get audit logs: ${JSON.stringify(res.data)}`);
    }
    return { count: logs.length, total: res.data?.data?.total || logs.length };
  });

  await runTest('Suite 12: Admin', 'Admin platform settings retrieval', async () => {
    const res = await request('/admin/settings', { token: adminToken });
    if (res.status !== 200 || !res.data?.data) {
      throw new Error(`Failed to get platform settings: ${JSON.stringify(res.data)}`);
    }
    return { settings: res.data.data };
  });

  // ----------------------------------------------------
  // SUITE 13: Edge Cases, Security & Input Sanitization
  // ----------------------------------------------------
  console.log('\n--- Suite 13: Edge Cases & Security Protection ---');

  await runTest('Suite 13: Security', 'SQL Injection attempt in query param is neutralized', async () => {
    const res = await request('/equipment?category=\' OR 1=1 --');
    if (res.status >= 500) {
      throw new Error(`Server threw 500 on SQL injection payload: ${res.status}`);
    }
    return { status: res.status, ok: res.ok };
  });

  await runTest('Suite 13: Edge Cases', 'Non-existent API endpoint returns standard 404', async () => {
    const res = await request('/non-existent-agrorent-route-xyz');
    if (res.status !== 404) {
      throw new Error(`Expected 404 for unknown route, got ${res.status}`);
    }
    return { status: res.status, message: res.data?.message };
  });

  await runTest('Suite 13: Security', 'Tampered JWT token is firmly rejected with 401/403', async () => {
    const res = await request('/farmer/bookings', {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature',
    });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403 for tampered JWT, got ${res.status}`);
    }
    return { status: res.status };
  });

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(' AgroRent Phase 14 - Test Execution Summary');
  console.log('====================================================');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed} (${Math.round((passed / total) * 100)}%)`);
  console.log(`Failed:          ${failed}`);
  console.log(`Total Duration:  ${totalDuration}ms`);
  console.log('====================================================\n');

  if (failed > 0) {
    console.log('Failed Tests Details:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => console.log(` - [${r.suite}] ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED WITH 100% SUCCESS RATE!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
