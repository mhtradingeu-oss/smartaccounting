import { logger } from '../lib/logger';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { bankStatementsAPI } from '../services/bankStatementsAPI';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const BankStatements = () => {
  const { t } = useTranslation();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  const loadStatements = async () => {
    try {
      const response = await bankStatementsAPI.list();
      const payload = response.data || response;
      const items = payload.data || payload.statements || [];
      setStatements(items);
      setError(null);
    } catch (err) {
      logger.error('Failed to load bank statements', err);
      setError('Unable to load bank statements');
    }
  };

  useEffect(() => {
    loadStatements();
  }, []);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) {return;}

    setLoading(true);
    setUploadProgress(0);
    setError(null);

    try {
      for (const file of files) {
        setUploadProgress(25);
        await bankStatementsAPI.upload(file);
        setUploadProgress(100);
      }
      await loadStatements();
    } catch (err) {
      logger.error('Failed to upload bank statement', { err });
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatDate = (value) => {
    if (!value) {return '-';}
    return new Date(value).toLocaleDateString('de-DE');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('bankStatements')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('bankStatementsDescription')}
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2">
              {error}
            </p>
          )}
        </div>

        <Card>
          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('uploadBankStatement')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('supportedFormats')}: CSV, TXT, XML, MT940
              </p>

              <input
                type="file"
                id="bank-statement-upload"
                className="hidden"
                accept=".csv,.txt,.xml,.mt940"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
              />

              <label
                htmlFor="bank-statement-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                {t('selectFiles')}
              </label>

              {loading && (
                <div className="mt-4">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {t('processing')}... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('uploadedStatements')}
            </h3>

            {statements.length > 0 ? (
              <div className="space-y-4">
                {statements.map((statement) => (
                  <div key={statement.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                        <BanknotesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {statement.filename || statement.originalName || statement.name || 'Bank statement'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('uploaded')}: {formatDate(statement.importDate || statement.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {(statement.transactions?.length || statement.transactionCount || 0)} {t('transactions')}
                        </p>
                        {statement.balance && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            €{statement.balance}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center">
                        {statement.status === 'processed' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>

                      <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                        {t('view')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('noBankStatements')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default BankStatements;
