import { useEffect } from 'react';
import { bankStatementsAPI } from '../services/bankStatementsAPI';

const BankStatements = () => {
  // All state removed as unused per ESLint

  const loadStatements = async () => {
    setLoading(true);
    try {
      const response = await bankStatementsAPI.list();
      const payload = response.data || response;
      const items = payload.data || payload.statements || [];
      setStatements(items);
      setError(null);
    } catch (err) {
      setError('Unable to load bank statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatements();


  }, []);

  // ...existing upload logic...
};

export default BankStatements;
