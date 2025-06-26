import { FC, useState, useEffect } from 'react';
import { getUsersWithFilters } from '../../../api/users/api';
import { inputStyle } from '../styles';

interface User {
  _id: string;
  name: string;
  surname: string;
}

interface UserSelectProps {
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
}

export const UserSelect: FC<UserSelectProps> = ({ selectedUserId, onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const result = await getUsersWithFilters({ search: searchTerm });
        setUsers(Array.isArray(result?.users) ? result.users : []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cerca utente..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={() => window.location.href = '/users/create'}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Nuovo Utente
        </button>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Cognome</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Selezione</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                  Caricamento...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map(user => (
                <tr 
                  key={user._id}
                  onClick={() => onUserSelect(user._id)}
                  style={{ 
                    cursor: 'pointer',
                    background: selectedUserId === user._id ? '#e3f2fd' : 'white'
                  }}
                >
                  <td style={{ padding: '8px' }}>{user.name}</td>
                  <td style={{ padding: '8px' }}>{user.surname}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                      type="radio"
                      checked={selectedUserId === user._id}
                      onChange={() => onUserSelect(user._id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                  {searchTerm ? 'Nessun utente trovato' : 'Inizia a cercare un utente'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 