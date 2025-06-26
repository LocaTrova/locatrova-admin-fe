import { RefundPoliciesResponse } from '../common/types';
import { apiGet } from '../common/client';

export const getRefundPolicies = async (): Promise<RefundPoliciesResponse> => {
  return apiGet<RefundPoliciesResponse>('/refundPolicy/policies');
};


