import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ChartBarIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  BellIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  DocumentChartBarIcon as DocumentChartBarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';
import { FEATURE_FLAGS } from '../lib/constants';

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const mainNavigation = [
    {
      name: t('navigation.dashboard'),
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      badge: null,
      description: 'Overview & Analytics',
    },
    {
      name: t('navigation.invoices'),
      href: '/invoices',
      icon: DocumentTextIcon,
      iconSolid: DocumentTextIconSolid,
      badge: '12',
      description: 'Create & Manage Invoices',
    },
    {
      name: t('navigation.bank_statements'),
      href: '/bank-statements',
      icon: BanknotesIcon,
      iconSolid: BanknotesIconSolid,
      badge: null,
      description: 'Bank Transactions',
    },
    ...FEATURE_FLAGS.GERMAN_TAX.enabled ? [{
      name: t('navigation.tax_reports'),
      href: '/german-tax-reports',
      icon: DocumentChartBarIcon,
      iconSolid: DocumentChartBarIconSolid,
      badge: 'NEW',
      description: 'German Tax Compliance',
    }] : [],
  ];

  const analyticsNavigation = [
    {
      name: t('navigation.analytics'),
      href: '/analytics',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      badge: null,
      description: 'Business Intelligence',
    },
    {
      name: t('navigation.calculator'),
      href: '/calculator',
      icon: CalculatorIcon,
      badge: null,
      description: 'Tax Calculator',
    },
    {
      name: 'Revenue Tracking',
      href: '/revenue',
      icon: CurrencyEuroIcon,
      badge: null,
      description: 'Revenue Analytics',
    },
  ];

  const managementNavigation = [
    {
      name: t('navigation.uploads'),
      href: '/uploads',
      icon: CloudArrowUpIcon,
      badge: '3',
      description: 'Document Upload & OCR',
    },
    ...FEATURE_FLAGS.STRIPE_BILLING.enabled ? [{
      name: t('navigation.billing'),
      href: '/billing',
      icon: CreditCardIcon,
      badge: null,
      description: 'Subscription & Billing',
    }] : [],
    ...FEATURE_FLAGS.ELSTER_COMPLIANCE.enabled ? [{
      name: t('navigation.compliance'),
      href: '/compliance',
      icon: ShieldCheckIcon,
      badge: null,
      description: 'GDPR & GoBD Compliance',
    }] : [],
  ];

  const adminNavigation = user?.role === 'admin' ? [
    {
      name: 'Companies',
      href: '/companies',
      icon: BuildingOfficeIcon,
      badge: null,
      description: 'Manage Companies',
    },
    {
      name: 'Users',
      href: '/users',
      icon: UsersIcon,
      badge: null,
      description: 'User Management',
    },
    {
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: ClipboardDocumentListIcon,
      badge: null,
      description: 'System Audit Trail',
    },
  ] : [];

  const systemNavigation = [
    {
      name: t('navigation.notifications'),
      href: '/notifications',
      icon: BellIcon,
      badge: '3',
      description: 'Alerts & Notifications',
    },
    {
      name: t('navigation.settings'),
      href: '/settings',
      icon: Cog6ToothIcon,
      badge: null,
      description: 'Account Settings',
    },
  ];

  const isActiveLink = (href) => {
    return location.pathname === href || 
           (href !== '/dashboard' && location.pathname.startsWith(href));
  };

  const renderNavItem = (item, index, sectionKey = '') => {
    const isActive = isActiveLink(item.href);
    const isHovered = hoveredItem === `${sectionKey}-${item.href}-${index}`;
    const IconComponent = isActive && item.iconSolid ? item.iconSolid : item.icon;

    return (
      <NavLink
        key={`${sectionKey}-${item.href}`}
        to={item.href}
        className={`relative group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
        }`}
        onMouseEnter={() => setHoveredItem(`${sectionKey}-${item.href}-${index}`)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="flex items-center w-full">
          <div className={`flex-shrink-0 ${isActive ? 'transform scale-110' : ''} transition-transform duration-200`}>
            <IconComponent className="h-5 w-5" />
          </div>

          {!isCollapsed && (
            <>
              <span className="ml-3 flex-1 text-left truncate">
                {item.name}
              </span>

              {item.badge && (
                <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.badge === 'NEW' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </>
          )}
        </div>

        {/* Enhanced Tooltip for collapsed sidebar */}
        {isCollapsed && isHovered && (
          <div className="absolute left-full ml-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 whitespace-nowrap dark:bg-gray-700 border border-gray-700 dark:border-gray-600">
            <div className="font-medium">{item.name}</div>
            {item.description && (
              <div className="text-xs text-gray-300 mt-1">{item.description}</div>
            )}
            {item.badge && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-white text-gray-900 rounded text-xs font-medium">
                {item.badge}
              </span>
            )}
            {/* Arrow */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full">
              <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          </div>
        )}
      </NavLink>
    );
  };

  const renderSection = (title, items, sectionKey, icon = null) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center space-x-2">
            {icon && <icon className="h-4 w-4 text-gray-400" />}
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              {title}
            </h3>
          </div>
        </div>
      )}
      <div className="space-y-1">
        {items.map((item, index) => renderNavItem(item, index, sectionKey))}
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out dark:bg-gray-900 dark:border-gray-700 ${
      isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
    }`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                SmartAccounting
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Professional Suite
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm"
          aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Enhanced User Profile */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 ${isCollapsed ? 'px-3' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 relative">
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                {user?.email}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-primary-100 to-blue-100 text-primary-800 dark:from-primary-900/40 dark:to-blue-900/40 dark:text-primary-200">
                  {user?.subscriptionPlan || 'Professional'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto scrollbar-thin">
        {renderSection(t('navigation.main'), mainNavigation, 'main', HomeIcon)}
        {renderSection('Analytics', analyticsNavigation, 'analytics', ChartBarIcon)}
        {renderSection(t('navigation.management'), managementNavigation, 'management', Cog6ToothIcon)}
        {adminNavigation.length > 0 && renderSection('Administration', adminNavigation, 'admin', ShieldCheckIcon)}
        {renderSection(t('navigation.system'), systemNavigation, 'system', BellIcon)}
      </nav>

      {/* Enhanced Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-medium">SmartAccounting Suite</p>
              <p>Version 2.1.0 Professional</p>
              <p>© 2024 MH Trading UG</p>
            </div>
            <div className="mt-3 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-xs text-emerald-600 font-medium">System Healthy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
