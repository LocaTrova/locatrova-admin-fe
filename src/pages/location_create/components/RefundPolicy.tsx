import { FC, useState, useEffect } from 'react';
import { sectionStyle, inputStyle } from '../styles';
import { getRefundPolicies } from '../../../api/refund_policies/api';

interface RefundPolicy {
  _id: string;
  name: string;
  description: string;
}

export const RefundPolicy: FC = () => {
  const [policies, setPolicies] = useState<RefundPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<RefundPolicy | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await getRefundPolicies();
        setPolicies(data);
      } catch (err) {
        setError('Errore nel caricamento delle politiche di rimborso');
        console.error(err);
      }
    };

    fetchPolicies();
  }, []);

  return (
    <div style={sectionStyle}>
      <h4>Politica di Rimborso</h4>
      <p>Se vuoi guardare i dettagli delle politiche di rimborso, puoi farlo <a target="_blank" rel="noopener noreferrer" href="/refund-policies">qui.</a>
      <br/> Questa link si apre in una nuova pagina. </p>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <select
        name="refundPolicyId"
        style={inputStyle}
        value={selectedPolicy?._id || ''}
        onChange={(e) => {
          const policy = policies.find(p => p._id === e.target.value);
          setSelectedPolicy(policy || null);
        }}
        required
      >
        <option value="">Seleziona una politica di rimborso</option>
        {policies.map((policy) => (
          <option key={policy._id} value={policy._id}>
            {policy.name}
          </option>
        ))}
      </select>

      {selectedPolicy && (
        <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
          {selectedPolicy.description}
        </div>
      )}
    </div>
  );
};
