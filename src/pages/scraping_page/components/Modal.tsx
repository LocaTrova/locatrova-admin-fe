import React, { useEffect, useState } from 'react';
import { ModalType, Location, Contact } from './types';
import LocationModal from './LocationModal';
import ContactsModal from './ContactsModal';
import { getContactsByRoomId, getLocationByRoomId } from '../../../api/scraping/api';

// Extended Location type matching what LocationModal expects
interface EnrichedLocation extends Location {
  venueType?: { _id: string; name: string };
  eventTypes?: { _id: string; name: string }[];
  rooms?: Array<{
    _id: string;
    name: string;
    maxCapacity: number;
    mt2: number;
    locationId: string;
    serviceIds: string[];
    serviceDetails?: Array<{ _id: string; name: string }>;
  }>;
  services?: Array<{ _id: string; name: string }>;
  contacts?: Contact[];
}

interface ModalProps {
  isOpen: boolean;
  modalType: ModalType;
  roomId: string | null;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, modalType, roomId, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [location, setLocation] = useState<EnrichedLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModalData = async () => {
      if (!isOpen || !roomId) return;
      
      setLoading(true);
      setError(null);
      
      try {        
        // For location modal, fetch location separately
        if (modalType === 'location') {
          const locationData = await getLocationByRoomId(roomId);
          console.log('Location data:', locationData);
          setLocation(locationData as unknown as EnrichedLocation);
        }
        
        // For contacts modal, fetch contacts and location
        if (modalType === 'contacts') {
          const contactsData = await getContactsByRoomId(roomId);
          console.log('Contacts data:', contactsData);
          
          // Check the structure of the contacts data
          if (Array.isArray(contactsData) && contactsData.length > 0) {
            setContacts(contactsData);
          } else {
            console.warn('No contacts data found or invalid format:', contactsData);
            setContacts([]);
          }
        }
      } catch (err) {
        console.error('Error fetching modal data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModalData();
  }, [isOpen, modalType, roomId]);
  
  if (!isOpen || !roomId) return null;
  
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close-button" onClick={onClose}>×</button>
          <div className="loading-container">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close-button" onClick={onClose}>×</button>
          <div className="error-container">{error}</div>
        </div>
      </div>
    );
  }
  
  // Only show content if data is available
  const showContent = () => {
  
    switch (modalType) {
      case "location":
        return location ? (
          <LocationModal 
            location={location} 
          />
        ) : (
          <div className="error-container">Location data not available</div>
        );
      case "contacts":
        return (
          <ContactsModal 
            location={location || { name: "Unknown Location" }}
            contacts={contacts} 
          />
        );
      default:
        return <div className="error-container">Unknown modal type</div>;
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>
        {showContent()}
      </div>
    </div>
  );
};

export default Modal; 