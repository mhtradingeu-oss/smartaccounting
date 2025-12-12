const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Company } = require('../models');
const { authenticate, requireRole, requireCompany } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireCompany, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.findAll({
      where: { companyId: req.user.companyId },
      attributes: { exclude: ['password'] },
      include: [{
        model: Company,
        as: 'Company',
        attributes: ['id', 'name'],
      }],
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireCompany, requireRole(['admin']), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      companyId: req.user.companyId,
      status: 'active',
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:userId', authenticate, requireRole(['admin']), requireCompany, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, role, status } = req.body;

    const user = await User.findOne({
      where: { 
        id: userId,
        companyId: req.user.companyId, 
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      firstName,
      lastName,
      email,
      role,
      status,
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      message: 'User updated successfully',
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:userId', authenticate, requireRole(['admin']), requireCompany, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      where: { 
        id: userId,
        companyId: req.user.companyId, 
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
