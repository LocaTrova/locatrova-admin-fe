import React from 'react';

interface ContactsModalProps {
  location: unknown;
  contacts: unknown[]; 
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
          {contacts.map((contactObj, index) => {
            // Extract the contact data based on the API response structure
            const contactData = contactObj.contacts || contactObj;
            
            if (!contactData || typeof contactData !== 'object') {
              console.error('Invalid contact structure at index', index, contactObj);
              return null;
            }
            
            return (
              <div key={contactData._id || `contact-${index}`} className="contact-card">
                <h3>{contactData.name || 'Unnamed Contact'}</h3>
                <p><strong>Role:</strong> {contactData.role || 'N/A'}</p>
                <p><strong>Phone:</strong> {contactData.tel || 'N/A'}</p>
                <p><strong>Email:</strong> {contactData.email || 'N/A'}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-contacts">No contacts available for this location.</p>
      )}
    </div>
  );
};

export default ContactsModal; 