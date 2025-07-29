const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// PDF Generation endpoint
app.post('/generate-pdf', (req, res) => {
  try {
    const { studentName, dateOfBirth, programName, enrollmentDate, expectedGraduationDate } = req.body;

    // Validate required fields
    if (!studentName || !dateOfBirth || !programName || !enrollmentDate || !expectedGraduationDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentName, dateOfBirth, programName, enrollmentDate, and expectedGraduationDate are required' 
      });
    }

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });
    
    // Generate unique filename
    const filename = `enrollment_certificate_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    
    // Pipe the PDF to a file
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Get today's date
    const today = new Date();
    const issueDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Add decorative border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .stroke();

    // Add inner border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(1)
       .stroke();

    // Header with school name and logo placeholder
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('UNIVERSITY OF DEMO', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#4a5568')
       .text('Office of Student Affairs', { align: 'center' })
       .moveDown(1);

    // Certificate title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2d3748')
       .text('ENROLLMENT CERTIFICATE', { align: 'center' })
       .moveDown(1.5);

    // Certificate number
    const certNumber = `CERT-${Date.now().toString().slice(-6)}`;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#718096')
       .text(`Certificate Number: ${certNumber}`, { align: 'center' })
       .moveDown(1);

    // Main content
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#2d3748')
       .text('This is to certify that:', { align: 'center' })
       .moveDown(1);

    // Student information in a structured format
    doc.moveDown(1);
    
    // Create a centered container for student information
    const pageWidth = doc.page.width;
    const containerWidth = 400;
    const containerX = (pageWidth - containerWidth) / 2;
    
    // Helper function to add a label-value pair on the same line
    const addField = (label, value, yPosition) => {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#2d3748')
         .text(label, containerX, yPosition);
      
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#2d3748')
         .text(value, containerX + 150, yPosition);
    };
    
    // Student Name
    const startY = doc.y;
    addField('Student Name:', studentName, startY);
    
    // Date of Birth
    addField('Date of Birth:', new Date(dateOfBirth).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), startY + 30);
    
    // Program Name
    addField('Program Name:', programName, startY + 60);
    
    // Enrollment Date
    addField('Enrollment Date:', new Date(enrollmentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), startY + 90);
    
    // Expected Graduation Date
    addField('Expected Graduation:', new Date(expectedGraduationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), startY + 120);
    
    doc.moveDown(2);

    // Position signature and issue date at the very bottom of the page
    const pageHeight = doc.page.height;
    const bottomMargin = 100; // Space from bottom edge
    
    // Issue date at bottom
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Issue Date: ${issueDate}`, { align: 'center' }, 0, pageHeight - bottomMargin - 40);

    // Signature lines at bottom
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#2d3748')
       .text('_________________________', 150, pageHeight - bottomMargin)
       .text('_________________________', 350, pageHeight - bottomMargin)
       .moveDown(0.5);

    doc.fontSize(10)
       .text('Registrar Signature', 150, pageHeight - bottomMargin + 20)
       .text('Dean Signature', 350, pageHeight - bottomMargin + 20);

    // Finalize the PDF
    doc.end();

    // Wait for the stream to finish writing
    stream.on('finish', () => {
      // Send the PDF file
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ error: 'Error sending PDF file' });
        }
        
        // Clean up: delete the file after sending
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting file:', unlinkErr);
          }
        });
      });
    });

    stream.on('error', (err) => {
      console.error('Error writing PDF:', err);
      res.status(500).json({ error: 'Error generating PDF' });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Enrollment Certificate API is running' });
});

// Test endpoint for GET requests
app.get('/generate-pdf', (req, res) => {
  res.json({ 
    error: 'This endpoint only accepts POST requests. Please use the form to generate a PDF certificate.',
    message: 'Use POST method with student data to generate PDF'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Certificate generation endpoint: http://localhost:${PORT}/generate-pdf`);
}); 