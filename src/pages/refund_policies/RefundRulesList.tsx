import React from 'react';

interface RefundRule {
  timeWindow: string;
  refundPercentage: number;
  notes: string;
}

interface RefundRulesListProps {
  rules: RefundRule[];
}

const RefundRulesList: React.FC<RefundRulesListProps> = ({ rules }) => {
  return (
    <ul className="rules-list">
      {rules.map((rule, index) => (
        <li key={index} className="rule-item">
          <strong>{rule.timeWindow}</strong> - {rule.refundPercentage}% refund
          <br />
          <small>{rule.notes}</small>
        </li>
      ))}
    </ul>
  );
};

export default RefundRulesList; 