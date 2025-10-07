import os
import numpy as np
from pathlib import Path

try:
    import tflite_runtime.interpreter as tflite
    TFLITE_AVAILABLE = True
except ImportError:
    try:
        import tensorflow as tf
        tflite = tf.lite
        TFLITE_AVAILABLE = True
    except ImportError:
        TFLITE_AVAILABLE = False
        print("Warning: Neither tflite-runtime nor tensorflow is installed. ML functionality will be disabled.")


class MLModelManager:
    """Manager class for handling TensorFlow Lite model operations"""
    
    # Define the 15 incident categories that the model can predict
    INCIDENT_CATEGORIES = [
        "Theft",
        "Reports/Agreement", 
        "Accident",
        "Debt / Unpaid Wages Report",
        "Defamation Complaint",
        "Assault/Harassment",
        "Property Damage/Incident",
        "Animal Incident",
        "Verbal Abuse and Threats",
        "Alarm and Scandal",
        "Lost Items",
        "Scam/Fraud",
        "Drugs Addiction",
        "Missing Person",
        "Others"
    ]
    
    def __init__(self):
        self.model = None
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        self.model_loaded = False
        
        # Get the path to the model file
        self.model_path = Path(__file__).parent / 'best_model.tflite'
        
        # Load the model on initialization
        if TFLITE_AVAILABLE:
            self.load_model()
    
    def load_model(self):
        """Load the TensorFlow Lite model"""
        try:
            if not self.model_path.exists():
                print(f"Model file not found at: {self.model_path}")
                return False
            
            # Create interpreter
            self.interpreter = tflite.Interpreter(model_path=str(self.model_path))
            self.interpreter.allocate_tensors()
            
            # Get input and output details
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            
            self.model_loaded = True
            print(f"Model loaded successfully from: {self.model_path}")
            print(f"Input shape: {self.input_details[0]['shape']}")
            print(f"Output shape: {self.output_details[0]['shape']}")
            
            return True
            
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model_loaded = False
            return False
    
    def get_model_info(self):
        """Get information about the loaded model"""
        if not self.model_loaded:
            return {"error": "Model not loaded"}
        
        return {
            "model_path": str(self.model_path),
            "input_details": self.input_details,
            "output_details": self.output_details,
            "input_shape": self.input_details[0]['shape'].tolist(),
            "output_shape": self.output_details[0]['shape'].tolist(),
            "input_dtype": str(self.input_details[0]['dtype']),
            "output_dtype": str(self.output_details[0]['dtype'])
        }
    
    def predict(self, input_data):
        """Make predictions using the loaded model"""
        if not self.model_loaded:
            raise ValueError("Model not loaded. Cannot make predictions.")
        
        try:
            # Convert input data to numpy array if needed
            if not isinstance(input_data, np.ndarray):
                input_data = np.array(input_data)
            
            # Ensure input data matches expected shape and dtype
            expected_shape = self.input_details[0]['shape']
            expected_dtype = self.input_details[0]['dtype']
            
            # Reshape if needed (handle batch dimension)
            if len(input_data.shape) == len(expected_shape) - 1:
                input_data = np.expand_dims(input_data, axis=0)
            
            # Convert dtype if needed
            input_data = input_data.astype(expected_dtype)
            
            # Set input tensor
            self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
            
            # Run inference
            self.interpreter.invoke()
            
            # Get output
            output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            return output_data
            
        except Exception as e:
            raise ValueError(f"Error during prediction: {e}")
    
    def predict_incident_category(self, input_data, return_probabilities=False):
        """
        Predict incident category with human-readable output
        
        Args:
            input_data: Input features (544 features expected)
            return_probabilities: If True, returns all probabilities for each category
            
        Returns:
            dict: Contains predicted category, confidence, and optionally all probabilities
        """
        if not self.model_loaded:
            raise ValueError("Model not loaded. Cannot make predictions.")
        
        # Get raw predictions
        raw_output = self.predict(input_data)
        
        # Apply softmax to get probabilities
        probabilities = self._softmax(raw_output[0])
        
        # Get predicted class index
        predicted_index = np.argmax(probabilities)
        predicted_category = self.INCIDENT_CATEGORIES[predicted_index]
        confidence = probabilities[predicted_index]
        
        result = {
            'predicted_category': predicted_category,
            'predicted_index': int(predicted_index),
            'confidence': float(confidence),
            'confidence_percentage': f"{confidence * 100:.2f}%"
        }
        
        if return_probabilities:
            result['all_probabilities'] = {
                category: float(prob) 
                for category, prob in zip(self.INCIDENT_CATEGORIES, probabilities)
            }
            # Sort by probability for easier reading
            result['top_5_predictions'] = sorted(
                [(cat, float(prob)) for cat, prob in zip(self.INCIDENT_CATEGORIES, probabilities)],
                key=lambda x: x[1], 
                reverse=True
            )[:5]
        
        return result
    
    def _softmax(self, x):
        """Apply softmax activation function"""
        exp_x = np.exp(x - np.max(x))  # Subtract max for numerical stability
        return exp_x / np.sum(exp_x)
    
    def get_categories_list(self):
        """Get the list of all possible incident categories"""
        return self.INCIDENT_CATEGORIES.copy()
    
    def is_ready(self):
        """Check if the model is loaded and ready for predictions"""
        return self.model_loaded and TFLITE_AVAILABLE


