// Data Migration Utility
// DISABLED: This app uses Render.com API, not Supabase
// Use MIGRATE_AND_SYNC_DATA.js instead to migrate to Render.com

import { isSupabaseConfigured } from '../supabaseClient';

export const migrateToDatabase = async () => {
  // Supabase is disabled - app uses Render.com API
  console.log('ℹ️ Supabase migration disabled - app uses Render.com API');
  console.log('💡 Use MIGRATE_AND_SYNC_DATA.js to migrate data to Render.com');
  return { 
    success: false, 
    message: 'Supabase disabled - use Render.com API migration script instead' 
  };

  const results = {
    success: true,
    migrated: {},
    errors: {}
  };

  // Map localStorage keys to database table names and transformation functions
  const migrationMap = {
    'branches': {
      table: 'branches',
      transform: (item) => ({
        branch_code: item.branchCode,
        branch_name: item.branchName,
        address: item.address,
        contact: item.contact,
        manager: item.manager,
        branch_type: item.branchType,
        branch_manager: item.branchManager,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'cities': {
      table: 'cities',
      transform: (item) => ({
        city_code: item.cityCode,
        city_name: item.cityName,
        state: item.state,
        zone: item.zone,
        is_oda: item.isODA || false,
        transit_days: item.transitDays,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'tbbClients': {
      table: 'tbb_clients',
      transform: (item) => ({
        client_code: item.clientCode,
        client_name: item.clientName,
        client_type: item.clientType || 'TBB',
        contact: item.contact,
        address: item.address,
        gst_number: item.gstNumber,
        pan_number: item.panNumber,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'vehicles': {
      table: 'vehicles',
      transform: (item) => ({
        vehicle_number: item.vehicleNumber,
        vehicle_type: item.vehicleType,
        capacity: item.capacity,
        capacity_unit: item.capacityUnit,
        owner: item.owner,
        insurance: item.insurance,
        fitness: item.fitness,
        permit: item.permit,
        rc_book: item.rcBook,
        status: item.status || 'Active',
        remarks: item.remarks,
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'drivers': {
      table: 'drivers',
      transform: (item) => ({
        driver_code: item.driverCode,
        driver_name: item.driverName,
        license_number: item.licenseNumber,
        license_expiry: item.licenseExpiry,
        mobile: item.mobile,
        aadhar_number: item.aadharNumber,
        address: item.address,
        emergency_contact: item.emergencyContact,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'staff': {
      table: 'staff',
      transform: (item) => ({
        staff_code: item.staffCode,
        staff_name: item.staffName,
        designation: item.designation,
        department: item.department,
        contact: item.contact,
        address: item.address,
        branch_id: item.branchId,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'users': {
      table: 'users',
      transform: (item) => ({
        user_code: item.code || item.userCode,
        username: item.username,
        password: item.password, // Note: Should be hashed in production
        user_role: item.userRole || item.role,
        linked_staff_id: item.linkedStaff,
        branch_id: item.branch,
        email: item.email,
        mobile: item.mobile,
        access_permissions: item.accessPermissions,
        last_login: item.lastLogin,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'lrBookings': {
      table: 'lr_bookings',
      transform: (item) => ({
        lr_number: item.lrNumber,
        branch_id: item.branch,
        booking_mode: item.bookingMode,
        vehicle_number: item.vehicleNumber,
        delivery_type: item.deliveryType,
        booking_date: item.bookingDate,
        expected_delivery_date: item.expectedDeliveryDate,
        payment_mode: item.paymentMode,
        tbb_client_id: item.tbbClient,
        consignor: item.consignor,
        consignee: item.consignee,
        origin_city_id: item.origin,
        destination_city_id: item.destination,
        oda_destination: item.odaDestination,
        pieces: item.pieces,
        weight: item.weight,
        cft_dimensions: item.cftDimensions,
        calculated_cft: item.calculatedCFT,
        invoices: item.invoices,
        ewaybills: item.ewaybills,
        charges: item.charges,
        total_amount: item.totalAmount,
        gst_amount: item.gstAmount,
        status: item.status || 'Booked',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'manifests': {
      table: 'manifests',
      transform: (item) => ({
        manifest_number: item.manifestNumber,
        origin_branch_id: item.originBranch,
        destination_branch_id: item.destinationBranch,
        vehicle_id: item.vehicleId,
        driver_id: item.driverId,
        manifest_date: item.manifestDate,
        selected_lrs: item.selectedLRs,
        route_details: item.routeDetails,
        status: item.status || 'Created',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'trips': {
      table: 'trips',
      transform: (item) => ({
        trip_number: item.tripNumber,
        manifest_id: item.manifestId,
        vehicle_id: item.vehicleId,
        driver_id: item.driverId,
        start_date: item.startDate,
        expected_end_date: item.expectedEndDate,
        actual_end_date: item.actualEndDate,
        status: item.status || 'Scheduled',
        expenses: item.expenses,
        total_expenses: item.totalExpenses,
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'invoices': {
      table: 'invoices',
      transform: (item) => ({
        invoice_number: item.invoiceNumber,
        invoice_date: item.invoiceDate,
        client_id: item.clientId,
        lr_numbers: item.lrNumbers,
        lr_details: item.lrDetails || item.selectedLRs,
        total_amount: item.totalAmount,
        gst_amount: item.gstAmount,
        status: item.status || 'Pending',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'payments': {
      table: 'payments',
      transform: (item) => ({
        payment_number: item.paymentNumber,
        invoice_id: item.invoiceId,
        payment_date: item.paymentDate,
        payment_mode: item.paymentMode,
        amount: item.amount,
        reference_number: item.referenceNumber,
        remarks: item.remarks,
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'otherVendors': {
      table: 'vendors',
      transform: (item) => ({
        vendor_code: item.vendorCode,
        vendor_name: item.vendorName,
        vendor_type: 'Other',
        vendor_category: item.vendorCategory,
        contact: item.contact,
        address: item.address,
        gst_number: item.gstNumber,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    },
    'marketVehicleVendors': {
      table: 'vendors',
      transform: (item) => ({
        vendor_code: item.vendorCode,
        vendor_name: item.vendorName,
        vendor_type: 'Market Vehicle',
        vendor_category: item.vendorCategory,
        contact: item.contact,
        address: item.address,
        gst_number: item.gstNumber,
        status: item.status || 'Active',
        created_at: item.createdAt || new Date().toISOString()
      })
    }
  };

  // Migrate each table
  for (const [localStorageKey, config] of Object.entries(migrationMap)) {
    try {
      const localData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      
      if (localData.length === 0) {
        console.log(`⏭️  Skipping ${localStorageKey} - no data in localStorage`);
        continue;
      }

      console.log(`🔄 Migrating ${localStorageKey} (${localData.length} records)...`);

      // Transform data
      const transformedData = localData.map(config.transform);

      // Insert into database (in batches of 100)
      const batchSize = 100;
      let migratedCount = 0;

      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from(config.table)
          .insert(batch)
          .select();

        if (error) {
          console.error(`❌ Error migrating ${localStorageKey}:`, error);
          results.errors[localStorageKey] = error.message;
        } else {
          migratedCount += batch.length;
        }
      }

      if (migratedCount > 0) {
        results.migrated[localStorageKey] = migratedCount;
        console.log(`✅ Migrated ${migratedCount} records from ${localStorageKey} to ${config.table}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating ${localStorageKey}:`, error);
      results.errors[localStorageKey] = error.message;
      results.success = false;
    }
  }

  return results;
};

// Export migration function
export default migrateToDatabase;

