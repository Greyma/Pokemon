const { EmployeeAction } = require('../models');

exports.trackEmployeeAction = async (req, res) => {
  try {
    const { action, details, userId } = req.body;
    if (!action) {
      return res.status(400).json({ status: 'error', message: 'Action manquante' });
    }

    const employeeAction = await EmployeeAction.create({
      action,
      details,
      userId: userId || req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: employeeAction
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'action:', error);
    res.status(500).json({ status: 'error', message: 'Erreur lors de l\'enregistrement de l\'action' });
  }
}; 