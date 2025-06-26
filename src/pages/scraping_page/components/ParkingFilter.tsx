import React from 'react';

interface ParkingFilterProps {
  requiresParking: boolean;
  onChange: (requiresParking: boolean) => void;
}

const ParkingFilter: React.FC<ParkingFilterProps> = ({ requiresParking, onChange }) => {
  return (
    <div className="filter-item">
      <label className="filter-label">Parking Required</label>
      <div className="filter-checkbox-container">
        <input 
          type="checkbox" 
          className="filter-checkbox" 
          checked={requiresParking}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>Yes</span>
      </div>
    </div>
  );
};

export default ParkingFilter; 