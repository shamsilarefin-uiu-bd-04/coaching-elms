const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function createSimplePdf(title, subject, teacher, topics) {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length ${300 + title.length * 10} >>
stream
BT
/F1 22 Tf
50 720 Td
(NEXUS ACADEMY - LECTURE NOTES) Tj
/F2 14 Tf
0 -30 Td
(${title}) Tj
/F2 11 Tf
0 -25 Td
(Course: ${subject}  |  Faculty: ${teacher}) Tj
0 -20 Td
(Location: 965/1 Middle Monipur, Mirpur-2, Dhaka-1216) Tj
0 -30 Td
(Key Topics Covered:) Tj
${topics.map((t, i) => `0 -20 Td\n(${i + 1}. ${t}) Tj`).join('\n')}
0 -40 Td
(Official Study Material for Enrolled Students Only. Nexus ELMS Compliant.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000069 00000 n 
0000000126 00000 n 
0000000251 00000 n 
0000000800 00000 n 
0000000880 00000 n 
trailer << /Size 7 /Root 1 0 R >>
startxref
960
%%EOF`;
  return Buffer.from(content, 'utf8');
}

const files = [
  {
    name: 'Physics_Ch1_Vectors_Lecture_Notes.pdf',
    title: 'Chapter 01: Vector Analysis & Resolution',
    subject: 'HSC Physics (PHY-101)',
    teacher: 'Nusrat Jahan (Physics Lecturer)',
    topics: [
      'Definition of Vectors and Scalar Quantities',
      'Dot Product and Cross Product with 3D Matrix Determinants',
      'Resolution of Vectors along Rectangular Components',
      'Relative Velocity and River-Boat Crossing Mechanics',
      'Board Exam Standard Numerical Problems with Step-by-Step Solutions'
    ]
  },
  {
    name: 'Newtonian_Mechanics_Formula_Sheet.pdf',
    title: 'Newtonian Mechanics Summary & Formula Sheet',
    subject: 'HSC Physics (PHY-101)',
    teacher: 'Nusrat Jahan (Physics Lecturer)',
    topics: [
      'Newton Three Laws of Motion & Conservation of Linear Momentum',
      'Static, Kinetic and Rolling Friction Coefficients',
      'Circular Motion Dynamics, Banking of Roads and Centripetal Force',
      'Rotational Inertia, Torque, and Angular Momentum'
    ]
  },
  {
    name: 'Calculus_Differentiation_Formulas_Nexus.pdf',
    title: 'Limits & Differentiation Master Handout',
    subject: 'HSC Higher Mathematics (MTH-201)',
    teacher: 'Tanvir Ahmed (Senior Faculty Lead)',
    topics: [
      'Fundamental Limits: sin(x)/x, ln(1+x)/x, and e^x limits',
      'Derivatives of Trigonometric, Inverse and Exponential Functions',
      'Chain Rule and Implicit Differentiation Techniques',
      'Tangent, Normal, and Rate of Change Applications',
      'Successive Differentiation and Leibniz Theorem'
    ]
  },
  {
    name: 'Atomic_Structure_Notes_Nexus.pdf',
    title: 'Atomic Structure & Quantum Numbers Class Notes',
    subject: 'HSC Chemistry (CHM-105)',
    teacher: 'Dr. Arif Hasan (Lead Instructor)',
    topics: [
      'Bohr Atomic Model and Postulates',
      'Principal, Azimuthal, Magnetic, and Spin Quantum Numbers',
      'Aufbau Principle, Pauli Exclusion, and Hund Rule of Maximum Multiplicity',
      'Electronic Configuration of Transition Elements and Anomalies'
    ]
  },
  {
    name: 'Admission_Math_Shortcuts_Nexus.pdf',
    title: 'Engineering Admission Math Speed-Solving Sheet',
    subject: 'Admission Math (ADM-MTH)',
    teacher: 'Tanvir Ahmed (Senior Faculty Lead)',
    topics: [
      'Trigonometric Shortcuts for 30-Second Limit Evaluations',
      'Definite Integrals by Inspection & Symmetry Properties',
      'Determinant Simplification for Matrix Admission Questions',
      'Coordinate Geometry Distance & Locus Shortcut Tricks'
    ]
  }
];

files.forEach(f => {
  const p = path.join(uploadDir, f.name);
  fs.writeFileSync(p, createSimplePdf(f.title, f.subject, f.teacher, f.topics));
});

console.log('Sample PDFs guaranteed.');
