import { FC } from 'react';
import { inputStyle, sectionStyle } from '../styles';

export const TextAreas: FC = () => {
  return (
    <div style={sectionStyle}>
      <h4>Descrizione e regole</h4>
      <textarea 
        placeholder="Descrizione" 
        name="description" 
        style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }} 
        required
      />
      <textarea 
        placeholder="Regole" 
        name="rules" 
        style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }} 
        required
      />
    </div>

  );
}; 