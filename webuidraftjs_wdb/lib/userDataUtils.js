/**
 * User data utilities for fetching user information from Firebase Realtime Database
 */

import { ref, get } from "firebase/database";
import { realtimeDb } from "@/firebase";

/**
 * Cache for storing user data to avoid repeated database calls
 */
const userDataCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Get user's full name from Firebase Realtime Database
 * @param {string} email - User's email address
 * @returns {Promise<string>} User's full name or fallback display name
 */
export async function getUserFullName(email) {
  if (!email) {
    console.log('❌ getUserFullName: No email provided');
    return 'Unknown User';
  }
  
  console.log(`🔍 getUserFullName: Looking up user data for: ${email}`);
  
  // Check cache first
  const cacheKey = email;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`📋 getUserFullName: Using cached data for ${email}: ${cachedData.fullName}`);
    return cachedData.fullName;
  }

  try {
    // Check if realtimeDb is available
    if (!realtimeDb) {
      console.error('❌ getUserFullName: realtimeDb is not initialized');
      return email.split('@')[0];
    }
    // Get all users from Realtime Database and search for the matching email
    console.log('📡 getUserFullName: Connecting to Realtime Database...');
    const usersRef = ref(realtimeDb, 'users');
    const snapshot = await get(usersRef);
    console.log('📡 getUserFullName: Got snapshot, exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const allUsers = snapshot.val();
      
      // Find the user with the matching email
      let matchedUserData = null;
      for (const [uid, userData] of Object.entries(allUsers)) {
        if (userData.email === email) {
          matchedUserData = userData;
          break;
        }
      }
      
      if (matchedUserData) {
        const firstName = matchedUserData.firstName || '';
        const lastName = matchedUserData.lastName || '';
        
        let fullName = '';
        if (firstName && lastName) {
          fullName = `${firstName} ${lastName}`;
        } else if (firstName) {
          fullName = firstName;
        } else if (lastName) {
          fullName = lastName;
        } else {
          // Fallback to username from email if no names found
          fullName = email.split('@')[0];
        }
        
        // Cache the result
        userDataCache.set(cacheKey, {
          fullName,
          timestamp: Date.now()
        });
        
        console.log(`✅ Found user data for ${email}: ${fullName}`);
        return fullName;
      } else {
        console.log(`❌ No user data found for email: ${email}`);
        // Fallback to username from email
        const fallbackName = email.split('@')[0];
        
        // Cache the fallback result for a shorter time
        userDataCache.set(cacheKey, {
          fullName: fallbackName,
          timestamp: Date.now()
        });
        
        return fallbackName;
      }
    } else {
      console.log(`❌ No users collection found in Realtime Database`);
      // Fallback to username from email
      const fallbackName = email.split('@')[0];
      
      // Cache the fallback result for a shorter time
      userDataCache.set(cacheKey, {
        fullName: fallbackName,
        timestamp: Date.now()
      });
      
      return fallbackName;
    }
  } catch (error) {
    console.error('❌ getUserFullName: Error fetching user data:', error);
    console.error('❌ getUserFullName: Error details:', error.message);
    
    // Fallback to username from email on error
    const fallbackName = email.split('@')[0];
    
    // Cache the fallback result
    userDataCache.set(cacheKey, {
      fullName: fallbackName,
      timestamp: Date.now()
    });
    
    return fallbackName;
  }
}

/**
 * Get user data (firstName, lastName, etc.) from Firebase Realtime Database
 * @param {string} email - User's email address
 * @returns {Promise<Object>} User data object or null if not found
 */
