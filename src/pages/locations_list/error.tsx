import React from 'react';
import { useNavigate } from 'react-router-dom';
import './error.css';

const LocationsError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="error-container">
      <h1>Errore</h1>
      <p>Si è verificato un errore nel caricamento delle locations.</p>
      <div className="error-actions">
        <button onClick={() => navigate('/')}>Torna alla Home</button>
        <button onClick={() => window.location.reload()}>Riprova</button>
      </div>
    </div>
  );
};

export default LocationsError;
