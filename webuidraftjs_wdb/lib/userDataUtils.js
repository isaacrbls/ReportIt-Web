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