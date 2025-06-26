import { FC, useState } from 'react';
import { inputStyle, sectionStyle } from '../styles';
import { Room } from '../types';
import { handleImageRemoval, type ImageHandlerState } from '../utils';
import { UnavailableDates } from './UnavailableDates';

export const Rooms: FC = () => {
  const [rooms, setRooms] = useState<Room[]>([{
    roomId: 1,
    name: '',
    maxPeople: 0,
    pricePerHour: 0,
    squareMeters: 0,
    daily: null
  }]);

  const [roomImages, setRoomImages] = useState<{ [key: number]: ImageHandlerState }>({});

  const addRoom = () => {
    const newRoom = {
      roomId: rooms.length + 1,
      name: '',
      maxPeople: 0,
      pricePerHour: 0,
      squareMeters: 0,
      daily: null
    };
    setRooms([...rooms, newRoom]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length <= 1) {
      // Optionally show an error message or handle this case
      return;
    }
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const addDaily = (roomIndex: number) => {
    const updatedRooms = [...rooms];
    updatedRooms[roomIndex].daily = {
      price: 0,
      available: false,
      start: '',
      end: '',
      days: []
    };
    setRooms(updatedRooms);
  };

  const handleDailyDaysChange = (roomIndex: number, dayIndex: number, isChecked: boolean) => {
    const updatedRooms = [...rooms];

    if (!updatedRooms[roomIndex].daily) {
      return;
    }

    if (isChecked) {
      updatedRooms[roomIndex].daily.days?.push(dayIndex);
    } else {
      updatedRooms[roomIndex].daily.days = updatedRooms[roomIndex].daily.days?.filter(day => day !== dayIndex);
    }

    console.log(updatedRooms[roomIndex].daily.days);
    setRooms(updatedRooms);
  };


  const removeDaily = (roomIndex: number) => {
    const updatedRooms = [...rooms];
    updatedRooms[roomIndex].daily = null;
    setRooms(updatedRooms);
  };

  const handleImageChange = (roomId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (!newFiles) return;

    const filesArray = Array.from(newFiles);
    setRoomImages(prev => ({
      ...prev,
      [roomId]: {
        imagePreview: filesArray.map(file => URL.createObjectURL(file)),
        files: filesArray
      }
    }));
  };

  const removeRoomImage = (roomId: number, indexToRemove: number) => {
    handleImageRemoval(
      indexToRemove,
      roomImages[roomId],
      `rooms[${roomId}].images`,
      (newState) => {
        setRoomImages(prev => ({
          ...prev,
          [roomId]: newState
        }));
      }
    );
  };

  return (
    <div style={sectionStyle}>
      <h4>Stanze</h4>
      <button type="button" onClick={addRoom} style={{ marginBottom: '20px' }}>Aggiungi stanza</button>
      {rooms.map((room, index) => (
        <div key={room.roomId} style={{ marginBottom: '20px', border: '5px solid #ccc', padding: '10px', borderRadius: '4px', boxSizing: 'border-box' }}>
          <h5>Stanza {index + 1}</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              name={`rooms[${room.roomId}].name`}
              placeholder="Nome stanza"
              style={inputStyle}
              required
            />
            <input
              type="number"
              name={`rooms[${room.roomId}].maxPeople`}
              placeholder="Numero massimo di persone"
              style={inputStyle}
              required
            />
            <input
              type="number"
              name={`rooms[${room.roomId}].pricePerHour`}
              placeholder="Prezzo per ora"
              style={inputStyle}
              required
            />
            <input
              type="number"
              name={`rooms[${room.roomId}].squareMeters`}
              placeholder="Metri quadri"
              style={inputStyle}
              required
            />
            <div>
              <input
                type="file"
                name={`rooms[${room.roomId}].images`}
                multiple
                accept="image/*"
                style={inputStyle}
                required
                onChange={(e) => handleImageChange(room.roomId, e)}
              />
              
              {roomImages[room.roomId] && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {roomImages[room.roomId].imagePreview.map((url, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img 
                        src={url}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeRoomImage(room.roomId, index)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'red',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!room.daily ? (
              <button type="button" onClick={() => addDaily(index)}>Aggiungi tariffa giornaliera</button>
            ) : (
              <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                <h6>Tariffa Giornaliera</h6>
                
                <input
                  type="number"
                  name={`rooms[${room.roomId}].daily.price`}
                  placeholder="Prezzo giornaliero"
                  style={inputStyle}
                  defaultValue={0}
                  required
                />
                <input
                  type="hidden"
                  name={`rooms[${room.roomId}].daily.available`}
                  value='true'
                />
                <p style={{ color: 'red' }}>NOTA: Non vengono effettuati controlli sulla validità delle date inserite</p>
                <label>Ora inizio</label>
                <input
                  type="time"
                  name={`rooms[${room.roomId}].daily.start`}
                  placeholder="Ora inizio"
                  style={inputStyle}
                  required
                  defaultValue={room.daily?.start || "00:00"}
                />
                <label>Ora fine</label>
                <input
                  type="time"
                  name={`rooms[${room.roomId}].daily.end`}
                  placeholder="Ora fine"
                  style={inputStyle}
                  defaultValue={room.daily?.end || "23:59"}
                  required
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p>Scegli per quali giorni della settimana viene applicata questa tariffa giornaliera:</p>
                  {[
                    'Domenica',
                    'Lunedì',
                    'Martedì',
                    'Mercoledì',
                    'Giovedì',
                    'Venerdì',
                    'Sabato'
                  ].map((day, dayIndex) => (
                    <label
                      key={dayIndex}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <input
                        type="checkbox"
                        checked={room.daily?.days?.includes(dayIndex) || false}
                        onChange={(e) => handleDailyDaysChange(index, dayIndex, e.target.checked)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
                
                {/* Values of room.daily.days are store into this input as a string like: 1, 2, 3, 4.  */}
                {/* Those will be processed into an array of numbers by the backend */}
                {room.daily && (
                  <input
                    type="hidden"
                    name={`rooms[${room.roomId}].daily.days`}
                    value={room.daily?.days?.join(',') || ''}
                  />                  
                )}

                <button type="button" onClick={() => removeDaily(index)}>Rimuovi tariffa giornaliera</button>
              </div>
            )}

            <UnavailableDates roomId={room.roomId.toString()} />

            <button 
              type="button" 
              onClick={() => removeRoom(index)}
              disabled={rooms.length <= 1}
              style={{ 
                opacity: rooms.length <= 1 ? 0.5 : 1  // Optional: visual feedback
              }}
            >
              Rimuovi stanza
            </button>
          </div>
        </div>
      ))}
      
    </div>
  );
}; 