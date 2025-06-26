import { FC, useState } from 'react';
import { sectionStyle, inputStyle } from '../styles';
import { DayAvailability, TimeSlot } from '../types';

export const WeekAvailability: FC = () => {
  const [availability, setAvailability] = useState<DayAvailability[]>([
    { day: 'Lunedì', slots: [{ start: '00:00', end: '23:59' }] },
    { day: 'Martedì', slots: [{ start: '00:00', end: '23:59' }] },
    { day: 'Mercoledì', slots: [{ start: '00:00', end: '23:59' }] },
    { day: 'Giovedì', slots: [{ start: '00:00', end: '23:59' }] },
    { day: 'Venerdì', slots: [{ start: '00:00', end: '23:59' }] },
    { day: 'Sabato', slots: [{ start: '00:00', end: '23:59' }] },
    { day: 'Domenica', slots: [{ start: '00:00', end: '23:59' }] }
  ]);

  const addTimeSlot = (dayIndex: number) => {
    const newAvailability = [...availability];

    // If there's an empty slot, remove it before adding a new slot.
    newAvailability[dayIndex].slots = newAvailability[dayIndex].slots.filter(
      (slot) => !(slot.start === '' && slot.end === '')
    );

    // Add the new slot with default times.
    newAvailability[dayIndex].slots.push({ start: '00:00', end: '23:59' });
    setAvailability(newAvailability);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newAvailability = [...availability];
    const slots = newAvailability[dayIndex].slots;

    if (slots.length === 1) {
      // If it's the only slot, reset it to empty values
      slots[slotIndex] = { start: '', end: '' };
    } else {
      // Otherwise, remove the selected slot
      slots.splice(slotIndex, 1);
    }
    
    setAvailability(newAvailability);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: keyof TimeSlot, value: string) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots[slotIndex][field] = value;
    setAvailability(newAvailability);
  };

  return (
    <div style={sectionStyle}>
      <h4>Disponibilità settimanale</h4>
      <p style={{ color: 'red', background: 'black' }}>ATTENZIONE: Non vengono effettuati controlli sulle fasce orarie inserite, assicurati che siano corrette</p>
      {availability.map((day, dayIndex) => (
        <div key={day.day} style={{ marginBottom: '20px' }}>
          <h5>{day.day}</h5>
          {day.slots.map((slot, slotIndex) => (
            <div key={slotIndex} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type={slot.start ? "time" : "hidden"}
                name={`availability[${dayIndex}].slots[${slotIndex}].start`}
                value={slot.start ? slot.start : "EMPTY"}
                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start', e.target.value)}
                style={inputStyle}
                required
              />
              <input
                type={slot.end ? "time" : "hidden"}
                name={`availability[${dayIndex}].slots[${slotIndex}].end`}
                value={slot.end ? slot.end : "EMPTY"}
                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end', e.target.value)}
                style={inputStyle}
              />
              {/* Look at "processWeekAvailability" to understand why "EMPTY" is used in utils.ts */}
              <button 
                type="button" 
                style={slot.start && slot.end ? { display: 'block' } : { display: 'none' }}
                onClick={() => removeTimeSlot(dayIndex, slotIndex)}
              >
                Rimuovi
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addTimeSlot(dayIndex)}>
            Aggiungi fascia oraria
          </button>
        </div>
      ))}
    </div>
  );
}; 