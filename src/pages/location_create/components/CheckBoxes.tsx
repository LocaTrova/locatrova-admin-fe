import { FC } from 'react';
import { sectionStyle } from '../styles';

export const CheckBoxes: FC = () => {
  return (
    <div style={sectionStyle}>
      <h4>Impostazioni speciali</h4>
      <p>Puoi selezionare più impostazioni</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" name="active" />
          Attiva?
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" name="verified" />
          Verificata?
        </label>
      </div>
    </div>
  );
}; 