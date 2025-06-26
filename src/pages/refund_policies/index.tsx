import React, { useEffect, useState } from 'react';
import { getRefundPolicies } from '../../api/refund_policies/api';
import RefundRulesList from './RefundRulesList';
import './refund-policies.css';
import { Link } from 'react-router-dom';

interface RefundRule {
  timeWindow: string;
  refundPercentage: number;
  notes: string;
}

interface RefundPolicy {
  _id: string;
  name: string;
  bestFor: string;
  hostTip: string;
  refundRules: RefundRule[];
}

const RefundPoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<RefundPolicy[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await getRefundPolicies();
      setPolicies(data);
    } catch (error) {
      console.error("Error fetching refund policies:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="refund-policies-container">
      <h1 className="refund-policies-title">Refund Policies</h1>
      <p><Link to="/">[Home]</Link></p>
      <p className="warning-text">Nota: Questa pagina non supporta ancora la paginazione, l'aggiunta, la visualizzazione e la modifica delle politiche di rimborso. <br /></p>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="table-container">
          <table className="refund-policies-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Best For</th>
                <th>Host Tip</th>
                <th>Refund Rules</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy._id}>
                  <td>{policy._id}</td>
                  <td>{policy.name}</td>
                  <td>{policy.bestFor}</td>
                  <td>{policy.hostTip}</td>
                  <td>
                    <RefundRulesList rules={policy.refundRules} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RefundPoliciesPage;