export async function getUserData(email) {
  if (!email) return null;
  
  try {
    // Get all users from Realtime Database and search for the matching email
    const usersRef = ref(realtimeDb, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const allUsers = snapshot.val();
      
      // Find the user with the matching email
      for (const [uid, userData] of Object.entries(allUsers)) {
        if (userData.email === email) {
          return userData;
        }
      }
      return null;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Clear the user data cache (useful for testing or manual refresh)
 */
export function clearUserDataCache() {
  userDataCache.clear();
}

/**
 * Format submitted by display with special handling for test accounts and real users
 * @param {string} email - User's email address
 * @returns {Promise<string>} Formatted display name
 */
export async function formatSubmittedBy(email) {
  if (!email) return 'Unknown User';
  
  // Check if it's a test barangay admin email (test[barangay]@example.com)
  const barangayMatch = email.match(/^test([a-zA-Z0-9\s]+)@example\.com$/);
  if (barangayMatch) {
    const barangayName = barangayMatch[1];
    return `Barangay ${barangayName} Admin`;
  }
  
  // For regular users, get their full name from Realtime Database
  return await getUserFullName(email);
}

/**
 * Get user's barangay from Firebase Realtime Database
 * @param {string} email - User's email address
 * @returns {Promise<string|null>} User's barangay or null if not found
 */
export async function getUserBarangayFromDB(email) {
  if (!email) {
    console.log('❌ getUserBarangayFromDB: No email provided');
    return null;
  }
  
  console.log(`🔍 getUserBarangayFromDB: Looking up barangay for: ${email}`);
  
  // Check cache first
  const cacheKey = `${email}_barangay`;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`📋 getUserBarangayFromDB: Using cached barangay for ${email}: ${cachedData.barangay}`);
    return cachedData.barangay;
  }

  try {
    if (!realtimeDb) {
      console.error('❌ getUserBarangayFromDB: realtimeDb is not initialized');
      return null;
    }

    const usersRef = ref(realtimeDb, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const allUsers = snapshot.val();
      
      // Find the user with the matching email
      for (const [uid, userData] of Object.entries(allUsers)) {
        if (userData.email === email) {
          let barangay = userData.barangay || null;
          
          // Normalize barangay to match BARANGAY_COORDINATES keys
          if (barangay && typeof barangay === 'string') {
            const barangayLower = barangay.toLowerCase().trim();
            
            // Special case mappings for barangays with different naming
            if (barangayLower === 'look' || barangayLower === 'look 1st') {
              barangay = 'Look 1st';
            } else {
              // Default: Capitalize first letter (e.g., "mojon" → "Mojon")
              barangay = barangay.charAt(0).toUpperCase() + barangay.slice(1).toLowerCase();
            }
          }
          
          // Cache the result
          userDataCache.set(cacheKey, {
            barangay,
            timestamp: Date.now()
          });
          
          console.log(`✅ Found barangay for ${email}: "${barangay}" (normalized from "${userData.barangay}")`);
          return barangay;
        }
      }
      
      console.log(`❌ No user found with email: ${email}`);
      return null;
    } else {
      console.log(`❌ No users collection found in Realtime Database`);
      return null;
    }
  } catch (error) {
    console.error('❌ getUserBarangayFromDB: Error fetching user barangay:', error);
    return null;
  }
}

/**
 * Get user's role from Firebase Realtime Database
 * @param {string} email - User's email address
 * @returns {Promise<string|null>} User's role or null if not found
 */
export async function getUserRoleFromDB(email) {
  if (!email) {
    console.log('❌ getUserRoleFromDB: No email provided');
    return null;
  }
  
  console.log(`🔍 getUserRoleFromDB: Looking up role for: ${email}`);
  
  // Check cache first
  const cacheKey = `${email}_role`;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`📋 getUserRoleFromDB: Using cached role for ${email}: ${cachedData.role}`);
    return cachedData.role;
  }

  try {
    if (!realtimeDb) {
      console.error('❌ getUserRoleFromDB: realtimeDb is not initialized');
      return null;
    }

    const usersRef = ref(realtimeDb, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const allUsers = snapshot.val();
      
      // Find the user with the matching email
      for (const [uid, userData] of Object.entries(allUsers)) {
        if (userData.email === email) {
          const role = userData.role || null;
          
          // Cache the result
          userDataCache.set(cacheKey, {
            role,
            timestamp: Date.now()
          });
          
          console.log(`✅ Found role for ${email}: ${role}`);
          return role;
        }
      }
      
      console.log(`❌ No user found with email: ${email}`);
      return null;
    } else {
      console.log(`❌ No users collection found in Realtime Database`);
      return null;
    }
  } catch (error) {
    console.error('❌ getUserRoleFromDB: Error fetching user role:', error);
    return null;
  }
}

/**
 * Get complete user profile from Firebase Realtime Database
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} User profile with email, role, barangay, firstName, lastName
 */
export async function getUserProfile(email) {
  if (!email) {
    console.log('❌ getUserProfile: No email provided');
    return null;
  }
  
  console.log(`🔍 getUserProfile: Looking up profile for: ${email}`);
  
  // Check cache first
  const cacheKey = `${email}_profile`;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`📋 getUserProfile: Using cached profile for ${email}`);
    return cachedData.profile;
  }

  try {
    if (!realtimeDb) {
      console.error('❌ getUserProfile: realtimeDb is not initialized');
      return null;
    }

    const usersRef = ref(realtimeDb, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const allUsers = snapshot.val();
      
      // Find the user with the matching email
      for (const [uid, userData] of Object.entries(allUsers)) {
        if (userData.email === email) {
          const profile = {
            uid,
            email: userData.email,
            role: userData.role || null,
            barangay: userData.barangay || null,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            createdAt: userData.createdAt || null,
            createdBy: userData.createdBy || null
          };
          
          // Cache the result
          userDataCache.set(cacheKey, {
            profile,
            timestamp: Date.now()
          });
          
          console.log(`✅ Found profile for ${email}:`, profile);
          return profile;
        }
      }
      
      console.log(`❌ No user found with email: ${email}`);
      return null;
    } else {
      console.log(`❌ No users collection found in Realtime Database`);
      return null;
    }
  } catch (error) {
    console.error('❌ getUserProfile: Error fetching user profile:', error);
    return null;
  }
}