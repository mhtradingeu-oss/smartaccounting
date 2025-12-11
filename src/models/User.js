const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name',
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name',
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'accountant', 'auditor', 'viewer'),
      defaultValue: 'viewer'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    subscriptionPlan: {
      type: DataTypes.ENUM('basic', 'pro', 'enterprise'),
      defaultValue: 'basic',
      field: 'subscription_plan'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
      defaultValue: 'active',
      field: 'subscription_status'
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: 'last_login'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    phoneNumber: {
      type: DataTypes.STRING,
      field: 'phone_number'
    },
    address: {
      type: DataTypes.TEXT
    },
    vatNumber: {
      type: DataTypes.STRING,
      field: 'vat_number'
    },
    taxNumber: {
      type: DataTypes.STRING,
      field: 'tax_number'
    },
    language: {
      type: DataTypes.ENUM('en', 'de', 'ar'),
      defaultValue: 'en'
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      field: 'stripe_customer_id'
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      field: 'stripe_subscription_id'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Company, { foreignKey: 'userId', as: 'companies' });
    User.hasMany(models.Invoice, { foreignKey: 'userId', as: 'invoices' });
    User.hasMany(models.TaxReport, { foreignKey: 'userId', as: 'taxReports' });
    User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  };

  User.prototype.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  };

  User.prototype.hasPermission = function(permission) {
    const rolePermissions = {
      'admin': ['read', 'write', 'delete', 'manage_users', 'manage_system'],
      'accountant': ['read', 'write', 'manage_invoices', 'manage_reports'],
      'auditor': ['read', 'audit_access'],
      'viewer': ['read']
    };
    return rolePermissions[this.role] && rolePermissions[this.role].includes(permission);
  };

  return User;
};