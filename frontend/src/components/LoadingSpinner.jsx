import React from 'react';
import { Spinner } from 'react-bootstrap';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * Displays a centered loading spinner with optional message
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <Spinner animation="border" role="status" className="spinner">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

