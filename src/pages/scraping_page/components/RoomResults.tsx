import React from 'react';
import { Room } from './types';
import RoomCard from './RoomCard';

interface RoomResultsProps {
  rooms: Room[];
  onShowLocation: (roomId: string) => void;
  onShowContacts: (roomId: string) => void;
}

const RoomResults: React.FC<RoomResultsProps> = ({ 
  rooms,  
  onShowLocation, 
  onShowContacts 
}) => {
  return (
    <div>
      <h2 className="results-title">
        Results <span className="results-count">{rooms.length}</span>
      </h2>
      <div className="rooms-grid">
        {rooms.map(room => (
          <RoomCard 
            key={room._id}
            room={room}
            onShowLocation={onShowLocation}
            onShowContacts={onShowContacts}
          />
        ))}
        
        {rooms.length === 0 && (
          <p className="no-results">No rooms found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default RoomResults; 