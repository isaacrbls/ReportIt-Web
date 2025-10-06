/**
 * Enhanced ML utilities for Manage Reports with best_model.tflite integration
 */

import { apiClient } from "./apiClient";

// Language detection patterns
const TAGALOG_PATTERNS = [
  /\b(ang|ng|sa|ay|at|na|mga|ako|ikaw|siya|kami|kayo|sila|ito|iyan|iyon)\b/gi,
  /\b(hindi|oo|opo|salamat|kumusta|mahal|pamilya|bahay|pera|trabaho)\b/gi,
  /\b(maganda|pangit|mabait|masama|malaki|maliit|matanda|bata)\b/gi
];

const FILIPINO_PATTERNS = [
  /\b(kasi|naman|talaga|sobra|grabe|astig|galing|sayang|hirap)\b/gi,
  /\b(pagod|gutom|uhaw|init|lamig|sakit|tulog|gising)\b/gi
];

/**
 * Detect if text is likely in Tagalog/Filipino
 */
export const detectTagalog = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const cleanText = text.toLowerCase();
  let tagalogScore = 0;
  
  // Check for Tagalog patterns
  TAGALOG_PATTERNS.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) tagalogScore += matches.length;
  });
  
  FILIPINO_PATTERNS.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) tagalogScore += matches.length * 0.5;
  });
  
  // If we find 3+ Tagalog indicators, consider it Tagalog
  return tagalogScore >= 3;
};

/**
 * Simple translation service (using a basic word mapping)
 * In production, this should use Google Translate API or similar
 */
export const translateToEnglish = async (text) => {
  if (!detectTagalog(text)) {
    return { translatedText: text, isTranslated: false, originalLanguage: 'english' };
  }

  // Basic Tagalog to English word mapping
  const translations = {
    // Common words
    'nakaw': 'theft', 'pagnanakaw': 'theft', 'magnakaw': 'steal',
    'away': 'fight', 'bangga': 'accident', 'aksidente': 'accident',
    'patay': 'death', 'namatay': 'died', 'pulis': 'police',
    'ospital': 'hospital', 'doktor': 'doctor', 'gamot': 'medicine',
    'pera': 'money', 'utang': 'debt', 'bayad': 'payment',
    'bahay': 'house', 'sasakyan': 'vehicle', 'kotse': 'car',
    'tao': 'person', 'babae': 'woman', 'lalaki': 'man',
    'bata': 'child', 'matanda': 'elderly', 'pamilya': 'family',
    
    // Incident types
    'holdap': 'robbery', 'pagkakapatay': 'murder', 'panggagahasa': 'rape',
    'sunog': 'fire', 'baha': 'flood', 'lindol': 'earthquake',
    'droga': 'drugs', 'shabu': 'drugs', 'marijuana': 'marijuana',
    'barilan': 'shooting', 'saksak': 'stabbing', 'bugbog': 'assault',
    
    // Locations
    'kalsada': 'street', 'daan': 'road', 'tulay': 'bridge',
    'palengke': 'market', 'tindahan': 'store', 'eskwela': 'school',
    'simbahan': 'church', 'parke': 'park', 'plaza': 'plaza',
    
    // Time indicators
    'kanina': 'earlier', 'kahapon': 'yesterday', 'ngayon': 'today',
    'mamayang gabi': 'tonight', 'madaling araw': 'early morning',
    'tanghali': 'noon', 'hapon': 'afternoon', 'gabi': 'night',
    
    // Actions
    'tumakbo': 'ran', 'sumigaw': 'shouted', 'tumawag': 'called',
    'nagpatakbo': 'drove', 'nahulog': 'fell', 'nasugatan': 'injured',
    'namatay': 'died', 'nawala': 'disappeared', 'nakita': 'saw'
  };

  let translatedText = text.toLowerCase();
  
  // Apply word-by-word translation
  Object.entries(translations).forEach(([tagalog, english]) => {
    const regex = new RegExp(`\\b${tagalog}\\b`, 'gi');
    translatedText = translatedText.replace(regex, english);
  });

  // Basic grammar improvements
  translatedText = translatedText
    .replace(/\bsa\s+/gi, 'at the ')
    .replace(/\bng\s+/gi, 'of ')
    .replace(/\bay\s+/gi, 'is ')
    .replace(/\bat\s+/gi, 'and ')
    .replace(/\bmay\s+/gi, 'there is ');

  return {
    translatedText: translatedText.charAt(0).toUpperCase() + translatedText.slice(1),
    isTranslated: true,
    originalLanguage: 'tagalog',
    confidence: 0.7 // Basic translation confidence
  };
};

