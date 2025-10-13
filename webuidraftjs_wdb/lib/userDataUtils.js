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
    return 'Unknown User';
  }

  // Check cache first
  const cacheKey = email;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.fullName;
  }

  try {
    // Check if realtimeDb is available
    if (!realtimeDb) {
      return email.split('@')[0];
    }

    // Get all users from Realtime Database and search for the matching email
    const usersRef = ref(realtimeDb, 'users');
    const snapshot = await get(usersRef);
    
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
        

        return fullName;
      } else {
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
    return null;
  }

  // Check cache first
  const cacheKey = `${email}_barangay`;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.barangay;
  }

  try {
    if (!realtimeDb) {
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
          
          return barangay;
        }
      }
      
      return null;
    } else {
      return null;
    }
  } catch (error) {
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
    return null;
  }

  // Check cache first
  const cacheKey = `${email}_role`;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.role;
  }

  try {
    if (!realtimeDb) {
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
          
          return role;
        }
      }
      
      return null;
    } else {
      return null;
    }
  } catch (error) {
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
    return null;
  }

  // Check cache first
  const cacheKey = `${email}_profile`;
  const cachedData = userDataCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.profile;
  }

  try {
    if (!realtimeDb) {
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
          
          return profile;
        }
      }
      
      return null;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}
