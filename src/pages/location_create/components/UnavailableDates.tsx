import { FC, useState } from 'react';
import { sectionStyle, inputStyle } from '../styles';

interface UnavailableDatesProps {
  roomId: string;
}

export const UnavailableDates: FC<UnavailableDatesProps> = ({ roomId }) => {
  const [unavailableDates, setUnavailableDates] = useState<Record<string, unknown>[]>(
    []
  );

  const addUnavailableDate = () => {
    setUnavailableDates([...unavailableDates, {
      date: '',
      start: '',
      end: ''
    }]);
  };

  const removeUnavailableDate = (index: number) => {
    setUnavailableDates(unavailableDates.filter((_, i) => i !== index));
  };

  const updateDateField = (
    index: number,
    field: 'date' | 'start' | 'end',
    value: string
  ) => {
    setUnavailableDates(
      unavailableDates.map((dateObj, i) =>
        i === index ? { ...dateObj, [field]: value } : dateObj
      )
    );
  };

  return (
    <div style={sectionStyle}>
      <h4>Date di non disponibilità</h4>
      <p>Rappresenta le date in cui il locatore non è disponibile ad affittare QUESTA STANZA della location</p>
      <button 
        type="button" 
        onClick={addUnavailableDate} 
        style={{ margin: '10px' }}
      >
        Aggiungi data di non disponibilità
      </button>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexDirection: 'column' }}>
        {unavailableDates.map((date, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="date"
              name={`rooms[${roomId}].unavailableDates[${index}].date`}
              value={date.date}
              onChange={(e) => updateDateField(index, 'date', e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="time"
              name={`rooms[${roomId}].unavailableDates[${index}].start`}
              value={date.start}
              onChange={(e) => updateDateField(index, 'start', e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="time"
              name={`rooms[${roomId}].unavailableDates[${index}].end`}
              value={date.end}
              onChange={(e) => updateDateField(index, 'end', e.target.value)}
              style={inputStyle}
              required
            />
            <button type="button" onClick={() => removeUnavailableDate(index)}>
              Rimuovi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 