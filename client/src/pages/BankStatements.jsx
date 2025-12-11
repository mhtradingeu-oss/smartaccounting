import { logger } from '../lib/logger';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const BankStatements = () => {
  const { t } = useTranslation();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('bankStatement', file);

      try {
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        clearInterval(progressInterval);
        setUploadProgress(100);

        const newStatement = {
          id: Date.now() + i,
          filename: file.name,
          uploadDate: new Date().toISOString(),
          status: 'processed',
          transactions: Math.floor(Math.random() * 50) + 10,
          balance: (Math.random() * 50000).toFixed(2)
        };

        setStatements(prev => [newStatement, ...prev]);
      } catch (error) {
        }
    }

    setLoading(false);
    setUploadProgress(0);
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

  return (
    <Layout>
      <div className="space-y-6">
        {}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('bankStatements')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('bankStatementsDescription')}
          </p>
        </div>

        {}
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
                {t('supportedFormats')}: CSV, OFX, MT940
              </p>

              <input
                type="file"
                id="bank-statement-upload"
                className="hidden"
                accept=".csv,.ofx,.mt940,.txt"
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

        {}
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
                          {statement.filename}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('uploaded')}: {new Date(statement.uploadDate).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {statement.transactions} {t('transactions')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          €{statement.balance}
                        </p>
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