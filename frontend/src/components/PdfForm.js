import React, { useState } from 'react';
import './PdfForm.css';

const PdfForm = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: '',
    programName: '',
    enrollmentDate: '',
    expectedGraduationDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://certificate-generator-frontend-production.up.railway.app';
      const response = await fetch(`${apiUrl}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `enrollment_certificate_${Date.now()}.pdf`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset form
      setFormData({
        studentName: '',
        dateOfBirth: '',
        programName: '',
        enrollmentDate: '',
        expectedGraduationDate: ''
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-form-container">
      <h1>Enrollment Certificate Generator</h1>
      <form onSubmit={handleSubmit} className="pdf-form">
        <div className="form-group">
          <label htmlFor="studentName">Student Full Name:</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            required
            placeholder="Enter student's full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth:</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="programName">Program Name:</label>
          <input
            type="text"
            id="programName"
            name="programName"
            value={formData.programName}
            onChange={handleInputChange}
            required
            placeholder="Enter program name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="enrollmentDate">Enrollment Date:</label>
          <input
            type="date"
            id="enrollmentDate"
            name="enrollmentDate"
            value={formData.enrollmentDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="expectedGraduationDate">Expected Graduation Date:</label>
          <input
            type="date"
            id="expectedGraduationDate"
            name="expectedGraduationDate"
            value={formData.expectedGraduationDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <button 
          type="submit" 
          className="generate-btn"
          disabled={loading}
        >
          {loading ? 'Generating Certificate...' : 'Generate Certificate'}
        </button>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default PdfForm; 