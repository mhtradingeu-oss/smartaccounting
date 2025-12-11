import { logger } from '../lib/logger';

import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      logger.error('Failed to fetch invoices', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (invoiceId) => {
    setGeneratingPdf(invoiceId);
    try {
      const response = await api.post(`/invoices/${invoiceId}/generate-pdf`);
      
      if (response.data.success) {
        
        const downloadUrl = `${api.defaults.baseURL}${response.data.downloadUrl}`;
        window.open(downloadUrl, '_blank');
        
        alert('PDF generated and downloaded successfully!');
      }
    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-green-100 text-green-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Invoices
        </h1>
        <p className="text-gray-600">
          Manage and download your accounting invoices
        </p>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice List
            </h2>
            <Button onClick={fetchInvoices} variant="secondary" size="sm">
              Refresh
            </Button>
          </div>
          
          {invoices.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No invoices found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.supplier?.name || invoice.supplierName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleGeneratePDF(invoice.id)}
                            disabled={generatingPdf === invoice.id}
                          >
                            {generatingPdf === invoice.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              'Generate PDF'
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Invoices;