# Global model manager instance
ml_model = MLModelManager()


def get_model_manager():
    """Get the global model manager instance"""
    return ml_model


def make_prediction(input_data):
    """Convenience function to make predictions (returns raw output)"""
    return ml_model.predict(input_data)


def predict_incident_category(input_data, return_probabilities=False):
    """
    Convenience function to predict incident category with human-readable output
    
    Args:
        input_data: Input features (544 features expected)
        return_probabilities: If True, returns all probabilities for each category
        
    Returns:
        dict: Contains predicted category, confidence, and optionally all probabilities
    """
    return ml_model.predict_incident_category(input_data, return_probabilities)


def get_incident_categories():
    """Get list of all possible incident categories"""
    return ml_model.get_categories_list()


def get_model_status():
    """Get the current status of the ML model"""
    return {
        "tflite_available": TFLITE_AVAILABLE,
        "model_loaded": ml_model.model_loaded,
        "model_ready": ml_model.is_ready(),
        "model_info": ml_model.get_model_info() if ml_model.model_loaded else None,
        "categories_count": len(ml_model.INCIDENT_CATEGORIES),
        "categories": ml_model.get_categories_list()
    }


# Text preprocessing utilities for incident reports
def extract_text_features(title, description, incident_type, translated_text):
    """
    Extract meaningful features from incident report text
    
    This function converts text into a 544-dimensional feature vector using:
    - TF-IDF like features
    - Text statistics
    - Keyword presence
    - Language patterns
    - Incident type encoding
    
    Args:
        title (str): Report title
        description (str): Report description
        incident_type (str): Type of incident
        translated_text (str): Translated text content
        
    Returns:
        np.ndarray: 544-dimensional feature vector
    """
    import re
    from collections import Counter
    
    # Combine all text sources
    combined_text = f"{title} {description} {translated_text}".lower().strip()
    
    # Initialize feature vector
    features = np.zeros(544, dtype=np.float32)
    
    # 1. Basic text statistics (features 0-19)
    features[0] = len(combined_text)  # Total character count
    features[1] = len(combined_text.split())  # Word count
    features[2] = len(set(combined_text.split()))  # Unique word count
    features[3] = combined_text.count('.')  # Sentence count (approx)
    features[4] = combined_text.count('!')  # Exclamation count
    features[5] = combined_text.count('?')  # Question count
    features[6] = sum(1 for c in combined_text if c.isupper()) / max(len(combined_text), 1)  # Uppercase ratio
    features[7] = sum(1 for c in combined_text if c.isdigit()) / max(len(combined_text), 1)  # Digit ratio
    features[8] = len(title.split()) if title else 0  # Title word count
    features[9] = len(description.split()) if description else 0  # Description word count
    
    # 2. Incident type one-hot encoding (features 20-34) - 15 categories
    incident_categories = [
        "theft", "reports/agreement", "accident", "debt / unpaid wages report",
        "defamation complaint", "assault/harassment", "property damage/incident",
        "animal incident", "verbal abuse and threats", "alarm and scandal",
        "lost items", "scam/fraud", "drugs addiction", "missing person", "others"
    ]
    
    incident_lower = incident_type.lower() if incident_type else "others"
    for i, category in enumerate(incident_categories):
        if category in incident_lower or incident_lower in category:
            features[20 + i] = 1.0
            break
    else:
        features[34] = 1.0  # Others category
    
    # 3. Crime-related keywords (features 35-134) - 100 features
    crime_keywords = [
        # Violence keywords
        "nakaw", "ninakaw", "theft", "steal", "stolen", "rob", "robbery",
        "assault", "attack", "hit", "punch", "violence", "fight", "beat",
        
        # Drugs keywords  
        "drugs", "droga", "shabu", "marijuana", "cocaine", "addict", "pusher",
        "drug dealer", "substance", "illegal drugs", "narcotic",
        
        # Harassment keywords
        "harass", "harassment", "abuse", "threat", "threaten", "intimidate",
        "bully", "verbal abuse", "sexual harassment", "catcall",
        
        # Fraud keywords
        "scam", "fraud", "fake", "counterfeit", "forgery", "swindle", 
        "deceive", "cheat", "embezzle", "identity theft",
        
        # Missing person keywords
        "missing", "lost person", "disappear", "vanish", "abduct", "kidnap",
        "runaway", "last seen", "whereabouts unknown",
        
        # Property damage keywords
        "damage", "vandalism", "destroy", "break", "smash", "graffiti",
        "fire", "arson", "explosion", "sabotage",
        
        # Location keywords
        "street", "kalye", "road", "highway", "bridge", "park", "school",
        "hospital", "church", "market", "mall", "home", "house", "barangay",
        
        # Time keywords
        "morning", "afternoon", "evening", "night", "dawn", "midnight",
        "today", "yesterday", "last week", "umaga", "gabi", "tanghali",
        
        # Emergency keywords
        "emergency", "urgent", "help", "police", "ambulance", "fire truck",
        "rescue", "hospital", "clinic", "emergency room",
        
        # Emotional keywords
        "scared", "afraid", "worried", "angry", "upset", "traumatized",
        "shocked", "panic", "stress", "anxiety", "depression",
        
        # Action keywords
        "report", "complaint", "incident", "crime", "violation", "illegal",
        "witness", "suspect", "victim", "perpetrator", "evidence"
    ]
    
    # Count keyword occurrences (normalized)
    text_words = combined_text.split()
    word_count = len(text_words)
    
    for i, keyword in enumerate(crime_keywords[:100]):  # Limit to 100 keywords
        count = combined_text.count(keyword.lower())
        features[35 + i] = count / max(word_count, 1)  # Normalize by word count
    
    # 4. Character n-gram features (features 135-334) - 200 features
    # Extract character bigrams and trigrams
    clean_text = re.sub(r'[^a-zA-Z0-9\s]', '', combined_text)
    
    # Common character patterns in Filipino/English crime reports
    char_patterns = []
    for i in range(len(clean_text) - 1):
        char_patterns.append(clean_text[i:i+2])  # Bigrams
    
    for i in range(len(clean_text) - 2):
        char_patterns.append(clean_text[i:i+3])  # Trigrams
    
    # Get top character patterns
    pattern_counts = Counter(char_patterns) if char_patterns else Counter()
    top_patterns = pattern_counts.most_common(200)
    
    for i, (pattern, count) in enumerate(top_patterns):
        if i < 200:
            features[135 + i] = count / max(len(char_patterns), 1)
    
    # 5. Language-specific features (features 335-384) - 50 features
    tagalog_words = [
        "ako", "ikaw", "siya", "kami", "kayo", "sila", "ang", "ng", "sa", "si",
        "mga", "ay", "at", "na", "pa", "po", "opo", "hindi", "oo", "wala",
        "may", "meron", "kung", "kapag", "para", "dahil", "kasi", "pero",
        "nakita", "narinig", "nangyari", "ginawa", "sinabi", "pumunta",
        "dumating", "umalis", "kumuha", "binigay", "tinanong", "sumagot",
        "pera", "kotse", "bahay", "tao", "bata", "lalaki", "babae", "matanda",
        "gabi", "umaga", "hapon", "araw"
    ]
    
    for i, word in enumerate(tagalog_words[:50]):
        count = combined_text.count(word)
        features[335 + i] = count / max(word_count, 1)
    
    # Fill remaining features with meaningful text analysis
    # 6. Severity indicators (features 385-484)
    severity_words = ["urgent", "emergency", "serious", "critical", "help", "asap"]
    for i, word in enumerate(severity_words):
        if i + 385 < 544:
            features[385 + i] = combined_text.count(word) / max(word_count, 1)
    
    # 7. Statistical features (features 485-543)
    if word_count > 0:
        features[485] = len([w for w in text_words if len(w) > 6]) / word_count  # Long words ratio
        features[486] = len([w for w in text_words if len(w) <= 3]) / word_count  # Short words ratio
        features[487] = np.mean([len(w) for w in text_words]) if text_words else 0  # Average word length
    
    # Fill any remaining features with normalized text hash
    text_hash = abs(hash(combined_text)) % 100000
    for i in range(488, 544):
        features[i] = ((text_hash + i) % 1000) / 1000.0  # Normalized hash features
    
    return features.astype(np.float32)

def preprocess_text_for_prediction(text):
    """
    Legacy function for backward compatibility
    Converts single text input to feature vector
    """
    return extract_text_features(text, "", "", text)


def classify_incident_text(text, return_probabilities=False):
    """
    Complete pipeline: preprocess text and classify incident
    
    Args:
        text (str): Raw incident report text
        return_probabilities: If True, returns all probabilities
        
    Returns:
        dict: Classification results with category and confidence
    """
    # Preprocess text to feature vector
    features = preprocess_text_for_prediction(text)
    
    # Make prediction
    return predict_incident_category(features, return_probabilities)