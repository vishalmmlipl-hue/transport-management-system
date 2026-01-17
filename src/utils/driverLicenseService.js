/**
 * Driver License Verification Service
 * Uses consent-based API for fetching driver license details
 */

import { apiService } from './apiService';

/**
 * Generate consent artifact for driver license verification
 */
const generateConsentArtifact = (dlno, uid, fullName, dob, mobile, email, dataConsumerId) => {
  const consentId = `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  // Generate consent artifact matching API Setu format exactly
  return {
    consent: {
      consentId: consentId,
      timestamp: timestamp,
      dataConsumer: {
        id: dataConsumerId || 'tms-driver-verification'
      },
      dataProvider: {
        id: 'rto-india' // API Setu expects this format
      },
      purpose: {
        description: 'Driver license verification for employment'
      },
      user: {
        idType: 'DL', // Driver License
        idNumber: dlno,
        mobile: mobile || '9988776655', // Default if not provided
        email: email || 'test@email.com' // Default if not provided
      },
      data: {
        id: 'driver-license'
      },
      permission: {
        access: 'read',
        dateRange: {
          from: timestamp,
          to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year validity
        },
        frequency: {
          unit: 'once',
          value: 1,
          repeats: 0
        }
      }
    },
    signature: {
      signature: btoa(JSON.stringify({ consentId, timestamp, dlno })) // Base64 encoded signature
    }
  };
};

/**
 * Verify driver license using consent-based API
 * @param {string} dlno - Driver license number (e.g., MP4120131062332)
 * @param {string} dob - Date of birth (format: DD-MM-YYYY, e.g., 25-10-1988)
 * @param {string} fullName - Full name (optional, for verification)
 * @param {string} uid - UID/Aadhar number (optional)
 * @param {string} mobile - Mobile number (optional)
 * @param {string} email - Email (optional)
 */
export const verifyDriverLicense = async (dlno, dob, fullName = '', uid = '', mobile = '', email = '') => {
  try {
    if (!dlno || !dob) {
      throw new Error('License number and date of birth are required');
    }

    // Format DOB to DD-MM-YYYY if needed
    let formattedDob = dob;
    if (dob.includes('/')) {
      const [day, month, year] = dob.split('/');
      formattedDob = `${day}-${month}-${year}`;
    } else if (dob.includes('-')) {
      // Check if it's YYYY-MM-DD format (from date input)
      const parts = dob.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD format, convert to DD-MM-YYYY
        const [year, month, day] = parts;
        formattedDob = `${day}-${month}-${year}`;
      } else {
        // Already in DD-MM-YYYY format
        formattedDob = dob;
      }
    }

    console.log('📅 DOB formatted:', { original: dob, formatted: formattedDob });

    // Generate consent artifact
    const consentArtifact = generateConsentArtifact(dlno, uid, fullName, formattedDob, mobile, email);

    // Prepare request payload matching API Setu format exactly
    const requestPayload = {
      txnId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      format: 'json', // Use 'json' for easier parsing (can also use 'xml' or 'pdf')
      certificateParameters: {
        dlno: dlno.toUpperCase().trim(),
        UID: uid || '',
        FullName: fullName || '',
        DOB: formattedDob
      },
      consentArtifact: consentArtifact
    };

    console.log('📋 License verification request:', {
      dlno: requestPayload.certificateParameters.dlno,
      dob: requestPayload.certificateParameters.DOB,
      format: requestPayload.format
    });

    // Call backend API (which will proxy to API Setu)
    try {
      const result = await apiService.verifyDriverLicense(requestPayload);
      console.log('✅ License API call successful:', result);
      
      // If result has data field, use it; otherwise use result directly
      const data = result.data || result;
      
      // Check if it's a mock response
      if (result.isMock) {
        console.warn('⚠️ Using mock data - API unavailable');
      }
      
      return data;
    } catch (error) {
      console.error('❌ License API call failed:', error);
      throw new Error(`License verification failed: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error verifying driver license:', error);
    throw error;
  }
};

/**
 * Parse driver license response and extract relevant fields
 * Handles JSON, XML, and PDF responses from API Setu
 */