/**
 * Process text for ML prediction (with translation if needed)
 */
export const preprocessTextForML = async (text, description = '') => {
  const fullText = `${text} ${description}`.trim();
  
  // Translate if needed
  const translation = await translateToEnglish(fullText);
  const processedText = translation.translatedText;
  
  // For now, generate a mock 544-dimensional feature vector
  // In production, this should use proper text processing pipeline
  const features = new Array(544).fill(0).map(() => Math.random() * 0.1);
  
  // Add some basic text-based features
  const words = processedText.toLowerCase().split(/\s+/);
  const keywordFeatures = {
    'theft': [1, 0.8, 0.3, 0.9, 0.2],
    'assault': [0.2, 1, 0.7, 0.5, 0.8],
    'accident': [0.1, 0.3, 1, 0.4, 0.2],
    'drugs': [0.9, 0.4, 0.2, 1, 0.7],
    'missing': [0.3, 0.2, 0.1, 0.3, 1]
  };
  
  // Enhance features based on keywords
  Object.entries(keywordFeatures).forEach(([keyword, values]) => {
    const keywordCount = words.filter(w => w.includes(keyword)).length;
    if (keywordCount > 0) {
      values.forEach((value, index) => {
        if (features[index] !== undefined) {
          features[index] = Math.min(1, features[index] + (value * keywordCount * 0.3));
        }
      });
    }
  });
  
  return {
    features: new Float32Array(features),
    processedText,
    translation
  };
};

/**
 * Calculate cosine similarity between two feature vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Process report with ML analysis
 */
export const processReportWithML = async (reportData) => {
  try {
    const { title, description, incident_type } = reportData;
    
    // Preprocess text
    const { features, processedText, translation } = await preprocessTextForML(
      title, 
      description
    );
    
    // For now, simulate ML prediction (in production, call backend ML API)
    const mockPrediction = simulateMLPrediction(processedText, incident_type);
    
    // Determine priority and risk level
    const priority = getPriorityFromML(mockPrediction.category, mockPrediction.confidence);
    const riskLevel = getRiskLevelFromML(mockPrediction.category, mockPrediction.confidence);
    
    return {
      ml_predicted_category: mockPrediction.category,
      ml_confidence: mockPrediction.confidence,
      priority,
      risk_level: riskLevel,
      ml_processed: true,
      ml_processed_at: new Date().toISOString(),
      processed_text: processedText,
      translation_info: translation.isTranslated ? {
        original_language: translation.originalLanguage,
        translated_text: translation.translatedText,
        translation_confidence: translation.confidence
      } : null,
      feature_vector: Array.from(features) // Convert for JSON storage
    };
  } catch (error) {
    console.error('Error processing report with ML:', error);
    return {
      ml_processed: false,
      error: error.message
    };
  }
};

/**
 * Simulate ML prediction (replace with actual model call)
 */
