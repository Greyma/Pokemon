const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateActivityPDF = async (req, res) => {
  try {
    const { type, date } = req.body;

    if (!type || !date) {
      return res.status(400).json({ message: 'Type et date requis' });
    }

    const allowedTypes = ['restaurant', 'pool', 'gym'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Type d\'activité invalide' });
    }

    const doc = new PDFDocument();
    const filename = `${type}_${date}.pdf`;
    const filepath = path.join(__dirname, '../../public/activities', filename);

    // Créer le répertoire s'il n'existe pas
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Écrire le PDF
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(25).text('Rapport d\'activité', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Type: ${type}`);
    doc.fontSize(16).text(`Date: ${date}`);
    doc.moveDown();

    // Contenu spécifique selon le type
    switch (type) {
      case 'restaurant':
        doc.fontSize(14).text('Réservations du restaurant');
        // Ajouter les données spécifiques au restaurant
        break;
      case 'pool':
        doc.fontSize(14).text('Utilisation de la piscine');
        // Ajouter les données spécifiques à la piscine
        break;
      case 'gym':
        doc.fontSize(14).text('Fréquentation de la salle de sport');
        // Ajouter les données spécifiques à la salle de sport
        break;
    }

    doc.end();

    // Attendre que le fichier soit écrit
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    res.json({
      data: {
        pdfUrl: `/activities/${filename}`
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateActivityPDF
}; 