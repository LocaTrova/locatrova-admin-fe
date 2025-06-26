import React, { useState } from 'react';
import { Room } from './types';

interface RoomCardProps {
  room: Room;
  onShowLocation: (roomId: string) => void;
  onShowContacts: (roomId: string) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  onShowLocation, 
  onShowContacts 
}) => {
  const [roomServicesExpanded, setRoomServicesExpanded] = useState(false);
  const [locationServicesExpanded, setLocationServicesExpanded] = useState(false);
  const [eventTypesExpanded, setEventTypesExpanded] = useState(false);
  
  return (
    <div className="room-card">
      <div className="room-card-body">
        <h3 className="room-title">{room.name}</h3>
        <p className="room-info"><strong>Location:</strong> {room.location?.name || 'Unknown'}</p>
        <p className="room-info">
          <strong>City:</strong> {room.location?.city ? room.location.city.charAt(0).toUpperCase() + room.location.city.slice(1) : 'Unknown'}
        </p>
        <p className="room-info"><strong>Capacity:</strong> {room.maxCapacity} people</p>
        <p className="room-info"><strong>Area:</strong> {room.mt2} m²</p>
        <p className="room-info"><strong>Venue Type:</strong> {room.venueType?.name || 'Unknown'}</p>
        <p className="room-info"><strong>Parking:</strong> {room.location?.parkingInfo ? 'Yes' : 'No'}</p>
        
        {/* Room Services */}
        {room.services && room.services.length > 0 && (
          <div>
            <p className="room-services-title">Room Services:</p>
            <div className="expandable-list-container">
              <div className={`room-services-list ${roomServicesExpanded ? 'expanded' : 'collapsed'}`}>
                {room.services.map(service => (
                  <span key={service._id} className="room-service-tag">{service.name}</span>
                ))}
              </div>
              
              {!roomServicesExpanded && room.services.length > 3 && (
                <div className="list-fade-gradient"></div>
              )}
              
              {room.services.length > 3 && (
                <button 
                  className="toggle-list-button" 
                  onClick={() => setRoomServicesExpanded(!roomServicesExpanded)}
                >
                  {roomServicesExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Location Services */}
        {room.locationServices && room.locationServices.length > 0 && (
          <div>
            <p className="room-services-title">Location Services:</p>
            <div className="expandable-list-container">
              <div className={`room-services-list ${locationServicesExpanded ? 'expanded' : 'collapsed'}`}>
                {room.locationServices.map(service => (
                  <span key={service._id} className="room-service-tag">{service.name}</span>
                ))}
              </div>
              
              {!locationServicesExpanded && room.locationServices.length > 3 && (
                <div className="list-fade-gradient"></div>
              )}
              
              {room.locationServices.length > 3 && (
                <button 
                  className="toggle-list-button" 
                  onClick={() => setLocationServicesExpanded(!locationServicesExpanded)}
                >
                  {locationServicesExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Event Types */}
        {room.eventTypes && room.eventTypes.length > 0 && (
          <div>
            <p className="room-services-title">Event Types:</p>
            <div className="expandable-list-container">
              <div className={`room-services-list ${eventTypesExpanded ? 'expanded' : 'collapsed'}`}>
                {room.eventTypes.map((eventType, index) => (
                  <span key={index} className="room-service-tag">{eventType.name}</span>
                ))}
              </div>
              
              {!eventTypesExpanded && room.eventTypes.length > 3 && (
                <div className="list-fade-gradient"></div>
              )}
              
              {room.eventTypes.length > 3 && (
                <button 
                  className="toggle-list-button" 
                  onClick={() => setEventTypesExpanded(!eventTypesExpanded)}
                >
                  {eventTypesExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Buttons for modal actions */}
        <div className="room-action-buttons">
          <button 
            className="action-button location-button"
            onClick={() => onShowLocation(room._id)}
          >
            Show Location
          </button>
          <button 
            className="action-button contacts-button"
            onClick={() => onShowContacts(room._id)}
          >
            Show Contacts
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard; 