
const { Sequelize } = require('sequelize');

class DatabaseOptimizer {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  async createIndexes() {
    const queryInterface = this.sequelize.getQueryInterface();
    
    try {
      
      await queryInterface.addIndex('Users', ['email'], {
        unique: true,
        name: 'idx_users_email'
      });
      await queryInterface.addIndex('Users', ['role'], {
        name: 'idx_users_role'
      });
      await queryInterface.addIndex('Users', ['companyId'], {
        name: 'idx_users_company'
      });

      await queryInterface.addIndex('Invoices', ['number'], {
        unique: true,
        name: 'idx_invoices_number'
      });
      await queryInterface.addIndex('Invoices', ['companyId'], {
        name: 'idx_invoices_company'
      });
      await queryInterface.addIndex('Invoices', ['status'], {
        name: 'idx_invoices_status'
      });
      await queryInterface.addIndex('Invoices', ['dueDate'], {
        name: 'idx_invoices_due_date'
      });
      await queryInterface.addIndex('Invoices', ['createdAt'], {
        name: 'idx_invoices_created'
      });

      await queryInterface.addIndex('Companies', ['taxId'], {
        unique: true,
        name: 'idx_companies_tax_id'
      });
      await queryInterface.addIndex('Companies', ['email'], {
        name: 'idx_companies_email'
      });

      await queryInterface.addIndex('Transactions', ['invoiceId'], {
        name: 'idx_transactions_invoice'
      });
      await queryInterface.addIndex('Transactions', ['type'], {
        name: 'idx_transactions_type'
      });
      await queryInterface.addIndex('Transactions', ['date'], {
        name: 'idx_transactions_date'
      });

      await queryInterface.addIndex('TaxReports', ['companyId'], {
        name: 'idx_tax_reports_company'
      });
      await queryInterface.addIndex('TaxReports', ['period'], {
        name: 'idx_tax_reports_period'
      });
      await queryInterface.addIndex('TaxReports', ['status'], {
        name: 'idx_tax_reports_status'
      });

      await queryInterface.addIndex('BankStatements', ['companyId'], {
        name: 'idx_bank_statements_company'
      });
      await queryInterface.addIndex('BankStatements', ['accountNumber'], {
        name: 'idx_bank_statements_account'
      });

      await queryInterface.addIndex('BankTransactions', ['bankStatementId'], {
        name: 'idx_bank_transactions_statement'
      });
      await queryInterface.addIndex('BankTransactions', ['date'], {
        name: 'idx_bank_transactions_date'
      });
      await queryInterface.addIndex('BankTransactions', ['amount'], {
        name: 'idx_bank_transactions_amount'
      });

      await queryInterface.addIndex('AuditLogs', ['userId'], {
        name: 'idx_audit_logs_user'
      });
      await queryInterface.addIndex('AuditLogs', ['action'], {
        name: 'idx_audit_logs_action'
      });
      await queryInterface.addIndex('AuditLogs', ['timestamp'], {
        name: 'idx_audit_logs_timestamp'
      });

      } catch (error) {
      }
  }

