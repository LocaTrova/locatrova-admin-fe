import React from 'react';

interface CapacityFilterProps {
  capacity: number | '';
  onChange: (capacity: number | '') => void;
}

const CapacityFilter: React.FC<CapacityFilterProps> = ({ capacity, onChange }) => {
  return (
    <div className="filter-item">
      <label className="filter-label">Minimum Capacity</label>
      <input 
        type="number" 
        className="filter-input" 
        value={capacity}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
        min="0"
      />
    </div>
  );
};

export default CapacityFilter; 