export const parseLicenseData = (apiResponse) => {
  if (!apiResponse) {
    return null;
  }

  // Handle different response formats
  let data = apiResponse.data || apiResponse;
  
  // If response is wrapped in a success object
  if (apiResponse.success && apiResponse.data) {
    data = apiResponse.data;
  }

  // Handle XML format
  if (data.xml || data.format === 'xml') {
    // Try to use parsed data if available
    if (data.parsed) {
      return {
        name: data.parsed.name || '',
        licenseNumber: data.parsed.licenseNumber || '',
        dateOfBirth: data.parsed.dob || '',
        rawXml: data.xml,
        format: 'xml'
      };
    }
    // Basic XML parsing - extract common fields using regex
    const xml = data.xml || data.raw || '';
    const nameMatch = xml.match(/<Name[^>]*>([^<]+)<\/Name>/i) || xml.match(/<FullName[^>]*>([^<]+)<\/FullName>/i);
    const fatherMatch = xml.match(/<FatherName[^>]*>([^<]+)<\/FatherName>/i);
    const dobMatch = xml.match(/<DOB[^>]*>([^<]+)<\/DOB>/i) || xml.match(/<DateOfBirth[^>]*>([^<]+)<\/DateOfBirth>/i);
    const dlnoMatch = xml.match(/<DLNo[^>]*>([^<]+)<\/DLNo>/i) || xml.match(/<LicenseNumber[^>]*>([^<]+)<\/LicenseNumber>/i);
    const addressMatch = xml.match(/<Address[^>]*>([^<]+)<\/Address>/i);
    const stateMatch = xml.match(/<State[^>]*>([^<]+)<\/State>/i);
    const issueDateMatch = xml.match(/<IssueDate[^>]*>([^<]+)<\/IssueDate>/i);
    const expiryDateMatch = xml.match(/<ExpiryDate[^>]*>([^<]+)<\/ExpiryDate>/i) || xml.match(/<ValidTill[^>]*>([^<]+)<\/ValidTill>/i);
    const bloodGroupMatch = xml.match(/<BloodGroup[^>]*>([^<]+)<\/BloodGroup>/i);
    
    return {
      name: nameMatch ? nameMatch[1].trim() : '',
      fatherName: fatherMatch ? fatherMatch[1].trim() : '',
      dateOfBirth: dobMatch ? dobMatch[1].trim() : '',
      address: addressMatch ? addressMatch[1].trim() : '',
      state: stateMatch ? stateMatch[1].trim() : '',
      licenseNumber: dlnoMatch ? dlnoMatch[1].trim() : '',
      licenseIssueDate: issueDateMatch ? issueDateMatch[1].trim() : '',
      licenseExpiryDate: expiryDateMatch ? expiryDateMatch[1].trim() : '',
      bloodGroup: bloodGroupMatch ? bloodGroupMatch[1].trim() : '',
      format: 'xml',
      rawXml: xml
    };
  }

  // Handle PDF format
  if (data.pdf || data.format === 'pdf') {
    console.warn('PDF format detected - PDF parsing not implemented. Please use JSON or XML format.');
    return {
      pdf: data.pdf,
      format: 'pdf',
      message: 'PDF format received. Please use JSON format for automatic parsing.'
    };
  }
  
  // Extract fields from JSON response
  // API Setu JSON response structure - check multiple possible field names
  return {
    name: data.name || data.fullName || data.holderName || data.Name || data.certificateData?.name || '',
    fatherName: data.fatherName || data.fathersName || data.FatherName || data.certificateData?.fatherName || '',
    dateOfBirth: data.dob || data.dateOfBirth || data.DOB || data.DateOfBirth || data.certificateData?.dob || '',
    address: data.address || data.permanentAddress || data.Address || data.certificateData?.address || '',
    city: data.city || data.City || data.certificateData?.city || '',
    state: data.state || data.State || data.certificateData?.state || '',
    pincode: data.pincode || data.pinCode || data.Pincode || data.certificateData?.pincode || '',
    licenseNumber: data.dlno || data.licenseNumber || data.DLNo || data.certificateData?.dlno || '',
    licenseIssueDate: data.issueDate || data.dateOfIssue || data.IssueDate || data.certificateData?.issueDate || '',
    licenseExpiryDate: data.expiryDate || data.validTill || data.validUpto || data.ExpiryDate || data.ValidTill || data.certificateData?.expiryDate || '',
    licenseType: data.licenseType || data.cov || data.vehicleClass || data.LicenseType || data.COV || data.certificateData?.licenseType || '',
    bloodGroup: data.bloodGroup || data.BloodGroup || data.certificateData?.bloodGroup || '',
    status: data.status || data.Status || data.certificateData?.status || 'ACTIVE',
    vehicleClasses: data.vehicleClasses || data.covDetails || data.VehicleClasses || data.certificateData?.vehicleClasses || [],
    rto: data.rto || data.issuingRTO || data.RTO || data.certificateData?.rto || '',
    rawData: data // Keep raw data for debugging
  };
};

export default {
  verifyDriverLicense,
  parseLicenseData
};
