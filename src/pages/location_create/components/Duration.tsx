import { FC } from 'react';
import { inputStyle, sectionStyle } from '../styles';

export const Duration: FC = () => {
  return (
    <div style={sectionStyle}>
      <h4>Durata di ogni prenotazione</h4>
      <p>Rappresenta la durata di ogni prenotazione, che può essere fissa o minima.</p>
      <select name="durationType" required style={inputStyle}>
        <option value="FIXED">Durata fissa</option>
        <option value="MIN">Durata minima</option>
      </select>
      <input type="number" placeholder="Durata (in minuti)" name="duration" style={inputStyle} required/>
    </div>
  );
}; 