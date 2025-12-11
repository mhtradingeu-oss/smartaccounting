import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Card from '../components/Card';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const GermanTaxReports = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('current-quarter');
  const [reportType, setReportType] = useState('ust');

  const reportTypes = [
    { id: 'ust', name: t('ustReport'), description: t('ustReportDescription') },
    { id: 'euer', name: t('euerReport'), description: t('euerReportDescription') },
    { id: 'gewst', name: t('gewstReport'), description: t('gewstReportDescription') },
  ];

  const periods = [
    { id: 'current-quarter', name: t('currentQuarter') },
    { id: 'last-quarter', name: t('lastQuarter') },
    { id: 'current-year', name: t('currentYear') },
    { id: 'last-year', name: t('lastYear') },
    { id: 'custom', name: t('customPeriod') },
  ];

  const generateReport = async () => {
    
    };

  return (
    <Layout>
      <div className="space-y-6">
        {}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('germanTaxReports')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('germanTaxReportsDescription')}
          </p>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('selectReportType')}
              </h3>
              <div className="space-y-3">
                {reportTypes.map((type) => (
                  <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value={type.id}
                      checked={reportType === type.id}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          {}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('selectPeriod')}
              </h3>
              <div className="space-y-3">
                {periods.map((period) => (
                  <label key={period.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="period"
                      value={period.id}
                      checked={selectedPeriod === period.id}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {period.name}
                    </span>
                  </label>
                ))}
              </div>

              {selectedPeriod === 'custom' && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('startDate')}
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('endDate')}
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('generateReport')}
              </h3>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {reportTypes.find(r => r.id === reportType)?.name}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {periods.find(p => p.id === selectedPeriod)?.name}
                  </p>
                </div>

                <button
                  onClick={generateReport}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  {t('generateReport')}
                </button>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {t('reportFormats')}: PDF, XML (ELSTER)
                </div>
              </div>
            </div>
          </Card>
        </div>

        {}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('recentReports')}
            </h3>

            <div className="space-y-4">
              {[
                { type: 'USt', period: 'Q4 2024', date: '2024-01-15', status: 'submitted' },
                { type: 'EÜR', period: '2023', date: '2024-01-10', status: 'draft' },
                { type: 'GewSt', period: '2023', date: '2024-01-05', status: 'submitted' },
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.type} - {report.period}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('generated')}: {new Date(report.date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.status === 'submitted' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {t(report.status)}
                    </span>

                    <button className="flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      {t('download')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {}
        <Card>
          <div className="p-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-3 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {t('complianceNotice')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('complianceNoticeText')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default GermanTaxReports;
