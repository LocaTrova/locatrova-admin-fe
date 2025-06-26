import { FC, useState, useEffect } from 'react';
import { getServiziAttivita } from '../../../api/attivita/api';
import { sectionStyle } from '../styles';

export const ServiziAttivita: FC = () => {
  const [servizi, setServizi] = useState<unknown[]>([]);

  useEffect(() => {
    getServiziAttivita().then(setServizi).catch(console.error);
  }, []);

  return (
    <div>
      <div style={sectionStyle}>
        <h4 style={{ marginTop: '20px' }}>Servizi</h4>
        <p>Puoi selezionare più servizi</p>
        {servizi.map((servizio, index) => (
          <label key={index} style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" name={`servizio-${servizio}`} style={{ marginRight: '10px' }} />
            {servizio}
          </label>
        ))}
      </div>
    </div>
  );
}; 