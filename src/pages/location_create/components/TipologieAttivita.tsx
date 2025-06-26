import { FC, useState, useEffect } from 'react';
import { getTipologieAttivita } from '../../../api/attivita/api';
import { Service } from '../../../api/common/types';
import { sectionStyle } from '../styles';

export const TipologieAttivita: FC = () => {
  const [tipologie, setTipologie] = useState<Service[]>([]);

  useEffect(() => {
    getTipologieAttivita().then(setTipologie).catch(console.error);
  }, []);

  return (
    <div>
      <div style={sectionStyle}>
        <h4 style={{ marginTop: '20px' }}>Tipologia di attività</h4>
        <p>Puoi selezionare più tipologie</p>
        {tipologie.map((tipologia) => (
          <label key={tipologia._id} style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" name={`tipologia[${tipologia._id}]`} style={{ marginRight: '10px' }} />
            {tipologia.name}
          </label>
        ))}
      </div>
    </div>
  );
}; 