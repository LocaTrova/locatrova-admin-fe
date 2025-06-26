import React, { useState } from 'react';
import { Location, Service, EventType, Contact, VenueType } from './types';

// Define additional interface for data not covered in the types file
interface ServiceDetail {
  _id: string;
  name: string;
}

interface Room {
  _id: string;
  name: string;
  maxCapacity: number;
  mt2: number;
  locationId: string;
  serviceIds: string[];
  serviceDetails?: ServiceDetail[];
}

// Extend the Location type to include the properties needed in this component
interface EnrichedLocation extends Location {
  venueType?: VenueType;
  eventTypes?: EventType[];
  rooms?: Room[];
  services?: Service[];
  contacts?: Contact[];
}

interface LocationModalProps {
  location: EnrichedLocation;
}

const LocationModal: React.FC<LocationModalProps> = ({ location }) => {
  const [eventTypesExpanded, setEventTypesExpanded] = useState(false);
  const [roomsExpanded, setRoomsExpanded] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [contactsExpanded, setContactsExpanded] = useState(false);

  return (
    <div className="modal-location">
      <h2>{location.name}</h2>
      <div className="modal-info-grid">
        <p><strong>ID:</strong> {location._id}</p>
        <p><strong>City:</strong> {location.city.charAt(0).toUpperCase() + location.city.slice(1)}</p>
        <p><strong>Address:</strong> {location.address || 'No address provided'}</p>
        <p><strong>Parking Info:</strong> {location.parkingInfo || "No parking available"}</p>
        
        {/* Venue Type */}
        {location.venueType && (
          <p><strong>Venue Type:</strong> {location.venueType.name}</p>
        )}
        
        {/* Event Types */}
        {location.eventTypes && location.eventTypes.length > 0 && (
          <div className="modal-event-types">
            <p><strong>Event Types:</strong></p>
            <div className="expandable-list-container">
              <div className={`modal-services-list ${eventTypesExpanded ? 'expanded' : 'collapsed'}`}>
                {location.eventTypes.map((eventType: EventType, index: number) => (
                  <span key={index} className="modal-service-tag">{eventType.name}</span>
                ))}
              </div>
              
              {!eventTypesExpanded && location.eventTypes.length > 3 && (
                <div className="list-fade-gradient"></div>
              )}
              
              {location.eventTypes.length > 3 && (
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
        
        {/* Rooms */}
        {location.rooms && location.rooms.length > 0 && (
          <div className="modal-rooms">
            <p><strong>Rooms:</strong></p>
            <div className="expandable-list-container">
              <div className={`modal-services-list ${roomsExpanded ? 'expanded' : 'collapsed'}`}>
                {location.rooms.map((room: Room, index: number) => (
                  <div key={index} className="modal-room-item">
                    <p><strong>{room.name}</strong> - {room.maxCapacity} capacity, {room.mt2} m²</p>
                    {room.serviceDetails && room.serviceDetails.length > 0 && (
                      <div className="room-service-details">
                        <small>Services: {room.serviceDetails.map(sd => sd.name).join(', ')}</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!roomsExpanded && location.rooms.length > 2 && (
                <div className="list-fade-gradient"></div>
              )}
              
              {location.rooms.length > 2 && (
                <button 
                  className="toggle-list-button" 
                  onClick={() => setRoomsExpanded(!roomsExpanded)}
                >
                  {roomsExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Services */}
        {location.services && location.services.length > 0 && (
          <div className="modal-services">
            <p><strong>Services:</strong></p>
            <div className="expandable-list-container">
              <div className={`modal-services-list ${servicesExpanded ? 'expanded' : 'collapsed'}`}>
                {location.services.map((service: Service, index: number) => (
                  <span key={index} className="modal-service-tag">{service.name}</span>
                ))}
              </div>
              
              {!servicesExpanded && location.services.length > 3 && (
                <div className="list-fade-gradient"></div>
              )}
              
              {location.services.length > 3 && (
                <button 
                  className="toggle-list-button" 
                  onClick={() => setServicesExpanded(!servicesExpanded)}
                >
                  {servicesExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Contacts */}
        {location.contacts && location.contacts.length > 0 && (
          <div className="modal-contacts">
            <p><strong>Contacts:</strong></p>
            <div className="expandable-list-container">
              <div className={`modal-services-list ${contactsExpanded ? 'expanded' : 'collapsed'}`}>
                {location.contacts.map((contact: Contact, index: number) => (
                  <span key={index} className="modal-service-tag">
                    {contact.name || `Contact ${index + 1}`}
                  </span>
                ))}
              </div>
              
              {!contactsExpanded && location.contacts.length > 3 && (
                <div className="list-fade-gradient"></div>
              )}
              
              {location.contacts.length > 3 && (
                <button 
                  className="toggle-list-button" 
                  onClick={() => setContactsExpanded(!contactsExpanded)}
                >
                  {contactsExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationModal; 