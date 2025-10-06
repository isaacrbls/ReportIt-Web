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
def preprocess_text_for_prediction(text):
    """
    Placeholder for text preprocessing function
    
    This function should be implemented based on how your model was trained.
    It might include steps like:
    - Text cleaning
    - Tokenization
    - Feature extraction (TF-IDF, word embeddings, etc.)
    - Converting to the 544-feature vector expected by the model
    
    Args:
        text (str): Raw incident report text
        
    Returns:
        numpy.ndarray: 544-feature vector ready for model input
        
    Note: This is a placeholder - you'll need to implement the actual
    preprocessing pipeline used when training your model.
    """
    # TODO: Implement actual text preprocessing pipeline
    # For now, return a dummy feature vector
    import warnings
    warnings.warn(
        "preprocess_text_for_prediction is not yet implemented. "
        "Please implement the actual text preprocessing pipeline."
    )
    return np.zeros((544,), dtype=np.float32)


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