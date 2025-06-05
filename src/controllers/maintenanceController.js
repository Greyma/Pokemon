const { MaintenanceMode } = require('../models');

exports.toggleMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;
    if (enabled === undefined) {
      return res.status(400).json({ status: 'error', message: 'État du mode maintenance manquant' });
    }

    const maintenanceMode = await MaintenanceMode.findOne();
    if (maintenanceMode) {
      await maintenanceMode.update({ enabled, message });
    } else {
      await MaintenanceMode.create({ enabled, message });
    }

    res.json({
      status: 'success',
      data: { enabled, message }
    });
  } catch (error) {
    console.error('Erreur lors de la modification du mode maintenance:', error);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la modification du mode maintenance' });
  }
}; 