  async optimizeQueries() {
    try {
      
      if (process.env.NODE_ENV === 'development') {
        this.sequelize.options.logging = (sql, timing) => {
          if (timing > 1000) { 
            :`, sql);
          }
        };
      }

      this.sequelize.options.pool = {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 1000
      };

      } catch (error) {
      }
  }
}

module.exports = DatabaseOptimizer;
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const logger = require('../logger');

class MigrationManager {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.migrationsPath = path.join(process.cwd(), 'database', 'migrations');
    this.seedsPath = path.join(process.cwd(), 'database', 'seeds');
    this.migrationTableName = 'SequelizeMeta';

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.migrationsPath, this.seedsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });
  }

  async createMigrationTable() {
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${this.migrationTableName}" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);
  }

  async getExecutedMigrations() {
    try {
      const [results] = await this.sequelize.query(
        `SELECT name FROM "${this.migrationTableName}" ORDER BY name`
      );
      return results.map(row => row.name);
    } catch (error) {
      logger.warn('Migration table not found, creating it');
      await this.createMigrationTable();
      return [];
    }
  }

  async getPendingMigrations() {
    const executed = await this.getExecutedMigrations();
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    return migrationFiles.filter(file => !executed.includes(file));
  }

  async executeMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsPath, migrationFile);
    const migration = require(migrationPath);
    
    const transaction = await this.sequelize.transaction();
    
    try {
      logger.info(`Executing migration: ${migrationFile}`);
      
      if (typeof migration.up === 'function') {
        await migration.up(this.sequelize.getQueryInterface(), Sequelize, transaction);
      } else {
        throw new Error(`Migration ${migrationFile} must export an 'up' function`);
      }

      await this.sequelize.query(
        `INSERT INTO "${this.migrationTableName}" ("name") VALUES (?)`,
        {
          replacements: [migrationFile],
          transaction
        }
      );
      
      await transaction.commit();
      logger.info(`Migration completed: ${migrationFile}`);
      
    } catch (error) {
      await transaction.rollback();
      logger.error(`Migration failed: ${migrationFile}`, { error: error.message });
      throw error;
    }
  }

  async rollbackMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsPath, migrationFile);
    const migration = require(migrationPath);
    
    const transaction = await this.sequelize.transaction();
    
    try {
      logger.info(`Rolling back migration: ${migrationFile}`);
      
      if (typeof migration.down === 'function') {
        await migration.down(this.sequelize.getQueryInterface(), Sequelize, transaction);
      } else {
        throw new Error(`Migration ${migrationFile} must export a 'down' function`);
      }

      await this.sequelize.query(
        `DELETE FROM "${this.migrationTableName}" WHERE "name" = ?`,
        {
          replacements: [migrationFile],
          transaction
        }
      );
      
      await transaction.commit();
      logger.info(`Migration rolled back: ${migrationFile}`);
      
    } catch (error) {
      await transaction.rollback();
      logger.error(`Migration rollback failed: ${migrationFile}`, { error: error.message });
      throw error;
    }
  }

  async migrate() {
    await this.createMigrationTable();
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Found ${pending.length} pending migrations`);
    
    for (const migration of pending) {
      await this.executeMigration(migration);
    }
    
    logger.info('All migrations completed successfully');
  }

  async rollback() {
    const executed = await this.getExecutedMigrations();
    
    if (executed.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const lastMigration = executed[executed.length - 1];
    await this.rollbackMigration(lastMigration);
  }

  async getStatus() {
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    
    return {
      executed: executed.length,
      pending: pending.length,
      executedMigrations: executed,
      pendingMigrations: pending
    };
  }

  generateMigration(name) {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const filename = `${timestamp}-${name}.js`;
    const filepath = path.join(this.migrationsPath, filename);
    
    const template = `'use strict';

module.exports = {
  async up(queryInterface, Sequelize, transaction) {

  },

  async down(queryInterface, Sequelize, transaction) {

  }
};
`;
    
    fs.writeFileSync(filepath, template);
    logger.info(`Generated migration: ${filename}`);
    return filename;
  }

  async seed() {
    const seedFiles = fs.readdirSync(this.seedsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    for (const seedFile of seedFiles) {
      const seedPath = path.join(this.seedsPath, seedFile);
      const seed = require(seedPath);
      
      try {
        logger.info(`Executing seed: ${seedFile}`);
        await seed.up(this.sequelize.getQueryInterface(), Sequelize);
        logger.info(`Seed completed: ${seedFile}`);
      } catch (error) {
        logger.error(`Seed failed: ${seedFile}`, { error: error.message });
        throw error;
      }
    }
  }
}

if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  const { sequelize } = require('../../config/database');
  const migrationManager = new MigrationManager(sequelize);
  
  (async () => {
    try {
      switch (command) {
        case 'migrate':
          await migrationManager.migrate();
          break;
        case 'rollback':
          await migrationManager.rollback();
          break;
        case 'status':
          const status = await migrationManager.getStatus();
          break;
        case 'generate':
          if (!arg) {
            process.exit(1);
          }
          migrationManager.generateMigration(arg);
          break;
        case 'seed':
          await migrationManager.seed();
          break;
        default:
          }
    } catch (error) {
      logger.error('Migration command failed', { error: error.message });
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  })();
}

module.exports = MigrationManager;