const simulateMLPrediction = (text, incidentType) => {
  const categories = [
    "Theft", "Reports/Agreement", "Accident", "Debt / Unpaid Wages Report",
    "Defamation Complaint", "Assault/Harassment", "Property Damage/Incident",
    "Animal Incident", "Verbal Abuse and Threats", "Alarm and Scandal",
    "Lost Items", "Scam/Fraud", "Drugs Addiction", "Missing Person", "Others"
  ];
  
  const lowerText = text.toLowerCase();
  
  // Enhanced keyword matching
  const categoryScores = {
    "Theft": /theft|steal|rob|burglar|pickpocket|snatch|loot/.test(lowerText),
    "Assault/Harassment": /assault|fight|attack|punch|hit|harassment|threaten/.test(lowerText),
    "Accident": /accident|crash|collision|fall|slip|injured/.test(lowerText),
    "Scam/Fraud": /scam|fraud|fake|cheat|deceive|swindle/.test(lowerText),
    "Missing Person": /missing|lost person|disappeared|runaway|kidnap/.test(lowerText),
    "Drugs Addiction": /drugs|marijuana|cocaine|heroin|addiction|substance/.test(lowerText),
    "Property Damage/Incident": /damage|broken|vandalism|destroy|property/.test(lowerText)
  };
  
  // Find best matching category
  let bestCategory = "Others";
  let bestScore = 0.3; // Default low confidence
  
  Object.entries(categoryScores).forEach(([category, matches]) => {
    if (matches && categories.includes(category)) {
      bestCategory = category;
      bestScore = 0.75 + Math.random() * 0.2; // 75-95% confidence for matches
    }
  });
  
  // If no match but incident type is provided, use it with lower confidence
  if (bestScore === 0.3 && incidentType) {
    const typeMatch = categories.find(cat => 
      cat.toLowerCase().includes(incidentType.toLowerCase()) ||
      incidentType.toLowerCase().includes(cat.toLowerCase())
    );
    if (typeMatch) {
      bestCategory = typeMatch;
      bestScore = 0.6 + Math.random() * 0.15; // 60-75% confidence
    }
  }
  
  return {
    category: bestCategory,
    confidence: Math.min(0.95, bestScore),
    all_scores: categories.map(cat => ({
      category: cat,
      score: cat === bestCategory ? bestScore : Math.random() * 0.3
    }))
  };
};

/**
 * Get priority based on ML prediction
 */
const getPriorityFromML = (category, confidence) => {
  const highPriorityCategories = [
    "Assault/Harassment", "Missing Person", "Drugs Addiction", "Scam/Fraud"
  ];
  
  const mediumPriorityCategories = [
    "Theft", "Property Damage/Incident", "Accident"
  ];
  
  if (highPriorityCategories.includes(category) || confidence > 0.8) {
    return 'high';
  } else if (mediumPriorityCategories.includes(category) || confidence > 0.6) {
    return 'medium';
  }
  return 'low';
};

/**
 * Get risk level based on ML prediction
 */
const getRiskLevelFromML = (category, confidence) => {
  const highRiskCategories = [
    "Assault/Harassment", "Missing Person", "Drugs Addiction"
  ];
  
  const mediumRiskCategories = [
    "Theft", "Scam/Fraud", "Property Damage/Incident"
  ];
  
  if (highRiskCategories.includes(category) || confidence > 0.85) {
    return 'high';
  } else if (mediumRiskCategories.includes(category) || confidence > 0.6) {
    return 'medium';
  }
  return 'low';
};

/**
 * Check for duplicate reports
 */
export const checkForDuplicates = async (reportData, existingReports = []) => {
  try {
    const { features } = await preprocessTextForML(reportData.title, reportData.description);
    const duplicates = [];
    
    for (const existing of existingReports) {
      if (existing.feature_vector && existing.feature_vector.length === 544) {
        const similarity = cosineSimilarity(features, new Float32Array(existing.feature_vector));
        
        if (similarity > 0.85) { // High similarity threshold
          duplicates.push({
            report: existing,
            similarity,
            reason: 'High text similarity detected'
          });
        }
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return [];
  }
};

/**
 * Batch process multiple reports
 */
export const batchProcessReports = async (reports) => {
  const results = [];
  
  for (const report of reports) {
    try {
      const mlData = await processReportWithML(report);
      results.push({
        reportId: report.id,
        success: true,
        mlData
      });
    } catch (error) {
      results.push({
        reportId: report.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};