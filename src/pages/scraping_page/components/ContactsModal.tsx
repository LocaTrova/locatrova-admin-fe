import React from 'react';
import { Contact } from './types';

interface ContactsModalProps {
  location: { name?: string } | string;
  contacts: Contact[]; 
}

const ContactsModal: React.FC<ContactsModalProps> = ({ location, contacts }) => {
  // Get the location name, handling different possible structures
  const locationName = typeof location === 'object' && location !== null 
    ? (location.name || 'Unknown Location') 
    : (location || 'Unknown Location');

  console.log('Contacts in modal:', contacts);
  console.log('Location in modal:', location);

  // Check if we have valid contacts data
  const hasValidContacts = Array.isArray(contacts) && contacts.length > 0;

  return (
    <div className="modal-contacts">
      <h2>Contacts for {locationName}</h2>
      
      {hasValidContacts ? (
        <div className="contacts-list">
          {contacts.map((contact, index) => (
              <div key={contact._id || `contact-${index}`} className="contact-card">
                <h3>{contact.name || 'Unnamed Contact'}</h3>
                <p><strong>Role:</strong> {contact.role || 'N/A'}</p>
                <p><strong>Phone:</strong> {contact.tel || 'N/A'}</p>
                <p><strong>Email:</strong> {contact.email || 'N/A'}</p>
              </div>
            ))}
        </div>
      ) : (
        <p className="no-contacts">No contacts available for this location.</p>
      )}
    </div>
  );
};

export default ContactsModal; 