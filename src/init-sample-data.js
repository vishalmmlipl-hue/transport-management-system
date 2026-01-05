// Sample Data Initialization Script
// This script populates localStorage with sample data for the Transport Management System

const initSampleData = () => {
  console.log('Initializing sample data...');

  // 1. BRANCHES
  const branches = [
    {
      id: 1,
      branchCode: 'BR001',
      branchName: 'Mumbai Head Office',
      address: {
        line1: '123 Transport Street',
        line2: 'Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        country: 'India'
      },
      contact: {
        phone: '022-12345678',
        mobile: '9876543210',
        email: 'mumbai@tms.com'
      },
      manager: 'Rajesh Kumar',
      status: 'Active',
      createdAt: new Date('2024-01-15').toISOString()
    },
    {
      id: 2,
      branchCode: 'BR002',
      branchName: 'Delhi Branch',
      address: {
        line1: '456 Logistics Avenue',
        line2: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India'
      },
      contact: {
        phone: '011-23456789',
        mobile: '9876543211',
        email: 'delhi@tms.com'
      },
      manager: 'Priya Sharma',
      status: 'Active',
      createdAt: new Date('2024-02-01').toISOString()
    },
    {
      id: 3,
      branchCode: 'BR003',
      branchName: 'Bangalore Branch',
      address: {
        line1: '789 Cargo Road',
        line2: 'Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        country: 'India'
      },
      contact: {
        phone: '080-34567890',
        mobile: '9876543212',
        email: 'bangalore@tms.com'
      },
      manager: 'Amit Patel',
      status: 'Active',
      createdAt: new Date('2024-02-15').toISOString()
    }
  ];
  localStorage.setItem('branches', JSON.stringify(branches));

  // 2. CITIES
  const cities = [
    // Existing Major Cities
    { id: 1, code: 'MUM', cityName: 'Mumbai', state: 'Maharashtra', region: 'Mumbai Metropolitan', zone: 'West', pincodeRanges: '400001-400099', isODA: false, distanceFromHub: '0', transitDays: '0', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 2, code: 'DEL', cityName: 'Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110001-110099', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 3, code: 'BLR', cityName: 'Bangalore', state: 'Karnataka', region: 'South', zone: 'South', pincodeRanges: '560001-560099', isODA: false, distanceFromHub: '850', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 4, code: 'CHN', cityName: 'Chennai', state: 'Tamil Nadu', region: 'South', zone: 'South', pincodeRanges: '600001-600099', isODA: false, distanceFromHub: '1300', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 5, code: 'KOL', cityName: 'Kolkata', state: 'West Bengal', region: 'East', zone: 'East', pincodeRanges: '700001-700099', isODA: false, distanceFromHub: '2000', transitDays: '3', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 6, code: 'PUN', cityName: 'Pune', state: 'Maharashtra', region: 'West', zone: 'West', pincodeRanges: '411001-411099', isODA: false, distanceFromHub: '150', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 7, code: 'HYD', cityName: 'Hyderabad', state: 'Telangana', region: 'South', zone: 'South', pincodeRanges: '500001-500099', isODA: false, distanceFromHub: '700', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 8, code: 'AHM', cityName: 'Ahmedabad', state: 'Gujarat', region: 'West', zone: 'West', pincodeRanges: '380001-380099', isODA: false, distanceFromHub: '530', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    
    // Mumbai Metropolitan Region
    { id: 9, code: 'NVM', cityName: 'Navi Mumbai', state: 'Maharashtra', region: 'Mumbai Metropolitan', zone: 'West', pincodeRanges: '400700-400709', isODA: false, distanceFromHub: '30', transitDays: '0', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 10, code: 'BHI', cityName: 'Bhiwandi', state: 'Maharashtra', region: 'Mumbai Metropolitan', zone: 'West', pincodeRanges: '421302-421305', isODA: false, distanceFromHub: '50', transitDays: '0', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    
    // Delhi NCR - Delhi Districts
    { id: 11, code: 'DEL-CEN', cityName: 'Central Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110001-110006', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 12, code: 'DEL-EAS', cityName: 'East Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110091-110096', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 13, code: 'DEL-NEW', cityName: 'New Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110001-110020', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 14, code: 'DEL-NOR', cityName: 'North Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110007-110009', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 15, code: 'DEL-NE', cityName: 'North East Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110051-110053', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 16, code: 'DEL-NW', cityName: 'North West Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110033-110039', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 17, code: 'DEL-SHA', cityName: 'Shahdara', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110032-110095', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 18, code: 'DEL-SOU', cityName: 'South Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110017-110062', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 19, code: 'DEL-SE', cityName: 'South East Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110019-110092', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 20, code: 'DEL-SW', cityName: 'South West Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110010-110075', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 21, code: 'DEL-WES', cityName: 'West Delhi', state: 'Delhi', region: 'NCR', zone: 'North', pincodeRanges: '110015-110018', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    
    // Delhi NCR - Haryana Districts
    { id: 22, code: 'GUR', cityName: 'Gurugram', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '122001-122018', isODA: false, distanceFromHub: '1350', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 23, code: 'FAR', cityName: 'Faridabad', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '121001-121009', isODA: false, distanceFromHub: '1380', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 24, code: 'NOI', cityName: 'Noida', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '201301-201309', isODA: false, distanceFromHub: '1370', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 25, code: 'GHA', cityName: 'Ghaziabad', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '201001-201009', isODA: false, distanceFromHub: '1390', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 26, code: 'BHIW', cityName: 'Bhiwani', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '127021-127031', isODA: false, distanceFromHub: '1500', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 27, code: 'CDD', cityName: 'Charkhi Dadri', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '127306-127310', isODA: false, distanceFromHub: '1520', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 28, code: 'JHA', cityName: 'Jhajjar', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '124103-124107', isODA: false, distanceFromHub: '1450', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 29, code: 'JIN', cityName: 'Jind', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '126102-126103', isODA: false, distanceFromHub: '1480', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 30, code: 'KAR', cityName: 'Karnal', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '132001-132001', isODA: false, distanceFromHub: '1550', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 31, code: 'MAH', cityName: 'Mahendragarh', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '123029-123031', isODA: false, distanceFromHub: '1510', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 32, code: 'NUH', cityName: 'Nuh', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '122107-122108', isODA: false, distanceFromHub: '1420', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 33, code: 'PAL', cityName: 'Palwal', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '121102-121102', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 34, code: 'PAN', cityName: 'Panipat', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '132103-132103', isODA: false, distanceFromHub: '1560', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 35, code: 'REW', cityName: 'Rewari', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '123401-123401', isODA: false, distanceFromHub: '1470', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 36, code: 'ROH', cityName: 'Rohtak', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '124001-124001', isODA: false, distanceFromHub: '1460', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 37, code: 'SON', cityName: 'Sonipat', state: 'Haryana', region: 'NCR', zone: 'North', pincodeRanges: '131001-131001', isODA: false, distanceFromHub: '1440', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    
    // Delhi NCR - Uttar Pradesh Districts
    { id: 38, code: 'BAG', cityName: 'Baghpat', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '250609-250609', isODA: false, distanceFromHub: '1410', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 39, code: 'BUL', cityName: 'Bulandshahr', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '203001-203001', isODA: false, distanceFromHub: '1430', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 40, code: 'GBN', cityName: 'Gautam Buddh Nagar', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '201301-201309', isODA: false, distanceFromHub: '1370', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 41, code: 'HAP', cityName: 'Hapur', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '245101-245101', isODA: false, distanceFromHub: '1400', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 42, code: 'MEE', cityName: 'Meerut', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '250001-250002', isODA: false, distanceFromHub: '1420', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 43, code: 'MUZ', cityName: 'Muzaffarnagar', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '251001-251001', isODA: false, distanceFromHub: '1450', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 44, code: 'SHA', cityName: 'Shamli', state: 'Uttar Pradesh', region: 'NCR', zone: 'North', pincodeRanges: '247776-247776', isODA: false, distanceFromHub: '1440', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    
    // Delhi NCR - Rajasthan Districts
    { id: 45, code: 'ALW', cityName: 'Alwar', state: 'Rajasthan', region: 'NCR', zone: 'North', pincodeRanges: '301001-301001', isODA: false, distanceFromHub: '1500', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 46, code: 'BHA', cityName: 'Bharatpur', state: 'Rajasthan', region: 'NCR', zone: 'North', pincodeRanges: '321001-321001', isODA: false, distanceFromHub: '1520', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    
    // All Districts of Madhya Pradesh (52 districts)
    { id: 47, code: 'MP-BPL', cityName: 'Bhopal', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '462001-462042', isODA: false, distanceFromHub: '750', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 48, code: 'MP-IND', cityName: 'Indore', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '452001-452018', isODA: false, distanceFromHub: '550', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 49, code: 'MP-GWL', cityName: 'Gwalior', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '474001-474012', isODA: false, distanceFromHub: '1100', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 50, code: 'MP-JBP', cityName: 'Jabalpur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '482001-482011', isODA: false, distanceFromHub: '900', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 51, code: 'MP-UJJ', cityName: 'Ujjain', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '456001-456010', isODA: false, distanceFromHub: '600', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 52, code: 'MP-SAG', cityName: 'Sagar', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '470001-470004', isODA: false, distanceFromHub: '800', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 53, code: 'MP-DEW', cityName: 'Dewas', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '455001-455001', isODA: false, distanceFromHub: '580', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 54, code: 'MP-RAT', cityName: 'Ratlam', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '457001-457001', isODA: false, distanceFromHub: '650', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 55, code: 'MP-BUR', cityName: 'Burhanpur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '450331-450331', isODA: false, distanceFromHub: '500', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 56, code: 'MP-KHA', cityName: 'Khandwa', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '450001-450001', isODA: false, distanceFromHub: '520', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 57, code: 'MP-HAR', cityName: 'Harda', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '461331-461331', isODA: false, distanceFromHub: '700', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 58, code: 'MP-HOS', cityName: 'Hoshangabad', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '461001-461001', isODA: false, distanceFromHub: '720', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 59, code: 'MP-BET', cityName: 'Betul', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '460001-460001', isODA: false, distanceFromHub: '850', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 60, code: 'MP-CHD', cityName: 'Chhindwara', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '480001-480001', isODA: false, distanceFromHub: '950', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 61, code: 'MP-SEO', cityName: 'Seoni', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '480661-480661', isODA: false, distanceFromHub: '1000', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 62, code: 'MP-BAL', cityName: 'Balaghat', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '481001-481001', isODA: false, distanceFromHub: '1050', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 63, code: 'MP-MDL', cityName: 'Mandla', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '481661-481661', isODA: false, distanceFromHub: '980', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 64, code: 'MP-DIN', cityName: 'Dindori', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '481880-481880', isODA: false, distanceFromHub: '1020', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 65, code: 'MP-ANU', cityName: 'Anuppur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '484224-484224', isODA: false, distanceFromHub: '1100', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 66, code: 'MP-SHD', cityName: 'Shahdol', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '484001-484001', isODA: false, distanceFromHub: '1080', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 67, code: 'MP-UMR', cityName: 'Umaria', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '484661-484661', isODA: false, distanceFromHub: '1120', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 68, code: 'MP-KAT', cityName: 'Katni', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '483501-483501', isODA: false, distanceFromHub: '920', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 69, code: 'MP-DAM', cityName: 'Damoh', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '470661-470661', isODA: false, distanceFromHub: '820', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 70, code: 'MP-PAN', cityName: 'Panna', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '488001-488001', isODA: false, distanceFromHub: '1000', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 71, code: 'MP-SAT', cityName: 'Satna', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '485001-485001', isODA: false, distanceFromHub: '1050', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 72, code: 'MP-REW', cityName: 'Rewa', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '486001-486001', isODA: false, distanceFromHub: '1100', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 73, code: 'MP-SID', cityName: 'Sidhi', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '486661-486661', isODA: false, distanceFromHub: '1150', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 74, code: 'MP-SIN', cityName: 'Singrauli', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '486889-486889', isODA: false, distanceFromHub: '1200', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 75, code: 'MP-NAR', cityName: 'Narsinghpur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '487001-487001', isODA: false, distanceFromHub: '880', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 76, code: 'MP-VID', cityName: 'Vidisha', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '464001-464001', isODA: false, distanceFromHub: '780', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 77, code: 'MP-RAI', cityName: 'Raisen', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '464551-464551', isODA: false, distanceFromHub: '760', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 78, code: 'MP-SEJ', cityName: 'Sehore', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '466001-466001', isODA: false, distanceFromHub: '740', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 79, code: 'MP-RAJ', cityName: 'Rajgarh', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '465661-465661', isODA: false, distanceFromHub: '680', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 80, code: 'MP-SJP', cityName: 'Shajapur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '465001-465001', isODA: false, distanceFromHub: '620', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 81, code: 'MP-AGR', cityName: 'Agar Malwa', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '465441-465441', isODA: false, distanceFromHub: '600', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 82, code: 'MP-MAN', cityName: 'Mandsaur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '458001-458001', isODA: false, distanceFromHub: '640', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 83, code: 'MP-NEH', cityName: 'Neemuch', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '458441-458441', isODA: false, distanceFromHub: '660', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 84, code: 'MP-SHE', cityName: 'Sheopur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '476001-476001', isODA: false, distanceFromHub: '1150', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 85, code: 'MP-MOR', cityName: 'Morena', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '476001-476001', isODA: false, distanceFromHub: '1200', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 86, code: 'MP-BHO', cityName: 'Bhind', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '477001-477001', isODA: false, distanceFromHub: '1180', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 87, code: 'MP-DAT', cityName: 'Datia', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '475661-475661', isODA: false, distanceFromHub: '1120', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 88, code: 'MP-SHI', cityName: 'Shivpuri', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '473551-473551', isODA: false, distanceFromHub: '1050', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 89, code: 'MP-GUN', cityName: 'Guna', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '473001-473001', isODA: false, distanceFromHub: '980', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 90, code: 'MP-ASH', cityName: 'Ashoknagar', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '473331-473331', isODA: false, distanceFromHub: '960', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 91, code: 'MP-TIK', cityName: 'Tikamgarh', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '472001-472001', isODA: false, distanceFromHub: '1020', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 92, code: 'MP-NIW', cityName: 'Niwari', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '472336-472336', isODA: false, distanceFromHub: '1040', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 93, code: 'MP-CHT', cityName: 'Chhatarpur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '471001-471001', isODA: false, distanceFromHub: '1080', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 94, code: 'MP-MAH', cityName: 'Mahoba', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '210427-210427', isODA: false, distanceFromHub: '1300', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 95, code: 'MP-LAL', cityName: 'Lalitpur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '284403-284403', isODA: false, distanceFromHub: '1250', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 96, code: 'MP-JHA', cityName: 'Jhansi', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '284001-284001', isODA: false, distanceFromHub: '1200', transitDays: '2', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 97, code: 'MP-BAR', cityName: 'Barwani', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '451551-451551', isODA: false, distanceFromHub: '480', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 98, code: 'MP-ALI', cityName: 'Alirajpur', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '457887-457887', isODA: false, distanceFromHub: '520', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 99, code: 'MP-JHB', cityName: 'Jhabua', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '457661-457661', isODA: false, distanceFromHub: '540', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 100, code: 'MP-DHA', cityName: 'Dhar', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '454001-454001', isODA: false, distanceFromHub: '560', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() },
    { id: 101, code: 'MP-KHG', cityName: 'Khargone', state: 'Madhya Pradesh', region: 'Central', zone: 'Central', pincodeRanges: '451001-451001', isODA: false, distanceFromHub: '490', transitDays: '1', status: 'Active', createdAt: new Date('2024-01-10').toISOString() }
  ];
  localStorage.setItem('cities', JSON.stringify(cities));

  // 3. TBB CLIENTS
  const tbbClients = [
    {
      id: 1,
      code: 'TBB001',
      clientType: 'TBB',
      companyName: 'ABC Logistics Pvt Ltd',
      tradeName: 'ABC Logistics',
      address: {
        line1: '101 Business Park',
        line2: 'Sector 18',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        country: 'India'
      },
      primaryContact: {
        name: 'Vikram Singh',
        designation: 'Operations Manager',
        mobile: '9876543201',
        phone: '022-11111111',
        email: 'vikram@abclogistics.com'
      },
      additionalContacts: [],
      gstNumber: '27AABCU1234A1Z5',
      panNumber: 'AABCU1234A',
      bankDetails: {
        accountName: 'ABC Logistics Pvt Ltd',
        accountNumber: '1234567890123456',
        bankName: 'HDFC Bank',
        branch: 'Andheri',
        ifscCode: 'HDFC0001234'
      },
      billingDetails: {
        creditLimit: '500000',
        creditDays: '30',
        paymentTerms: 'Net 30'
      },
      status: 'Active',
      remarks: 'Regular client',
      createdAt: new Date('2024-01-20').toISOString()
    },
    {
      id: 2,
      code: 'TBB002',
      clientType: 'TBB',
      companyName: 'XYZ Transport Solutions',
      tradeName: 'XYZ Transport',
      address: {
        line1: '202 Trade Center',
        line2: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India'
      },
      primaryContact: {
        name: 'Anjali Mehta',
        designation: 'Director',
        mobile: '9876543202',
        phone: '011-22222222',
        email: 'anjali@xyztransport.com'
      },
      additionalContacts: [],
      gstNumber: '07XYZTS5678B2Z6',
      panNumber: 'XYZTS5678B',
      bankDetails: {
        accountName: 'XYZ Transport Solutions',
        accountNumber: '2345678901234567',
        bankName: 'ICICI Bank',
        branch: 'CP',
        ifscCode: 'ICIC0002345'
      },
      billingDetails: {
        creditLimit: '1000000',
        creditDays: '45',
        paymentTerms: 'Net 45'
      },
      status: 'Active',
      remarks: 'Premium client',
      createdAt: new Date('2024-02-01').toISOString()
    },
    {
      id: 3,
      code: 'TBB003',
      clientType: 'TBB',
      companyName: 'Global Cargo Services',
      tradeName: 'Global Cargo',
      address: {
        line1: '303 Industrial Area',
        line2: 'Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        country: 'India'
      },
      primaryContact: {
        name: 'Rahul Desai',
        designation: 'CEO',
        mobile: '9876543203',
        phone: '080-33333333',
        email: 'rahul@globalcargo.com'
      },
      additionalContacts: [],
      gstNumber: '29GCS9012C3Z7',
      panNumber: 'GCS9012C3',
      bankDetails: {
        accountName: 'Global Cargo Services',
        accountNumber: '3456789012345678',
        bankName: 'Axis Bank',
        branch: 'Whitefield',
        ifscCode: 'UTIB0003456'
      },
      billingDetails: {
        creditLimit: '750000',
        creditDays: '30',
        paymentTerms: 'Net 30'
      },
      status: 'Active',
      remarks: 'New client',
      createdAt: new Date('2024-02-10').toISOString()
    }
  ];
  localStorage.setItem('tbbClients', JSON.stringify(tbbClients));

  // 4. VEHICLES
  const vehicles = [
    {
      id: 1,
      vehicleNumber: 'MH01AB1234',
      vehicleType: 'Truck',
      capacity: '9',
      capacityUnit: 'Tons',
      owner: {
        name: 'Transport Owner 1',
        contact: '9876543301',
        address: 'Mumbai, Maharashtra'
      },
      insurance: {
        policyNumber: 'INS001',
        provider: 'ICICI Lombard',
        expiryDate: '2025-12-31'
      },
      fitness: {
        certificateNumber: 'FIT001',
        expiryDate: '2025-06-30'
      },
      permit: {
        permitNumber: 'PER001',
        permitType: 'National',
        expiryDate: '2025-12-31'
      },
      rcBook: 'RC001',
      status: 'Active',
      remarks: 'Well maintained',
      createdAt: new Date('2024-01-05').toISOString()
    },
    {
      id: 2,
      vehicleNumber: 'DL01CD5678',
      vehicleType: 'Container',
      capacity: '14',
      capacityUnit: 'Tons',
      owner: {
        name: 'Transport Owner 2',
        contact: '9876543302',
        address: 'Delhi, Delhi'
      },
      insurance: {
        policyNumber: 'INS002',
        provider: 'HDFC Ergo',
        expiryDate: '2025-11-30'
      },
      fitness: {
        certificateNumber: 'FIT002',
        expiryDate: '2025-05-31'
      },
      permit: {
        permitNumber: 'PER002',
        permitType: 'National',
        expiryDate: '2025-11-30'
      },
      rcBook: 'RC002',
      status: 'Active',
      remarks: 'New vehicle',
      createdAt: new Date('2024-01-10').toISOString()
    },
    {
      id: 3,
      vehicleNumber: 'KA01EF9012',
      vehicleType: 'Truck',
      capacity: '7',
      capacityUnit: 'Tons',
      owner: {
        name: 'Transport Owner 3',
        contact: '9876543303',
        address: 'Bangalore, Karnataka'
      },
      insurance: {
        policyNumber: 'INS003',
        provider: 'Bajaj Allianz',
        expiryDate: '2025-10-31'
      },
      fitness: {
        certificateNumber: 'FIT003',
        expiryDate: '2025-04-30'
      },
      permit: {
        permitNumber: 'PER003',
        permitType: 'National',
        expiryDate: '2025-10-31'
      },
      rcBook: 'RC003',
      status: 'Active',
      remarks: 'Regular service',
      createdAt: new Date('2024-01-15').toISOString()
    },
    {
      id: 4,
      vehicleNumber: 'MH01GH3456',
      vehicleType: 'Container',
      capacity: '12',
      capacityUnit: 'Tons',
      owner: {
        name: 'Transport Owner 4',
        contact: '9876543304',
        address: 'Pune, Maharashtra'
      },
      insurance: {
        policyNumber: 'INS004',
        provider: 'New India Assurance',
        expiryDate: '2025-09-30'
      },
      fitness: {
        certificateNumber: 'FIT004',
        expiryDate: '2025-03-31'
      },
      permit: {
        permitNumber: 'PER004',
        permitType: 'National',
        expiryDate: '2025-09-30'
      },
      rcBook: 'RC004',
      status: 'Active',
      remarks: '',
      createdAt: new Date('2024-02-01').toISOString()
    }
  ];
  localStorage.setItem('vehicles', JSON.stringify(vehicles));

  // 5. DRIVERS
  const drivers = [
    {
      id: 1,
      driverName: 'Rajesh Kumar',
      fatherName: 'Suresh Kumar',
      mobile: '9876543401',
      alternateMobile: '9876543402',
      address: '123 Driver Street, Andheri',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      licenseNumber: 'MH0120240001234',
      licenseExpiryDate: '2026-12-31',
      licenseIssueDate: '2021-01-15',
      licenseType: 'Heavy Vehicle',
      bloodGroup: 'O+',
      dateOfBirth: '1985-05-15',
      gender: 'Male',
      aadharNumber: '123456789012',
      emailId: 'rajesh@example.com',
      emergencyContactName: 'Suresh Kumar',
      emergencyContactNumber: '9876543403',
      salary: '35000',
      salaryType: 'Monthly',
      joinDate: '2023-01-01',
      status: 'Active',
      remarks: 'Experienced driver',
      createdAt: new Date('2024-01-05').toISOString()
    },
    {
      id: 2,
      driverName: 'Amit Singh',
      fatherName: 'Ramesh Singh',
      mobile: '9876543404',
      alternateMobile: '9876543405',
      address: '456 Driver Road, CP',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      licenseNumber: 'DL0120240005678',
      licenseExpiryDate: '2027-06-30',
      licenseIssueDate: '2022-01-20',
      licenseType: 'Heavy Vehicle',
      bloodGroup: 'B+',
      dateOfBirth: '1988-08-20',
      gender: 'Male',
      aadharNumber: '234567890123',
      emailId: 'amit@example.com',
      emergencyContactName: 'Ramesh Singh',
      emergencyContactNumber: '9876543406',
      salary: '38000',
      salaryType: 'Monthly',
      joinDate: '2023-03-15',
      status: 'Active',
      remarks: 'Good track record',
      createdAt: new Date('2024-01-10').toISOString()
    },
    {
      id: 3,
      driverName: 'Vikram Patel',
      fatherName: 'Mahesh Patel',
      mobile: '9876543407',
      alternateMobile: '9876543408',
      address: '789 Driver Lane, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      licenseNumber: 'KA0120240009012',
      licenseExpiryDate: '2026-03-31',
      licenseIssueDate: '2021-04-10',
      licenseType: 'Heavy Vehicle',
      bloodGroup: 'A+',
      dateOfBirth: '1987-11-10',
      gender: 'Male',
      aadharNumber: '345678901234',
      emailId: 'vikram@example.com',
      emergencyContactName: 'Mahesh Patel',
      emergencyContactNumber: '9876543409',
      salary: '36000',
      salaryType: 'Monthly',
      joinDate: '2023-02-01',
      status: 'Active',
      remarks: 'Reliable driver',
      createdAt: new Date('2024-01-15').toISOString()
    }
  ];
  localStorage.setItem('drivers', JSON.stringify(drivers));

  // 6. STAFF
  const staff = [
    {
      id: 1,
      employeeCode: 'EMP001',
      employeeName: 'Priya Sharma',
      designation: 'Branch Manager',
      department: 'Operations',
      mobile: '9876543501',
      email: 'priya@tms.com',
      address: 'Mumbai, Maharashtra',
      joinDate: '2023-01-01',
      salary: '60000',
      status: 'Active',
      createdAt: new Date('2024-01-05').toISOString()
    },
    {
      id: 2,
      employeeCode: 'EMP002',
      employeeName: 'Rahul Mehta',
      designation: 'Accountant',
      department: 'Finance',
      mobile: '9876543502',
      email: 'rahul@tms.com',
      address: 'Delhi, Delhi',
      joinDate: '2023-02-15',
      salary: '45000',
      status: 'Active',
      createdAt: new Date('2024-01-10').toISOString()
    },
    {
      id: 3,
      employeeCode: 'EMP003',
      employeeName: 'Sneha Reddy',
      designation: 'LR Operator',
      department: 'Operations',
      mobile: '9876543503',
      email: 'sneha@tms.com',
      address: 'Bangalore, Karnataka',
      joinDate: '2023-03-01',
      salary: '35000',
      status: 'Active',
      createdAt: new Date('2024-01-15').toISOString()
    }
  ];
  localStorage.setItem('staff', JSON.stringify(staff));

  // 7. LR SERIES
  const lrSeries = [
    { id: 1, seriesCode: 'LR-MUM', seriesName: 'Mumbai LR Series', prefix: 'MUM', startNumber: 1000, currentNumber: 1050, branch: 'BR001', status: 'Active', createdAt: new Date('2024-01-01').toISOString() },
    { id: 2, seriesCode: 'LR-DEL', seriesName: 'Delhi LR Series', prefix: 'DEL', startNumber: 2000, currentNumber: 2025, branch: 'BR002', status: 'Active', createdAt: new Date('2024-01-01').toISOString() },
    { id: 3, seriesCode: 'LR-BLR', seriesName: 'Bangalore LR Series', prefix: 'BLR', startNumber: 3000, currentNumber: 3010, branch: 'BR003', status: 'Active', createdAt: new Date('2024-01-01').toISOString() }
  ];
  localStorage.setItem('lrSeries', JSON.stringify(lrSeries));

  // 8. ACCOUNTS
  const accounts = [
    { id: 1, accountCode: 'ACC001', accountName: 'Freight Income', accountType: 'Income', category: 'Revenue', status: 'Active', createdAt: new Date('2024-01-01').toISOString() },
    { id: 2, accountCode: 'ACC002', accountName: 'Fuel Expenses', accountType: 'Expense', category: 'Operating', status: 'Active', createdAt: new Date('2024-01-01').toISOString() },
    { id: 3, accountCode: 'ACC003', accountName: 'Driver Salary', accountType: 'Expense', category: 'Personnel', status: 'Active', createdAt: new Date('2024-01-01').toISOString() },
    { id: 4, accountCode: 'ACC004', accountName: 'Vehicle Maintenance', accountType: 'Expense', category: 'Operating', status: 'Active', createdAt: new Date('2024-01-01').toISOString() }
  ];
  localStorage.setItem('accounts', JSON.stringify(accounts));

  // 9. CLIENT RATES
  const clientRates = [
    {
      id: 1,
      clientCode: 'TBB001',
      origin: 'MUM',
      destination: 'DEL',
      ratePerKg: '15',
      ratePerCFT: '200',
      minCharge: '500',
      effectiveDate: '2024-01-01',
      status: 'Active',
      createdAt: new Date('2024-01-15').toISOString()
    },
    {
      id: 2,
      clientCode: 'TBB001',
      origin: 'MUM',
      destination: 'BLR',
      ratePerKg: '12',
      ratePerCFT: '180',
      minCharge: '400',
      effectiveDate: '2024-01-01',
      status: 'Active',
      createdAt: new Date('2024-01-15').toISOString()
    },
    {
      id: 3,
      clientCode: 'TBB002',
      origin: 'DEL',
      destination: 'BLR',
      ratePerKg: '18',
      ratePerCFT: '250',
      minCharge: '600',
      effectiveDate: '2024-01-01',
      status: 'Active',
      createdAt: new Date('2024-02-01').toISOString()
    }
  ];
  localStorage.setItem('clientRates', JSON.stringify(clientRates));

  // 10. LR BOOKINGS
  const lrBookings = [
    {
      id: 1,
      lrNumber: '1000000001',
      lrMode: 'auto',
      branch: 'BR001',
      bookingMode: 'PTL',
      vehicleNumber: 'MH01AB1234',
      deliveryType: 'Godown',
      bookingDate: '2024-12-20',
      expectedDeliveryDate: '2024-12-22',
      paymentMode: 'Paid',
      tbbClient: 'TBB001',
      consignor: {
        name: 'ABC Logistics Pvt Ltd',
        address: 'Mumbai',
        contact: '9876543201',
        gst: '27AABCU1234A1Z5'
      },
      consignee: {
        name: 'XYZ Trading Co',
        address: 'Delhi',
        contact: '9876543210',
        gst: '07XYZTC1234B1Z5'
      },
      origin: 'MUM',
      destination: 'DEL',
      pieces: '10',
      weight: '500',
      cftDimensions: { length: '100', width: '80', height: '60', unit: 'cm', factor: 6 },
      calculatedCFT: 48,
      invoices: [{ number: 'INV001' }],
      ewaybills: [{ number: 'EWB001', expiryDate: '2024-12-25' }],
      charges: {
        rate: '15',
        freightRate: '7200',
        lrCharges: '50',
        hamali: '200',
        pickupDelivery: '500',
        odaCharges: '0',
        other: '0',
        waraiUnion: '0',
        gstPercent: '5-rcm'
      },
      totalAmount: 7950,
      gstAmount: 397.5,
      status: 'Booked',
      createdAt: new Date('2024-12-20').toISOString()
    },
    {
      id: 2,
      lrNumber: '1000000002',
      lrMode: 'auto',
      branch: 'BR001',
      bookingMode: 'PTL',
      vehicleNumber: 'MH01AB1234',
      deliveryType: 'Door',
      bookingDate: '2024-12-21',
      expectedDeliveryDate: '2024-12-23',
      paymentMode: 'To Pay',
      tbbClient: 'TBB002',
      consignor: {
        name: 'XYZ Transport Solutions',
        address: 'Delhi',
        contact: '9876543202',
        gst: '07XYZTS5678B2Z6'
      },
      consignee: {
        name: 'Global Imports Ltd',
        address: 'Bangalore',
        contact: '9876543211',
        gst: '29GIL5678C2Z6'
      },
      origin: 'DEL',
      destination: 'BLR',
      pieces: '15',
      weight: '750',
      cftDimensions: { length: '120', width: '90', height: '70', unit: 'cm', factor: 6 },
      calculatedCFT: 75.6,
      invoices: [{ number: 'INV002' }],
      ewaybills: [{ number: 'EWB002', expiryDate: '2024-12-26' }],
      charges: {
        rate: '18',
        freightRate: '18900',
        lrCharges: '50',
        hamali: '300',
        pickupDelivery: '800',
        odaCharges: '0',
        other: '0',
        waraiUnion: '0',
        gstPercent: '5-rcm'
      },
      totalAmount: 20050,
      gstAmount: 1002.5,
      status: 'Booked',
      createdAt: new Date('2024-12-21').toISOString()
    }
  ];
  localStorage.setItem('lrBookings', JSON.stringify(lrBookings));

  // 11. MANIFESTS
  const manifests = [
    {
      id: 1,
      manifestNumber: 'MAN-2024-001',
      manifestDate: '2024-12-20',
      branch: '1', // BR001 (Mumbai)
      destinationBranch: '2', // BR002 (Delhi) - based on LR destination
      vehicleNumber: 'MH01AB1234',
      driverName: 'Rajesh Kumar',
      route: 'Mumbai to Delhi',
      selectedLRs: [lrBookings[0]], // First LR booking (Mumbai to Delhi)
      departureDate: '2024-12-20',
      departureTime: '10:00',
      remarks: 'On time departure',
      status: 'In Transit',
      summary: {
        totalPieces: parseInt(lrBookings[0].pieces) || 0,
        totalWeight: parseFloat(lrBookings[0].weight) || 0,
        totalPaid: lrBookings[0].paymentMode === 'Paid' ? parseFloat(lrBookings[0].totalAmount) || 0 : 0,
        totalToPay: lrBookings[0].paymentMode === 'To Pay' ? parseFloat(lrBookings[0].totalAmount) || 0 : 0,
        totalTBB: lrBookings[0].paymentMode === 'TBB' ? parseFloat(lrBookings[0].totalAmount) || 0 : 0,
        lrCount: 1
      },
      createdAt: new Date('2024-12-20').toISOString()
    }
  ];
  localStorage.setItem('manifests', JSON.stringify(manifests));

  // 12. TRIPS
  const trips = [
    {
      id: 1,
      tripNumber: 'TRIP-2024-001',
      manifestNumber: 'MAN-2024-001',
      vehicleNumber: 'MH01AB1234',
      driverName: 'Rajesh Kumar',
      origin: 'MUM',
      destination: 'DEL',
      startDate: '2024-12-20',
      startTime: '10:00',
      expectedEndDate: '2024-12-22',
      status: 'In Progress',
      expenses: [],
      createdAt: new Date('2024-12-20').toISOString()
    }
  ];
  localStorage.setItem('trips', JSON.stringify(trips));

  // 13. INVOICES
  const invoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-12-20',
      clientCode: 'TBB001',
      lrNumbers: ['1000000001'],
      amount: 7950,
      gstAmount: 397.5,
      totalAmount: 8347.5,
      status: 'Pending',
      dueDate: '2025-01-19',
      createdAt: new Date('2024-12-20').toISOString()
    }
  ];
  localStorage.setItem('invoices', JSON.stringify(invoices));

  // 14. PAYMENTS
  const payments = [
    {
      id: 1,
      paymentNumber: 'PAY-2024-001',
      paymentDate: '2024-12-25',
      clientCode: 'TBB001',
      invoiceNumber: 'INV-2024-001',
      amount: 8347.5,
      paymentMode: 'Bank Transfer',
      referenceNumber: 'TXN123456',
      remarks: 'Payment received',
      createdAt: new Date('2024-12-25').toISOString()
    }
  ];
  localStorage.setItem('payments', JSON.stringify(payments));

  // 15. VENDORS
  const marketVehicleVendors = [
    {
      id: 1,
      vendorCode: 'VEN001',
      vendorName: 'Quick Transport Services',
      contact: '9876543601',
      address: 'Mumbai, Maharashtra',
      gstNumber: '27QTS1234A1Z5',
      status: 'Active',
      createdAt: new Date('2024-01-10').toISOString()
    },
    {
      id: 2,
      vendorCode: 'VEN002',
      vendorName: 'Reliable Cargo Movers',
      contact: '9876543602',
      address: 'Delhi, Delhi',
      gstNumber: '07RCM5678B2Z6',
      status: 'Active',
      createdAt: new Date('2024-01-15').toISOString()
    }
  ];
  localStorage.setItem('marketVehicleVendors', JSON.stringify(marketVehicleVendors));

  const otherVendors = [
    {
      id: 1,
      code: 'OVEN001',
      vendorCode: 'OVEN001',
      vendorType: 'Other Vendor',
      vendorCategory: 'Fuel Supplier',
      companyName: 'HPCL - Hindustan Petroleum Corporation Limited',
      tradeName: 'HPCL',
      address: {
        line1: 'Petroleum House',
        line2: '17 Jamshedji Tata Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400020',
        country: 'India'
      },
      primaryContact: {
        name: 'Rajesh Kumar',
        designation: 'Sales Manager',
        mobile: '9876543701',
        phone: '022-22021234',
        email: 'sales@hpcl.in'
      },
      gstNumber: '27AAACH1234A1Z5',
      panNumber: 'AAACH1234A',
      productServices: 'Petrol, Diesel, Lubricants',
      bankDetails: {
        accountName: 'HPCL',
        accountNumber: '1234567890123456',
        bankName: 'State Bank of India',
        branch: 'Mumbai',
        ifscCode: 'SBIN0001234'
      },
      paymentTerms: {
        creditDays: '15',
        creditLimit: '500000',
        terms: 'Net 15'
      },
      tdsApplicable: false,
      tdsPercentage: '',
      status: 'Active',
      remarks: 'Authorized HPCL dealer',
      createdAt: new Date('2024-01-10').toISOString()
    },
    {
      id: 2,
      code: 'OVEN002',
      vendorCode: 'OVEN002',
      vendorType: 'Other Vendor',
      vendorCategory: 'Fuel Supplier',
      companyName: 'BPCL - Bharat Petroleum Corporation Limited',
      tradeName: 'BPCL',
      address: {
        line1: 'Bharat Bhavan',
        line2: '4 & 6 Currimbhoy Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      primaryContact: {
        name: 'Priya Sharma',
        designation: 'Account Manager',
        mobile: '9876543702',
        phone: '022-22712345',
        email: 'accounts@bpcl.in'
      },
      gstNumber: '27AABCB5678B2Z6',
      panNumber: 'AABCB5678B',
      productServices: 'Petrol, Diesel, Lubricants',
      bankDetails: {
        accountName: 'BPCL',
        accountNumber: '2345678901234567',
        bankName: 'HDFC Bank',
        branch: 'Mumbai',
        ifscCode: 'HDFC0002345'
      },
      paymentTerms: {
        creditDays: '15',
        creditLimit: '500000',
        terms: 'Net 15'
      },
      tdsApplicable: false,
      tdsPercentage: '',
      status: 'Active',
      remarks: 'Authorized BPCL dealer',
      createdAt: new Date('2024-01-10').toISOString()
    },
    {
      id: 3,
      code: 'OVEN003',
      vendorCode: 'OVEN003',
      vendorType: 'Other Vendor',
      vendorCategory: 'Fuel Supplier',
      companyName: 'IOCL - Indian Oil Corporation Limited',
      tradeName: 'IOCL',
      address: {
        line1: 'IndianOil Bhavan',
        line2: '3079/3 J B Tito Marg',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110003',
        country: 'India'
      },
      primaryContact: {
        name: 'Amit Patel',
        designation: 'Regional Manager',
        mobile: '9876543703',
        phone: '011-23379123',
        email: 'regional@iocl.in'
      },
      gstNumber: '07AAACI9012C3Z7',
      panNumber: 'AAACI9012C',
      productServices: 'Petrol, Diesel, Lubricants',
      bankDetails: {
        accountName: 'IOCL',
        accountNumber: '3456789012345678',
        bankName: 'ICICI Bank',
        branch: 'Delhi',
        ifscCode: 'ICIC0003456'
      },
      paymentTerms: {
        creditDays: '15',
        creditLimit: '500000',
        terms: 'Net 15'
      },
      tdsApplicable: false,
      tdsPercentage: '',
      status: 'Active',
      remarks: 'Authorized IOCL dealer',
      createdAt: new Date('2024-01-10').toISOString()
    }
  ];
  localStorage.setItem('otherVendors', JSON.stringify(otherVendors));

  console.log('✅ Sample data initialized successfully!');
  console.log('📊 Data Summary:');
  console.log(`   - Branches: ${branches.length}`);
  console.log(`   - Cities: ${cities.length}`);
  console.log(`   - TBB Clients: ${tbbClients.length}`);
  console.log(`   - Vehicles: ${vehicles.length}`);
  console.log(`   - Drivers: ${drivers.length}`);
  console.log(`   - Staff: ${staff.length}`);
  console.log(`   - LR Bookings: ${lrBookings.length}`);
  console.log(`   - Manifests: ${manifests.length}`);
  console.log(`   - Trips: ${trips.length}`);
  console.log(`   - Invoices: ${invoices.length}`);
  console.log(`   - Payments: ${payments.length}`);
  
  return true;
};

// Auto-initialize if localStorage is empty
if (typeof window !== 'undefined') {
  const hasData = localStorage.getItem('branches') || localStorage.getItem('cities') || localStorage.getItem('tbbClients');
  if (!hasData) {
    initSampleData();
    alert('Sample data has been loaded! You can now use the application with pre-filled data.\n\nLogin credentials:\n- admin / admin123\n- manager / manager123\n- operator / operator123\n- accountant / accountant123\n- driver / driver123');
  }
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = initSampleData;
}

// Export for ES6 modules
export default initSampleData;

