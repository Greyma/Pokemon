const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateActivityPDF = async (req, res) => {
  try {
    const { type, date, period, reservations, totalGuests } = req.body;

    if (!type || !date) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Type et date requis' 
      });
    }

    const allowedTypes = ['restaurant', 'pool', 'gym'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Type d\'activité invalide' 
      });
    }

    // Créer le répertoire public/activities s'il n'existe pas
    const publicDir = path.join(__dirname, '../../public');
    const activitiesDir = path.join(publicDir, 'activities');
    
    try {
      await fs.promises.mkdir(publicDir, { recursive: true });
      await fs.promises.mkdir(activitiesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création des répertoires:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Erreur lors de la création des répertoires' 
      });
    }

    const doc = new PDFDocument();
    const filename = `${type}_${date}.pdf`;
    const filepath = path.join(activitiesDir, filename);

    // Écrire le PDF
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(25).text('Rapport d\'activité', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Type: ${type}`);
    doc.fontSize(16).text(`Date: ${date}`);
    doc.fontSize(16).text(`Période: ${period}`);
    doc.fontSize(16).text(`Total invités: ${totalGuests}`);
    doc.moveDown();

    // Contenu spécifique selon le type
    switch (type) {
      case 'restaurant':
        doc.fontSize(14).text('Réservations du restaurant');
        if (reservations && reservations.length > 0) {
          reservations.forEach(res => {
            doc.fontSize(12).text(`- ${res.clientName}: ${res.numberOfAdults} personnes`);
          });
        } else {
          doc.fontSize(12).text('Aucune réservation');
        }
        break;
      case 'pool':
        doc.fontSize(14).text('Utilisation de la piscine');
        if (reservations && reservations.length > 0) {
          reservations.forEach(res => {
            doc.fontSize(12).text(`- ${res.clientName}: ${res.numberOfAdults} personnes`);
          });
        } else {
          doc.fontSize(12).text('Aucune réservation');
        }
        break;
      case 'gym':
        doc.fontSize(14).text('Fréquentation de la salle de sport');
        if (reservations && reservations.length > 0) {
          reservations.forEach(res => {
            doc.fontSize(12).text(`- ${res.clientName}: ${res.numberOfAdults} personnes`);
          });
        } else {
          doc.fontSize(12).text('Aucune réservation');
        }
        break;
    }

    doc.end();

    // Attendre que le fichier soit écrit
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    res.json({
      status: 'success',
      data: {
        pdfUrl: `/activities/${filename}`
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erreur lors de la génération du PDF' 
    });
  }
};

module.exports = {
  generateActivityPDF
}; 