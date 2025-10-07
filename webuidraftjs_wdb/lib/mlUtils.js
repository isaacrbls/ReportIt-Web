/**
 * Utility functions for ML-based features in the dashboard
 */

/**
 * Get risk level based on ML predicted category and confidence
 */
export const getRiskLevel = (category, confidence = 0.5) => {
  const highRiskCategories = [
    'Theft', 'Assault/Harassment', 'Scam/Fraud', 
    'Missing Person', 'Drugs Addiction'
  ];
  
  const mediumRiskCategories = [
    'Property Damage/Incident', 'Verbal Abuse and Threats',
    'Alarm and Scandal'
  ];

  if (highRiskCategories.includes(category) || confidence > 0.8) {
    return 'high';
  } else if (mediumRiskCategories.includes(category) || confidence > 0.6) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Get risk badge component with appropriate styling
 */
export const getRiskBadge = (riskLevel) => {
  // Normalize the risk level to lowercase for consistent matching
  const normalizedRiskLevel = (riskLevel || 'low').toString().toLowerCase();
  
  const styles = {
    high: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'High Risk'
    },
    medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Medium Risk'
    },
    low: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Low Risk'
    }
  };

  return styles[normalizedRiskLevel] || styles.low;
};

/**
 * Get confidence badge styling based on ML confidence score
 */
export const getConfidenceBadge = (confidence) => {
  if (confidence >= 0.8) {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: `${(confidence * 100).toFixed(1)}% Confidence`,
      level: 'high'
    };
  } else if (confidence >= 0.6) {
    return {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      label: `${(confidence * 100).toFixed(1)}% Confidence`,
      level: 'medium'
    };
  } else {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: `${(confidence * 100).toFixed(1)}% Confidence`,
      level: 'low'
    };
  }
};

/**
 * Get priority level based on risk and confidence
 */
export const getPriorityLevel = (riskLevel, confidence) => {
  if (riskLevel === 'high' || confidence > 0.8) {
    return 'high';
  } else if (riskLevel === 'medium' || confidence > 0.6) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Get priority badge styling
 */
export const getPriorityBadge = (priority) => {
  // Normalize the priority to lowercase for consistent matching
  const normalizedPriority = (priority || 'medium').toString().toLowerCase();
  
  const styles = {
    high: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      label: 'High Priority',
      icon: '🔴'
    },
    medium: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      label: 'Medium Priority',
      icon: '🟡'
    },
    low: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      label: 'Low Priority',
      icon: '🟢'
    }
  };

  return styles[normalizedPriority] || styles.medium;
};

/**
 * Generate mock ML data for reports that don't have ML processing yet
 * This simulates what would come from the ML model
 */
export const generateMockMLData = (incidentType, description = '') => {
  // Simulate ML prediction based on incident type
  const categoryMap = {
    'theft': { category: 'Theft', confidence: 0.85 },
    'assault': { category: 'Assault/Harassment', confidence: 0.78 },
    'property': { category: 'Property Damage/Incident', confidence: 0.72 },
    'scam': { category: 'Scam/Fraud', confidence: 0.88 },
    'missing': { category: 'Missing Person', confidence: 0.92 },
    'accident': { category: 'Accident', confidence: 0.68 }
  };

  // Find best match or use default
  const lowerType = incidentType.toLowerCase();
  let mlData = { category: 'Others', confidence: 0.45 };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerType.includes(key)) {
      mlData = value;
      break;
    }
  }

  // Add some randomness to confidence (±0.15) for more realistic decimal values
  mlData.confidence = Math.max(0.1, Math.min(0.95, 
    mlData.confidence + (Math.random() - 0.5) * 0.3
  ));

  return {
    ml_predicted_category: mlData.category,
    ml_confidence: mlData.confidence,
    ml_processed: true,
    risk_level: getRiskLevel(mlData.category, mlData.confidence),
    priority: getPriorityLevel(getRiskLevel(mlData.category, mlData.confidence), mlData.confidence)
  };
};