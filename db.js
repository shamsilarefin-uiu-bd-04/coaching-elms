const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed dataset
function getInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('nexus123', salt);

  const users = [
    {
      id: 'ADM-001',
      name: 'System Administrator',
      email: 'admin@nexusacademy.edu.bd',
      phone: '01633151496',
      role: 'admin',
      passwordHash: defaultPasswordHash,
      department: 'Central Administration',
      status: 'active',
      avatar: '👨‍💼',
      createdAt: '2024-01-01T08:00:00.000Z'
    },
    {
      id: 'TCH-101',
      name: 'Tanvir Ahmed',
      email: 'tanvir.math@nexusacademy.edu.bd',
      phone: '01799008544',
      role: 'teacher',
      passwordHash: defaultPasswordHash,
      department: 'Mathematics & Statistics',
      designation: 'Senior Faculty Lead',
      status: 'active',
      avatar: '👨‍🏫',
      createdAt: '2024-01-10T09:00:00.000Z'
    },
    {
      id: 'TCH-102',
      name: 'Nusrat Jahan',
      email: 'nusrat.phy@nexusacademy.edu.bd',
      phone: '01711223344',
      role: 'teacher',
      passwordHash: defaultPasswordHash,
      department: 'Physics',
      designation: 'Lecturer in Physics',
      status: 'active',
      avatar: '👩‍🏫',
      createdAt: '2024-01-15T09:00:00.000Z'
    },
    {
      id: 'TCH-103',
      name: 'Dr. Arif Hasan',
      email: 'arif.chem@nexusacademy.edu.bd',
      phone: '01822334455',
      role: 'teacher',
      department: 'Chemistry',
      designation: 'Lead Instructor',
      status: 'active',
      avatar: '👨‍🔬',
      passwordHash: defaultPasswordHash,
      createdAt: '2024-01-20T09:00:00.000Z'
    },
    {
      id: 'STU-2024-001',
      name: 'Rahim Uddin',
      email: 'rahim.stu@nexusacademy.edu.bd',
      phone: '01911002233',
      role: 'student',
      passwordHash: defaultPasswordHash,
      batch: 'HSC 2025 Science',
      status: 'active',
      avatar: '👨‍🎓',
      createdAt: '2024-02-01T10:00:00.000Z'
    },
    {
      id: 'STU-2024-002',
      name: 'Sadia Akter',
      email: 'sadia.stu@nexusacademy.edu.bd',
      phone: '01922334455',
      role: 'student',
      passwordHash: defaultPasswordHash,
      batch: 'HSC 2025 Science',
      status: 'active',
      avatar: '👩‍🎓',
      createdAt: '2024-02-02T10:00:00.000Z'
    },
    {
      id: 'STU-2024-003',
      name: 'Tanim Hossain',
      email: 'tanim.stu@nexusacademy.edu.bd',
      phone: '01933445566',
      role: 'student',
      passwordHash: defaultPasswordHash,
      batch: 'HSC 2025 Science',
      status: 'active',
      avatar: '👨‍🎓',
      createdAt: '2024-02-03T10:00:00.000Z'
    },
    {
      id: 'STU-2024-004',
      name: 'Farhana Islam',
      email: 'farhana.stu@nexusacademy.edu.bd',
      phone: '01944556677',
      role: 'student',
      passwordHash: defaultPasswordHash,
      batch: 'HSC 2025 Science',
      status: 'active',
      avatar: '👩‍🎓',
      createdAt: '2024-02-04T10:00:00.000Z'
    },
    {
      id: 'STU-2024-005',
      name: 'Sakib Al Hasan',
      email: 'sakib.stu@nexusacademy.edu.bd',
      phone: '01955667788',
      role: 'student',
      passwordHash: defaultPasswordHash,
      batch: 'Admission Prep 2024',
      status: 'active',
      avatar: '👨‍🎓',
      createdAt: '2024-02-05T10:00:00.000Z'
    },
    {
      id: 'STU-2024-006',
      name: 'Mehnaz Rahman',
      email: 'mehnaz.stu@nexusacademy.edu.bd',
      phone: '01966778899',
      role: 'student',
      passwordHash: defaultPasswordHash,
      batch: 'Admission Prep 2024',
      status: 'active',
      avatar: '👩‍🎓',
      createdAt: '2024-02-06T10:00:00.000Z'
    }
  ];

  const classes = [
    {
      id: 'CLS-101',
      code: 'PHY-101',
      title: 'HSC Physics: Mechanics & Waves',
      section: 'Section A - Morning',
      schedule: 'Sun, Tue 09:30 AM - 11:00 AM',
      room: 'Room 201 (Mirpur Campus)',
      teacherId: 'TCH-102', // Nusrat Jahan
      term: 'Fall 2024 - HSC 2025',
      description: 'Comprehensive study of Vector mechanics, Newton laws of motion, Work, Energy, Power, Rotational Dynamics and Mechanical Waves.',
      credits: 3.0,
      createdAt: '2024-02-01T08:00:00.000Z'
    },
    {
      id: 'CLS-102',
      code: 'MTH-201',
      title: 'HSC Higher Mathematics: Calculus & Coordinates',
      section: 'Section B - Afternoon',
      schedule: 'Mon, Wed 03:30 PM - 05:00 PM',
      room: 'Room 203 (Mirpur Campus)',
      teacherId: 'TCH-101', // Tanvir Ahmed (Associated with multiple classes)
      term: 'Fall 2024 - HSC 2025',
      description: 'Differential calculus, Limits, Integration techniques, Straight lines, and Conic sections with board and admission problem sets.',
      credits: 3.0,
      createdAt: '2024-02-01T08:00:00.000Z'
    },
    {
      id: 'CLS-103',
      code: 'CHM-105',
      title: 'HSC Chemistry: General & Organic Chemistry',
      section: 'Section A - Weekend',
      schedule: 'Fri, Sat 10:00 AM - 12:00 PM',
      room: 'Lab Room 302',
      teacherId: 'TCH-103', // Dr. Arif Hasan
      term: 'Fall 2024 - HSC 2025',
      description: 'Atomic structure, periodic properties, chemical bonding, organic nomenclature, hydrocarbons, reaction mechanisms, and qualitative analysis.',
      credits: 3.0,
      createdAt: '2024-02-01T08:00:00.000Z'
    },
    {
      id: 'CLS-104',
      code: 'ADM-MTH',
      title: 'University & Engineering Admission Math Masterclass',
      section: 'Admission Intensive Batch',
      schedule: 'Sat, Sun, Tue 06:00 PM - 07:30 PM',
      room: 'Auditorium 101',
      teacherId: 'TCH-101', // Tanvir Ahmed (Associated with multiple classes!)
      term: 'Admission 2024-25',
      description: 'Fast calculation shortcuts, high-yield engineering questions, BUET/CKRUET/DU past papers solving, and mock admission drills.',
      credits: 4.0,
      createdAt: '2024-02-01T08:00:00.000Z'
    }
  ];

  // Specific Enrollments (Only enrolled students attend specific classes!)
  const enrollments = [
    // CLS-101 (Physics): Rahim (STU-001), Tanim (STU-003), Farhana (STU-004)
    { id: 'ENR-001', classId: 'CLS-101', studentId: 'STU-2024-001', enrolledBy: 'TCH-102', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },
    { id: 'ENR-002', classId: 'CLS-101', studentId: 'STU-2024-003', enrolledBy: 'TCH-102', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },
    { id: 'ENR-003', classId: 'CLS-101', studentId: 'STU-2024-004', enrolledBy: 'TCH-102', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },

    // CLS-102 (Math): Rahim (STU-001), Sadia (STU-002), Sakib (STU-005)
    { id: 'ENR-004', classId: 'CLS-102', studentId: 'STU-2024-001', enrolledBy: 'TCH-101', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },
    { id: 'ENR-005', classId: 'CLS-102', studentId: 'STU-2024-002', enrolledBy: 'TCH-101', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },
    { id: 'ENR-006', classId: 'CLS-102', studentId: 'STU-2024-005', enrolledBy: 'TCH-101', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },

    // CLS-103 (Chemistry): Sadia (STU-002), Farhana (STU-004)
    { id: 'ENR-007', classId: 'CLS-103', studentId: 'STU-2024-002', enrolledBy: 'TCH-103', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },
    { id: 'ENR-008', classId: 'CLS-103', studentId: 'STU-2024-004', enrolledBy: 'TCH-103', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },

    // CLS-104 (Admission Math): Sakib (STU-005), Mehnaz (STU-006)
    { id: 'ENR-009', classId: 'CLS-104', studentId: 'STU-2024-005', enrolledBy: 'TCH-101', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' },
    { id: 'ENR-010', classId: 'CLS-104', studentId: 'STU-2024-006', enrolledBy: 'TCH-101', enrolledAt: '2024-02-05T09:00:00.000Z', status: 'active' }
  ];

  // Soft copies of notes (Lecture Notes / Handouts)
  const courseMaterials = [
    {
      id: 'MAT-101',
      classId: 'CLS-101',
      topic: 'Week 1: Vectors & Resolution',
      title: 'Chapter 01: Vector Analysis & Coordinate Systems - Handout',
      description: 'Comprehensive lecture notes on dot product, cross product, vector fields, and unit vectors with solved board exam questions.',
      fileName: 'Physics_Ch1_Vectors_Lecture_Notes.pdf',
      fileUrl: '/uploads/materials/Physics_Ch1_Vectors_Lecture_Notes.pdf',
      fileSize: '1.45 MB',
      fileType: 'pdf',
      uploadedBy: 'TCH-102',
      createdAt: '2024-02-10T11:00:00.000Z'
    },
    {
      id: 'MAT-102',
      classId: 'CLS-101',
      topic: 'Week 2: Newton Laws & Dynamics',
      title: 'Newtonian Mechanics Summary & Formula Sheet',
      description: 'Quick revision formula sheet for linear momentum, friction, banking of roads, and pulley system mechanics.',
      fileName: 'Newtonian_Mechanics_Formula_Sheet.pdf',
      fileUrl: '/uploads/materials/Newtonian_Mechanics_Formula_Sheet.pdf',
      fileSize: '890 KB',
      fileType: 'pdf',
      uploadedBy: 'TCH-102',
      createdAt: '2024-02-18T14:30:00.000Z'
    },
    {
      id: 'MAT-201',
      classId: 'CLS-102',
      topic: 'Week 1-2: Differential Calculus',
      title: 'Limits & Differentiation Master Handout',
      description: 'Derivation of standard formulas, L Hospital rule, chain rule, implicit functions, and tangent/normal problems.',
      fileName: 'Calculus_Differentiation_Formulas_Nexus.pdf',
      fileUrl: '/uploads/materials/Calculus_Differentiation_Formulas_Nexus.pdf',
      fileSize: '2.10 MB',
      fileType: 'pdf',
      uploadedBy: 'TCH-101',
      createdAt: '2024-02-12T10:15:00.000Z'
    },
    {
      id: 'MAT-301',
      classId: 'CLS-103',
      topic: 'Week 1: Electronic Configuration',
      title: 'Atomic Structure & Quantum Numbers Class Notes',
      description: 'Detailed explanation of Aufbau principle, Hund rule, Pauli exclusion, and electronic configurations of transition elements.',
      fileName: 'Atomic_Structure_Notes_Nexus.pdf',
      fileUrl: '/uploads/materials/Atomic_Structure_Notes_Nexus.pdf',
      fileSize: '1.75 MB',
      fileType: 'pdf',
      uploadedBy: 'TCH-103',
      createdAt: '2024-02-14T09:20:00.000Z'
    },
    {
      id: 'MAT-401',
      classId: 'CLS-104',
      topic: 'Week 1: Engineering Tricks',
      title: 'Calculus & Algebra Speed-Solving Sheet (BUET/CKRUET)',
      description: 'Admission special tricks to solve complex integrals, matrices, and coordinate geometry problems within 45 seconds.',
      fileName: 'Admission_Math_Shortcuts_Nexus.pdf',
      fileUrl: '/uploads/materials/Admission_Math_Shortcuts_Nexus.pdf',
      fileSize: '3.20 MB',
      fileType: 'pdf',
      uploadedBy: 'TCH-101',
      createdAt: '2024-02-15T18:00:00.000Z'
    }
  ];

  // External Links (Links to Google Drive, YouTube, LMS, etc.)
  const externalLinks = [
    {
      id: 'LNK-101',
      classId: 'CLS-101',
      topic: 'Interactive Visuals',
      title: 'PhET Interactive Simulation: Vector Addition in 2D',
      url: 'https://phet.colorado.edu/en/simulations/vector-addition',
      category: 'simulation',
      description: 'Interactive HTML5 simulation from University of Colorado for experimenting with vector components and resultant forces.',
      addedBy: 'TCH-102',
      createdAt: '2024-02-10T11:30:00.000Z'
    },
    {
      id: 'LNK-102',
      classId: 'CLS-101',
      topic: 'Video Lectures',
      title: 'Recorded Lecture: Friction & Circular Motion Dynamics',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      category: 'youtube',
      description: 'Watch the full 45-minute revision lecture explaining centripetal acceleration and bank angle calculations.',
      addedBy: 'TCH-102',
      createdAt: '2024-02-19T10:00:00.000Z'
    },
    {
      id: 'LNK-201',
      classId: 'CLS-102',
      topic: 'Lecture Drive Folder',
      title: 'Google Drive: Calculus Solved Exercise Scans & Graph Sheets',
      url: 'https://drive.google.com/drive/folders/sample-calculus-archive',
      category: 'google_drive',
      description: 'Cloud archive containing handwritten step-by-step solutions for exercise problems 9.1 to 9.7.',
      addedBy: 'TCH-101',
      createdAt: '2024-02-12T11:00:00.000Z'
    },
    {
      id: 'LNK-202',
      classId: 'CLS-102',
      topic: 'Reference Portal',
      title: 'Desmos Online Graphing Calculator for Curve Tracing',
      url: 'https://www.desmos.com/calculator',
      category: 'website',
      description: 'Use Desmos to visualize functions, asymptotes, and first/second derivatives for maxima-minima problems.',
      addedBy: 'TCH-101',
      createdAt: '2024-02-14T15:00:00.000Z'
    },
    {
      id: 'LNK-301',
      classId: 'CLS-103',
      topic: 'Organic Nomenclature',
      title: 'IUPAC Nomenclature Interactive Reference Guide',
      url: 'https://iupac.qmul.ac.uk',
      category: 'website',
      description: 'Official nomenclature guidelines for aliphatic and aromatic organic compounds.',
      addedBy: 'TCH-103',
      createdAt: '2024-02-16T12:00:00.000Z'
    }
  ];

  // Exams / Continuous Assessment
  const exams = [
    {
      id: 'EXM-101',
      classId: 'CLS-101',
      title: 'Class Test 1: Vectors & Kinematics',
      type: 'class_test',
      maxMarks: 20,
      weightPercentage: 15,
      examDate: '2024-02-25',
      isPublished: true,
      createdAt: '2024-02-20T08:00:00.000Z'
    },
    {
      id: 'EXM-102',
      classId: 'CLS-101',
      title: 'Midterm Examination: Mechanics & Energy',
      type: 'midterm',
      maxMarks: 50,
      weightPercentage: 35,
      examDate: '2024-03-15',
      isPublished: true,
      createdAt: '2024-03-01T08:00:00.000Z'
    },
    {
      id: 'EXM-103',
      classId: 'CLS-101',
      title: 'Class Test 2: Gravitation & Fluid Dynamics',
      type: 'class_test',
      maxMarks: 20,
      weightPercentage: 15,
      examDate: '2024-04-10',
      isPublished: true,
      createdAt: '2024-04-01T08:00:00.000Z'
    },
    {
      id: 'EXM-104',
      classId: 'CLS-101',
      title: 'Final Examination: Full Syllabus',
      type: 'final',
      maxMarks: 100,
      weightPercentage: 35,
      examDate: '2024-05-20',
      isPublished: true,
      createdAt: '2024-05-10T08:00:00.000Z'
    },
    // CLS-102 (Math)
    {
      id: 'EXM-201',
      classId: 'CLS-102',
      title: 'Class Test 1: Limits & Continuity',
      type: 'class_test',
      maxMarks: 20,
      weightPercentage: 15,
      examDate: '2024-02-28',
      isPublished: true,
      createdAt: '2024-02-20T08:00:00.000Z'
    },
    {
      id: 'EXM-202',
      classId: 'CLS-102',
      title: 'Midterm Examination: Differential Calculus',
      type: 'midterm',
      maxMarks: 50,
      weightPercentage: 35,
      examDate: '2024-03-20',
      isPublished: true,
      createdAt: '2024-03-05T08:00:00.000Z'
    }
  ];

  // Exam Marks / Results (Continuous Assessment Records)
  const examResults = [
    // CLS-101 (Physics) - Rahim (STU-001) - 1st Rank (Highest)
    {
      id: 'RES-001',
      examId: 'EXM-101',
      classId: 'CLS-101',
      studentId: 'STU-2024-001',
      marksObtained: 18.5,
      remarks: 'Excellent resolution of 3D vector components!',
      gradedBy: 'TCH-102',
      updatedAt: '2024-02-26T14:00:00.000Z'
    },
    {
      id: 'RES-002',
      examId: 'EXM-102',
      classId: 'CLS-101',
      studentId: 'STU-2024-001',
      marksObtained: 44.0,
      remarks: 'Solid grasp of Work-Energy theorem.',
      gradedBy: 'TCH-102',
      updatedAt: '2024-03-18T10:00:00.000Z'
    },
    {
      id: 'RES-003',
      examId: 'EXM-103',
      classId: 'CLS-101',
      studentId: 'STU-2024-001',
      marksObtained: 17.0,
      remarks: 'Good Bernoulli equation calculations.',
      gradedBy: 'TCH-102',
      updatedAt: '2024-04-12T11:00:00.000Z'
    },
    {
      id: 'RES-004',
      examId: 'EXM-104',
      classId: 'CLS-101',
      studentId: 'STU-2024-001',
      marksObtained: 88.0,
      remarks: 'Outstanding performance overall. Keep it up!',
      gradedBy: 'TCH-102',
      updatedAt: '2024-05-22T16:00:00.000Z'
    },

    // CLS-101 (Physics) - Tanim (STU-003) - 3rd Rank
    {
      id: 'RES-005',
      examId: 'EXM-101',
      classId: 'CLS-101',
      studentId: 'STU-2024-003',
      marksObtained: 14.0,
      remarks: 'Review cross product direction rules.',
      gradedBy: 'TCH-102',
      updatedAt: '2024-02-26T14:00:00.000Z'
    },
    {
      id: 'RES-006',
      examId: 'EXM-102',
      classId: 'CLS-101',
      studentId: 'STU-2024-003',
      marksObtained: 38.0,
      remarks: 'Fair attempt. Focus more on rotational inertia.',
      gradedBy: 'TCH-102',
      updatedAt: '2024-03-18T10:00:00.000Z'
    },

    // CLS-101 (Physics) - Farhana (STU-004) - 2nd Rank
    {
      id: 'RES-011',
      examId: 'EXM-101',
      classId: 'CLS-101',
      studentId: 'STU-2024-004',
      marksObtained: 16.5,
      remarks: 'Very good analytical approach.',
      gradedBy: 'TCH-102',
      updatedAt: '2024-02-26T14:00:00.000Z'
    },
    {
      id: 'RES-012',
      examId: 'EXM-102',
      classId: 'CLS-101',
      studentId: 'STU-2024-004',
      marksObtained: 41.0,
      remarks: 'Neat equations and proper units.',
      gradedBy: 'TCH-102',
      updatedAt: '2024-03-18T10:00:00.000Z'
    },

    // CLS-102 (Math) - Rahim (STU-001) - 1st Rank
    {
      id: 'RES-007',
      examId: 'EXM-201',
      classId: 'CLS-102',
      studentId: 'STU-2024-001',
      marksObtained: 19.0,
      remarks: 'Flawless limit calculations with trigonometric forms.',
      gradedBy: 'TCH-101',
      updatedAt: '2024-03-01T15:00:00.000Z'
    },
    {
      id: 'RES-008',
      examId: 'EXM-202',
      classId: 'CLS-102',
      studentId: 'STU-2024-001',
      marksObtained: 46.5,
      remarks: 'Top score in derivative applications.',
      gradedBy: 'TCH-101',
      updatedAt: '2024-03-22T12:00:00.000Z'
    },

    // CLS-102 (Math) - Sadia (STU-002) - 2nd Rank
    {
      id: 'RES-009',
      examId: 'EXM-201',
      classId: 'CLS-102',
      studentId: 'STU-2024-002',
      marksObtained: 18.0,
      remarks: 'Great working steps and neat presentation.',
      gradedBy: 'TCH-101',
      updatedAt: '2024-03-01T15:00:00.000Z'
    },
    {
      id: 'RES-010',
      examId: 'EXM-202',
      classId: 'CLS-102',
      studentId: 'STU-2024-002',
      marksObtained: 43.0,
      remarks: 'Very good understanding of successive differentiation.',
      gradedBy: 'TCH-101',
      updatedAt: '2024-03-22T12:00:00.000Z'
    }
  ];

  // Messaging (Student <-> Teacher)
  const messages = [
    {
      id: 'MSG-001',
      senderId: 'STU-2024-001', // Rahim
      receiverId: 'TCH-102',    // Nusrat Jahan
      classId: 'CLS-101',
      subject: 'Question on Vector Cross Product Problem 4',
      content: 'Assalamu Alaikum Ma’am, in today’s problem 4 from sheet 1, do we need to calculate the unit vector perpendicular to both vectors using the right-hand screw rule or the determinant method?',
      isRead: true,
      createdAt: '2024-02-12T16:20:00.000Z'
    },
    {
      id: 'MSG-002',
      senderId: 'TCH-102',
      receiverId: 'STU-2024-001',
      classId: 'CLS-101',
      subject: 'Re: Question on Vector Cross Product Problem 4',
      content: 'Wa Alaikum Assalam Rahim. You should use the matrix determinant method to find (A x B), and then divide by its magnitude |A x B| to get the unit normal vector. The right-hand screw rule is only for physical direction verification.',
      isRead: true,
      createdAt: '2024-02-12T17:05:00.000Z'
    },
    {
      id: 'MSG-003',
      senderId: 'STU-2024-001',
      receiverId: 'TCH-101', // Tanvir Ahmed
      classId: 'CLS-102',
      subject: 'Upcoming Calculus Class Test Format',
      content: 'Sir, will Class Test 1 include L’Hospital’s rule proofs, or only application problems?',
      isRead: true,
      createdAt: '2024-02-22T19:30:00.000Z'
    },
    {
      id: 'MSG-004',
      senderId: 'TCH-101',
      receiverId: 'STU-2024-001',
      classId: 'CLS-102',
      subject: 'Re: Upcoming Calculus Class Test Format',
      content: 'Only standard limit evaluations and direct application of L’Hospital’s rule for indeterminate forms 0/0 and inf/inf. No theoretical epsilon-delta proofs will be in CT 1.',
      isRead: false,
      createdAt: '2024-02-23T08:15:00.000Z'
    },
    {
      id: 'MSG-005',
      senderId: 'STU-2024-002', // Sadia
      receiverId: 'TCH-101',    // Tanvir Ahmed
      classId: 'CLS-102',
      subject: 'Request for Extra Problem Sheet on Integration',
      content: 'Sir, could you please provide a few extra practice questions for trigonometric substitution? I want to practice more for the upcoming Midterm.',
      isRead: false,
      createdAt: '2024-03-02T14:10:00.000Z'
    }
  ];

  // Announcements (Coaching center & Class specific)
  const announcements = [
    {
      id: 'ANN-001',
      classId: null, // Global
      title: 'Welcome to NexusAcademyLS - Academic Session 2024-2025',
      content: 'Welcome all students and teachers to Nexus Academy Learning Portal. All soft copies of lecture notes, exam grade reports, and messaging services are now available online.',
      priority: 'important',
      postedBy: 'ADM-001',
      createdAt: '2024-02-01T08:00:00.000Z'
    },
    {
      id: 'ANN-002',
      classId: 'CLS-101',
      title: 'Physics CT 2 Schedule and Syllabus Announcement',
      content: 'Class Test 2 will be held on April 10 during the regular morning slot. Syllabus: Gravitation, Kepler laws, and Fluid statics.',
      priority: 'important',
      postedBy: 'TCH-102',
      createdAt: '2024-04-01T09:00:00.000Z'
    },
    {
      id: 'ANN-003',
      classId: 'CLS-102',
      title: 'Special Extra Practice Class on Conic Sections',
      content: 'Tanvir Sir will conduct an additional problem-solving session on Parabola and Ellipse coordinate geometry this Friday at 4 PM.',
      priority: 'normal',
      postedBy: 'TCH-101',
      createdAt: '2024-03-10T10:00:00.000Z'
    }
  ];

  // Section Group Messages (Teacher + Enrolled Students)
  const sectionMessages = [
    {
      id: 'SMSG-001',
      classId: 'CLS-101',
      senderId: 'TCH-102',
      content: 'Welcome everyone to Physics Section A group! All lecture notes and weekly formula sheets will be uploaded in ELMS. Feel free to ask questions here.',
      attachmentUrl: null,
      attachmentName: null,
      attachmentType: null,
      attachmentSize: null,
      createdAt: '2024-02-06T10:00:00.000Z'
    },
    {
      id: 'SMSG-002',
      classId: 'CLS-101',
      senderId: 'STU-2024-001',
      content: 'Thank you Ma\'am! Is Vector cross product formula covered in CT 1?',
      attachmentUrl: null,
      attachmentName: null,
      attachmentType: null,
      attachmentSize: null,
      createdAt: '2024-02-06T11:15:00.000Z'
    },
    {
      id: 'SMSG-003',
      classId: 'CLS-101',
      senderId: 'TCH-102',
      content: 'Yes Rahim, both Dot Product and Cross Product rules are included in CT 1 syllabus.',
      attachmentUrl: null,
      attachmentName: null,
      attachmentType: null,
      attachmentSize: null,
      createdAt: '2024-02-06T11:45:00.000Z'
    }
  ];

  return {
    users,
    classes,
    enrollments,
    courseMaterials,
    externalLinks,
    exams,
    examResults,
    messages,
    announcements,
    sectionMessages
  };
}

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = getInitialData();
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);

        // Ensure essential demo baseline records exist alongside user-created records
        const initial = getInitialData();
        let changed = false;

        initial.users.forEach(u => {
          if (!this.data.users.some(existing => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
            this.data.users.push(u);
            changed = true;
          }
        });

        initial.classes.forEach(c => {
          if (!this.data.classes.some(existing => existing.id === c.id)) {
            this.data.classes.push(c);
            changed = true;
          }
        });

        if (!Array.isArray(this.data.enrollments)) this.data.enrollments = [];
        initial.enrollments.forEach(e => {
          if (!this.data.enrollments.some(existing => existing.id === e.id)) {
            this.data.enrollments.push(e);
            changed = true;
          }
        });

        if (!Array.isArray(this.data.courseMaterials)) this.data.courseMaterials = [];
        initial.courseMaterials.forEach(m => {
          if (!this.data.courseMaterials.some(existing => existing.id === m.id)) {
            this.data.courseMaterials.push(m);
            changed = true;
          }
        });

        if (!Array.isArray(this.data.externalLinks)) this.data.externalLinks = [];
        initial.externalLinks.forEach(l => {
          if (!this.data.externalLinks.some(existing => existing.id === l.id)) {
            this.data.externalLinks.push(l);
            changed = true;
          }
        });

        if (!Array.isArray(this.data.exams)) this.data.exams = [];
        initial.exams.forEach(x => {
          if (!this.data.exams.some(existing => existing.id === x.id)) {
            this.data.exams.push(x);
            changed = true;
          }
        });

        if (!Array.isArray(this.data.examResults)) this.data.examResults = [];
        initial.examResults.forEach(r => {
          if (!this.data.examResults.some(existing => existing.id === r.id)) {
            this.data.examResults.push(r);
            changed = true;
          }
        });

        if (!Array.isArray(this.data.messages)) this.data.messages = [];
        if (!Array.isArray(this.data.announcements)) this.data.announcements = [];
        if (!Array.isArray(this.data.sectionMessages)) this.data.sectionMessages = [];
        if (Array.isArray(initial.sectionMessages)) {
          initial.sectionMessages.forEach(sm => {
            if (!this.data.sectionMessages.some(existing => existing.id === sm.id)) {
              this.data.sectionMessages.push(sm);
              changed = true;
            }
          });
        }

        // Ensure teachers have their subject defined
        this.data.users.forEach(u => {
          if (u.role === 'teacher' && (!u.subject || u.subject === 'undefined')) {
            const nameLower = (u.name || '').toLowerCase();
            const emailLower = (u.email || '').toLowerCase();
            if (u.id === 'TCH-0260' || nameLower.includes('shamsil') || emailLower.includes('shamsil')) u.subject = 'Physics';
            else if (u.id === 'TCH-8911' || nameLower.includes('rana') || emailLower.includes('rana')) u.subject = 'Chemistry';
            else if (u.id === 'TCH-1600' || nameLower.includes('samun') || emailLower.includes('samun')) u.subject = 'Higher Mathematics';
            else if (u.id === 'TCH-4697' || nameLower.includes('mim') || emailLower.includes('mim')) u.subject = 'Biology';
            else if (u.id === 'TCH-101' || nameLower.includes('tanvir')) u.subject = 'Higher Mathematics';
            else if (u.id === 'TCH-102' || nameLower.includes('nusrat')) u.subject = 'Physics';
            else if (u.id === 'TCH-103' || nameLower.includes('arif')) u.subject = 'Chemistry';
            else u.subject = u.designation || 'General Science';
            changed = true;
          }
        });

        // Ensure classes have their subject defined
        this.data.classes.forEach(c => {
          if (!c.subject || c.subject === 'undefined') {
            const titleLower = (c.title || '').toLowerCase();
            const codeLower = (c.code || '').toLowerCase();
            if (titleLower.includes('phys') || codeLower.includes('phy')) c.subject = 'Physics';
            else if (titleLower.includes('chem') || codeLower.includes('chm')) c.subject = 'Chemistry';
            else if (titleLower.includes('math') || codeLower.includes('mth')) c.subject = 'Higher Mathematics';
            else if (titleLower.includes('bio')) c.subject = 'Biology';
            else c.subject = c.title || 'General';
            changed = true;
          }
        });

        if (changed) {
          this.save();
        }
      } catch (err) {
        console.error('Failed reading DB, re-initializing...', err);
        this.data = getInitialData();
        this.save();
      }
    }
  }

  save() {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // Users
  getUsers() {
    return this.data.users.map(({ passwordHash, ...rest }) => rest);
  }

  getUserById(id) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  }

  getUserWithHash(identifier, roleFilter = null) {
    if (!identifier) return null;
    let clean = identifier.trim().toLowerCase();

    // Check if user entered @admin, @teacher, or @student suffix
    let detectedRole = null;
    if (clean.includes('@admin')) {
      detectedRole = 'admin';
      clean = clean.replace('@admin', '').trim();
    } else if (clean.includes('@teacher')) {
      detectedRole = 'teacher';
      clean = clean.replace('@teacher', '').trim();
    } else if (clean.includes('@student')) {
      detectedRole = 'student';
      clean = clean.replace('@student', '').trim();
    }

    const role = roleFilter || detectedRole;

    // 1. Direct email match
    let user = this.data.users.find(u => u.email.toLowerCase() === identifier.toLowerCase());
    if (user) return user;

    // 2. Direct ID match (e.g. ADM-001, TCH-101, STU-2024-001)
    user = this.data.users.find(u => u.id.toLowerCase() === identifier.toLowerCase() || u.id.toLowerCase() === clean);
    if (user) return user;

    // 3. Username / prefix match with role filtering
    // e.g. "tanvir" with teacher role -> matches tanvir.math@nexusacademy.edu.bd
    // "admin" with admin role -> matches admin@nexusacademy.edu.bd
    const candidates = this.data.users.filter(u => {
      const emailPrefix = u.email.split('@')[0].toLowerCase();
      const firstName = u.name.split(' ')[0].toLowerCase();
      const matches = emailPrefix.startsWith(clean) || firstName === clean || u.id.toLowerCase() === clean;
      if (!matches) return false;
      if (role && u.role !== role) return false;
      return true;
    });

    if (candidates.length > 0) return candidates[0];

    // 4. If no role was specified ("kichu na thakle"), default to student
    if (!role || role === 'student') {
      const studentCandidate = this.data.users.find(u => {
        if (u.role !== 'student') return false;
        const emailPrefix = u.email.split('@')[0].toLowerCase();
        const firstName = u.name.split(' ')[0].toLowerCase();
        return emailPrefix.includes(clean) || firstName.includes(clean) || u.id.toLowerCase().includes(clean);
      });
      if (studentCandidate) return studentCandidate;
    }

    return null;
  }

  createUser(userData) {
    const exists = this.data.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (exists) {
      throw new Error('A user with this email address already exists.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(userData.password || 'nexus123', salt);

    let prefix = 'STU';
    if (userData.role === 'admin') prefix = 'ADM';
    if (userData.role === 'teacher') prefix = 'TCH';

    const id = `${prefix}-${Date.now().toString().slice(-4)}`;

    const newUser = {
      id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      role: userData.role,
      passwordHash,
      department: userData.department || (userData.role === 'student' ? 'General' : 'Science'),
      subject: userData.subject || (userData.role === 'teacher' ? (userData.designation || 'General Science') : ''),
      batch: userData.batch || '',
      designation: userData.designation || '',
      status: userData.status || 'active',
      avatar: userData.avatar || (userData.role === 'teacher' ? '👨‍🏫' : userData.role === 'admin' ? '👨‍💼' : '👨‍🎓'),
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found.');

    const user = this.data.users[idx];

    if (updates.password) {
      const salt = bcrypt.genSaltSync(10);
      user.passwordHash = bcrypt.hashSync(updates.password, salt);
    }

    if (updates.name) user.name = updates.name;
    if (updates.email) user.email = updates.email;
    if (updates.phone) user.phone = updates.phone;
    if (updates.role) user.role = updates.role;
    if (updates.department !== undefined) user.department = updates.department;
    if (updates.subject !== undefined) user.subject = updates.subject;
    if (updates.batch !== undefined) user.batch = updates.batch;
    if (updates.designation !== undefined) user.designation = updates.designation;
    if (updates.status !== undefined) user.status = updates.status;

    this.save();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  deleteUser(id) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found.');
    this.data.users.splice(idx, 1);
    // Remove enrollments
    this.data.enrollments = this.data.enrollments.filter(e => e.studentId !== id);
    this.save();
    return true;
  }

  // Classes
  getClasses() {
    return this.data.classes.map(c => {
      const teacher = this.getUserById(c.teacherId);
      const enrolledCount = this.data.enrollments.filter(e => e.classId === c.id && e.status === 'active').length;
      const materialsCount = (this.data.courseMaterials || []).filter(m => m.classId === c.id).length;
      const linksCount = (this.data.externalLinks || []).filter(l => l.classId === c.id).length;
      const examsCount = (this.data.exams || []).filter(e => e.classId === c.id).length;
      return {
        ...c,
        showRank: c.showRank !== false,
        subject: c.subject || c.title,
        teacherName: teacher ? teacher.name : 'Unassigned',
        teacherSubject: teacher ? (teacher.subject || teacher.designation || 'General') : 'General',
        enrolledCount,
        materialsCount,
        linksCount,
        examsCount
      };
    });
  }

  getClassById(id) {
    const c = this.data.classes.find(cls => cls.id === id);
    if (!c) return null;
    const teacher = this.getUserById(c.teacherId);
    const enrolledCount = this.data.enrollments.filter(e => e.classId === c.id && e.status === 'active').length;
    const materialsCount = (this.data.courseMaterials || []).filter(m => m.classId === c.id).length;
    const linksCount = (this.data.externalLinks || []).filter(l => l.classId === c.id).length;
    const examsCount = (this.data.exams || []).filter(e => e.classId === c.id).length;
    return {
      ...c,
      showRank: c.showRank !== false,
      subject: c.subject || c.title,
      teacherName: teacher ? teacher.name : 'Unassigned',
      teacherSubject: teacher ? (teacher.subject || teacher.designation || 'General') : 'General',
      enrolledCount,
      materialsCount,
      linksCount,
      examsCount
    };
  }

  createClass(classData) {
    const id = `CLS-${Date.now().toString().slice(-4)}`;
    const newClass = {
      id,
      code: classData.code,
      title: classData.title,
      subject: classData.subject || classData.title,
      section: classData.section || 'Regular',
      showRank: classData.showRank !== undefined ? Boolean(classData.showRank) : true,
      schedule: classData.schedule || 'TBA',
      room: classData.room || 'Mirpur Campus',
      teacherId: classData.teacherId,
      term: classData.term || '2024-2025',
      description: classData.description || '',
      credits: parseFloat(classData.credits) || 3.0,
      createdAt: new Date().toISOString()
    };
    this.data.classes.push(newClass);
    this.save();
    return this.getClassById(id);
  }

  updateClass(id, updates) {
    const c = this.data.classes.find(cls => cls.id === id);
    if (!c) throw new Error('Class not found.');
    if (updates.showRank !== undefined) updates.showRank = Boolean(updates.showRank);
    Object.assign(c, updates);
    this.save();
    return this.getClassById(id);
  }

  deleteClass(id) {
    this.data.classes = this.data.classes.filter(c => c.id !== id);
    this.data.enrollments = this.data.enrollments.filter(e => e.classId !== id);
    this.data.courseMaterials = this.data.courseMaterials.filter(m => m.classId !== id);
    this.data.externalLinks = this.data.externalLinks.filter(l => l.classId !== id);
    this.data.exams = this.data.exams.filter(e => e.classId !== id);
    this.data.examResults = this.data.examResults.filter(r => r.classId !== id);
    this.save();
    return true;
  }

  // Enrollments
  getEnrollments(classId = null) {
    let list = this.data.enrollments.filter(e => e.status === 'active');
    if (classId) {
      list = list.filter(e => e.classId === classId);
    }
    return list.map(e => {
      const student = this.getUserById(e.studentId);
      const cls = this.data.classes.find(c => c.id === e.classId);
      return {
        ...e,
        studentName: student ? student.name : 'Unknown Student',
        studentEmail: student ? student.email : '',
        studentBatch: student ? student.batch : '',
        studentPhone: student ? student.phone : '',
        studentAvatar: student ? (student.avatar || '👨‍🎓') : '👨‍🎓',
        studentDepartment: student ? (student.department || '') : '',
        classTitle: cls ? cls.title : '',
        classCode: cls ? cls.code : '',
        classSection: cls ? cls.section : ''
      };
    });
  }

  enrollStudent(classId, studentId, enrolledBy) {
    const existing = this.data.enrollments.find(e => e.classId === classId && e.studentId === studentId);
    if (existing) {
      if (existing.status === 'active') {
        throw new Error('Student is already enrolled in this class.');
      } else {
        existing.status = 'active';
        existing.enrolledBy = enrolledBy;
        existing.enrolledAt = new Date().toISOString();
        this.save();
        return existing;
      }
    }

    const newEnrollment = {
      id: `ENR-${Date.now().toString().slice(-5)}`,
      classId,
      studentId,
      enrolledBy,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    };
    this.data.enrollments.push(newEnrollment);
    this.save();
    return newEnrollment;
  }

  unenrollStudent(classId, studentId) {
    const initialLen = this.data.enrollments.length;
    this.data.enrollments = this.data.enrollments.filter(e => !(e.classId === classId && e.studentId === studentId));
    if (this.data.enrollments.length === initialLen) throw new Error('Enrollment not found.');
    this.save();
    return true;
  }

  // Student classes view (strictly enforced enrollment isolation)
  getClassesForStudent(studentId) {
    const enrolledClassIds = this.data.enrollments
      .filter(e => e.studentId === studentId && e.status === 'active')
      .map(e => e.classId);

    return this.getClasses().filter(c => enrolledClassIds.includes(c.id));
  }

  // Teacher classes view (A teacher can be associated with multiple classes)
  getClassesForTeacher(teacherId) {
    return this.getClasses().filter(c => c.teacherId === teacherId);
  }

  // Course Materials (Soft copies of notes)
  getMaterials(classId) {
    return this.data.courseMaterials
      .filter(m => m.classId === classId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createMaterial(materialData) {
    const id = `MAT-${Date.now().toString().slice(-5)}`;
    const newMaterial = {
      id,
      ...materialData,
      createdAt: new Date().toISOString()
    };
    this.data.courseMaterials.push(newMaterial);
    this.save();
    return newMaterial;
  }

  deleteMaterial(id) {
    const idx = this.data.courseMaterials.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Material not found.');
    const [removed] = this.data.courseMaterials.splice(idx, 1);
    this.save();
    return removed;
  }

  // External Links
  getLinks(classId) {
    return this.data.externalLinks
      .filter(l => l.classId === classId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createLink(linkData) {
    const id = `LNK-${Date.now().toString().slice(-5)}`;
    const newLink = {
      id,
      ...linkData,
      createdAt: new Date().toISOString()
    };
    this.data.externalLinks.push(newLink);
    this.save();
    return newLink;
  }

  deleteLink(id) {
    const idx = this.data.externalLinks.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Link not found.');
    this.data.externalLinks.splice(idx, 1);
    this.save();
    return true;
  }

  // Exams & Results
  getExams(classId) {
    return this.data.exams
      .filter(e => e.classId === classId)
      .sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
  }

  createExam(examData) {
    const id = `EXM-${Date.now().toString().slice(-5)}`;
    const newExam = {
      id,
      classId: examData.classId,
      title: examData.title,
      type: examData.type || 'class_test',
      maxMarks: parseFloat(examData.maxMarks) || 20,
      weightPercentage: parseFloat(examData.weightPercentage) || 10,
      examDate: examData.examDate || new Date().toISOString().split('T')[0],
      isPublished: examData.isPublished !== undefined ? examData.isPublished : true,
      createdAt: new Date().toISOString()
    };
    this.data.exams.push(newExam);
    this.save();
    return newExam;
  }

  deleteExam(id) {
    this.data.exams = this.data.exams.filter(e => e.id !== id);
    this.data.examResults = this.data.examResults.filter(r => r.examId !== id);
    this.save();
    return true;
  }

  getResultsForExam(examId) {
    return this.data.examResults.filter(r => r.examId === examId);
  }

  saveExamResult(resultData) {
    const { examId, classId, studentId, marksObtained, remarks, gradedBy } = resultData;
    let res = this.data.examResults.find(r => r.examId === examId && r.studentId === studentId);

    if (res) {
      res.marksObtained = parseFloat(marksObtained);
      res.remarks = remarks || res.remarks;
      res.gradedBy = gradedBy;
      res.updatedAt = new Date().toISOString();
    } else {
      res = {
        id: `RES-${Date.now().toString().slice(-5)}`,
        examId,
        classId,
        studentId,
        marksObtained: parseFloat(marksObtained),
        remarks: remarks || '',
        gradedBy,
        updatedAt: new Date().toISOString()
      };
      this.data.examResults.push(res);
    }
    this.save();
    return res;
  }

  // Comprehensive Student Grade Sheet & Rank Calculation (Coaching Center Merit Ranking)
  getStudentGradeSheet(studentId, classId = null) {
    let enrolledClasses = this.getClassesForStudent(studentId);
    if (classId) {
      enrolledClasses = enrolledClasses.filter(c => c.id === classId);
    }

    const currentStudentUser = this.getUserById(studentId);

    const report = enrolledClasses.map(cls => {
      // 1. SECTION-WISE CALCULATION (Enrolled students in this specific section/class)
      const sectionEnrollments = this.data.enrollments.filter(e => e.classId === cls.id && e.status === 'active');
      const totalSectionStudents = sectionEnrollments.length;

      const exams = this.getExams(cls.id).filter(e => e.isPublished);

      // Compute weighted marks for every enrolled student in this section
      const sectionScoreRanks = sectionEnrollments.map(enr => {
        let totalWeighted = 0;
        let totalPossible = 0;
        let rawObtained = 0;
        let rawPossible = 0;

        exams.forEach(exam => {
          const res = this.data.examResults.find(r => r.examId === exam.id && r.studentId === enr.studentId);
          const marksObtained = res && res.marksObtained !== null && res.marksObtained !== undefined ? res.marksObtained : null;
          if (marksObtained !== null && exam.maxMarks > 0) {
            const ratio = marksObtained / exam.maxMarks;
            totalWeighted += ratio * exam.weightPercentage;
            totalPossible += exam.weightPercentage;
            rawObtained += marksObtained;
            rawPossible += exam.maxMarks;
          }
        });

        const pct = totalPossible > 0 ? (totalWeighted / totalPossible) * 100 : 0;
        return {
          studentId: enr.studentId,
          totalWeighted: parseFloat(totalWeighted.toFixed(2)),
          rawObtained: parseFloat(rawObtained.toFixed(1)),
          rawPossible: parseFloat(rawPossible.toFixed(1)),
          percentage: parseFloat(pct.toFixed(2))
        };
      });

      // Sort descending by score for Section Rank
      sectionScoreRanks.sort((a, b) => b.totalWeighted - a.totalWeighted);

      // Section Rank
      const secRankIdx = sectionScoreRanks.findIndex(s => s.studentId === studentId);
      const sectionRank = secRankIdx !== -1 ? secRankIdx + 1 : totalSectionStudents;

      // Section Highest and Average Score
      const highestSectionScore = sectionScoreRanks.length > 0 ? sectionScoreRanks[0].totalWeighted : 0;
      const avgSectionScore = sectionScoreRanks.length > 0
        ? parseFloat((sectionScoreRanks.reduce((acc, s) => acc + s.totalWeighted, 0) / sectionScoreRanks.length).toFixed(1))
        : 0;

      // 2. COURSE-WISE RANK (Across all sections sharing this course code or title)
      const siblingClasses = this.data.classes.filter(c => c.code === cls.code || (c.title === cls.title && c.subject === cls.subject));
      const siblingIds = siblingClasses.map(s => s.id);
      const allCourseEnrollments = this.data.enrollments.filter(e => siblingIds.includes(e.classId) && e.status === 'active');
      const uniqueCourseStudentIds = [...new Set(allCourseEnrollments.map(e => e.studentId))];
      const totalCourseStudents = uniqueCourseStudentIds.length;

      const courseScoreRanks = uniqueCourseStudentIds.map(sid => {
        const studentEnr = allCourseEnrollments.find(e => e.studentId === sid);
        const stExams = studentEnr ? this.getExams(studentEnr.classId).filter(e => e.isPublished) : [];
        let totalWeighted = 0;
        let totalPossible = 0;
        stExams.forEach(exam => {
          const res = this.data.examResults.find(r => r.examId === exam.id && r.studentId === sid);
          if (res && res.marksObtained !== null && exam.maxMarks > 0) {
            totalWeighted += (res.marksObtained / exam.maxMarks) * exam.weightPercentage;
            totalPossible += exam.weightPercentage;
          }
        });
        const pct = totalPossible > 0 ? (totalWeighted / totalPossible) * 100 : 0;
        return { studentId: sid, totalWeighted, percentage: pct };
      });

      courseScoreRanks.sort((a, b) => b.totalWeighted - a.totalWeighted);
      const cRankIdx = courseScoreRanks.findIndex(s => s.studentId === studentId);
      const courseRank = cRankIdx !== -1 ? cRankIdx + 1 : totalCourseStudents;
      const classRank = courseRank;
      const totalClassStudents = totalCourseStudents;
      const highestClassScore = courseScoreRanks.length > 0 ? courseScoreRanks[0].totalWeighted : highestSectionScore;

      // Detailed Marks Breakdown for the target student
      let myTotalWeightedMarks = 0;
      let myTotalPossibleWeight = 0;
      let myTotalRawObtained = 0;
      let myTotalMaxRaw = 0;

      const marksBreakdown = exams.map(exam => {
        const result = this.data.examResults.find(r => r.examId === exam.id && r.studentId === studentId);
        const marksObtained = result && result.marksObtained !== null && result.marksObtained !== undefined ? result.marksObtained : null;
        let weightedScore = null;
        if (marksObtained !== null && exam.maxMarks > 0) {
          const ratio = marksObtained / exam.maxMarks;
          weightedScore = parseFloat((ratio * exam.weightPercentage).toFixed(2));
          myTotalWeightedMarks += weightedScore;
          myTotalPossibleWeight += exam.weightPercentage;
          myTotalRawObtained += marksObtained;
          myTotalMaxRaw += exam.maxMarks;
        }

        // Exam level highest and average
        const allExamResults = this.data.examResults.filter(r => r.examId === exam.id && r.marksObtained !== null);
        const examHighest = allExamResults.length > 0 ? Math.max(...allExamResults.map(r => r.marksObtained)) : exam.maxMarks;
        const examAvg = allExamResults.length > 0 ? parseFloat((allExamResults.reduce((a, b) => a + b.marksObtained, 0) / allExamResults.length).toFixed(1)) : 0;

        return {
          examId: exam.id,
          title: exam.title,
          type: exam.type,
          maxMarks: exam.maxMarks,
          weightPercentage: exam.weightPercentage,
          examDate: exam.examDate,
          marksObtained,
          weightedScore,
          examHighest,
          examAvg,
          remarks: result ? result.remarks : ''
        };
      });

      const normalizedPercentage = myTotalPossibleWeight > 0 ? parseFloat(((myTotalWeightedMarks / myTotalPossibleWeight) * 100).toFixed(1)) : 0;

      return {
        classId: cls.id,
        classCode: cls.code,
        classTitle: cls.title,
        section: cls.section,
        credits: cls.credits,
        showRank: cls.showRank !== false,
        teacherName: cls.teacherName,
        marksBreakdown,
        totalWeightedMarks: parseFloat(myTotalWeightedMarks.toFixed(2)),
        totalPossibleWeight: parseFloat(myTotalPossibleWeight.toFixed(2)),
        totalRawMarks: parseFloat(myTotalRawObtained.toFixed(1)),
        totalMaxRawMarks: parseFloat(myTotalMaxRaw.toFixed(1)),
        overallPercentage: normalizedPercentage,
        classRank,
        totalClassStudents,
        sectionRank,
        totalSectionStudents,
        courseRank,
        totalCourseStudents,
        highestSectionScore: parseFloat(highestSectionScore.toFixed(2)),
        highestClassScore: parseFloat(highestClassScore.toFixed(2)),
        averageClassScore: parseFloat(avgSectionScore.toFixed(2))
      };
    });

    return report;
  }

  // Messaging (Teacher <-> Student)
  getMessages(user1Id, user2Id, classId = null) {
    return this.data.messages
      .filter(m => {
        const matchUsers = (m.senderId === user1Id && m.receiverId === user2Id) ||
                           (m.senderId === user2Id && m.receiverId === user1Id);
        return matchUsers;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  getConversations(userId) {
    const userMap = new Map();

    this.data.messages.forEach(m => {
      let partnerId = null;
      if (m.senderId === userId) partnerId = m.receiverId;
      else if (m.receiverId === userId) partnerId = m.senderId;

      if (!partnerId) return;

      const partner = this.getUserById(partnerId);
      if (!partner) return;

      const cls = m.classId ? this.data.classes.find(c => c.id === m.classId) : null;
      const key = partnerId; // Consolidated conversation per partner

      const existing = userMap.get(key);
      const isUnread = m.receiverId === userId && !m.isRead;

      if (!existing || new Date(m.createdAt) > new Date(existing.lastMessageAt)) {
        userMap.set(key, {
          partnerId,
          partnerName: partner.name,
          partnerRole: partner.role,
          partnerAvatar: partner.avatar,
          partnerEmail: partner.email,
          classId: m.classId || (existing ? existing.classId : null),
          classTitle: cls ? cls.title : (existing ? existing.classTitle : ''),
          classCode: cls ? cls.code : (existing ? existing.classCode : ''),
          lastMessage: m.content || (m.attachmentName ? `[Attached: ${m.attachmentName}]` : ''),
          lastSubject: m.subject || '',
          lastMessageAt: m.createdAt,
          hasUnread: isUnread || (existing ? existing.hasUnread : false)
        });
      } else if (isUnread && existing) {
        existing.hasUnread = true;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  }

  sendMessage(msgData) {
    const id = `MSG-${Date.now().toString().slice(-5)}`;
    const newMsg = {
      id,
      senderId: msgData.senderId,
      receiverId: msgData.receiverId,
      classId: msgData.classId || null,
      subject: msgData.subject || '',
      content: msgData.content,
      attachmentUrl: msgData.attachmentUrl || null,
      attachmentName: msgData.attachmentName || null,
      attachmentType: msgData.attachmentType || null,
      attachmentSize: msgData.attachmentSize || null,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.messages.push(newMsg);
    this.save();
    return newMsg;
  }

  markAsRead(senderId, receiverId, classId = null) {
    let updated = 0;
    this.data.messages.forEach(m => {
      if (m.senderId === senderId && m.receiverId === receiverId) {
        if (!classId || m.classId === classId) {
          m.isRead = true;
          updated++;
        }
      }
    });
    if (updated > 0) this.save();
    return updated;
  }

  // -------------------------------------------------------------
  // Section Discussion Groups (Teacher + Enrolled Students)
  // -------------------------------------------------------------
  getUserSectionGroups(userId, userRole) {
    let classes = [];
    if (userRole === 'admin') {
      classes = this.getClasses();
    } else if (userRole === 'teacher') {
      classes = this.getClassesForTeacher(userId);
    } else if (userRole === 'student') {
      classes = this.getClassesForStudent(userId);
    }

    if (!Array.isArray(this.data.sectionMessages)) this.data.sectionMessages = [];

    return classes.map(cls => {
      const teacher = this.getUserById(cls.teacherId);
      const enrollments = this.data.enrollments.filter(e => e.classId === cls.id && e.status === 'active');
      const studentIds = enrollments.map(e => e.studentId);
      const students = this.data.users.filter(u => studentIds.includes(u.id));
      const memberCount = students.length + (teacher ? 1 : 0);

      const secMsgs = (this.data.sectionMessages || []).filter(m => m.classId === cls.id);
      const lastMsg = secMsgs.length > 0 ? secMsgs[secMsgs.length - 1] : null;
      let lastSender = lastMsg ? this.getUserById(lastMsg.senderId) : null;

      return {
        id: cls.id,
        classId: cls.id,
        code: cls.code,
        title: cls.title,
        subject: cls.subject || cls.title,
        section: cls.section || 'Regular',
        schedule: cls.schedule || 'TBA',
        room: cls.room || 'Mirpur Campus',
        teacherId: cls.teacherId,
        teacherName: teacher ? teacher.name : cls.teacherName,
        teacherAvatar: teacher ? (teacher.avatar || '👨‍🏫') : '👨‍🏫',
        teacherSubject: teacher ? (teacher.subject || teacher.designation || 'Faculty') : 'Faculty',
        memberCount,
        lastMessage: lastMsg ? (lastMsg.content || (lastMsg.attachmentName ? `[Attached: ${lastMsg.attachmentName}]` : '')) : 'No messages yet. Start section discussion!',
        lastSenderName: lastSender ? lastSender.name : '',
        lastMessageAt: lastMsg ? lastMsg.createdAt : cls.createdAt
      };
    }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  }

  getSectionGroupDetails(classId) {
    const cls = this.getClassById(classId);
    if (!cls) return null;
    const teacher = this.getUserById(cls.teacherId);
    const enrollments = this.data.enrollments.filter(e => e.classId === cls.id && e.status === 'active');
    const studentIds = enrollments.map(e => e.studentId);
    const students = this.data.users.filter(u => studentIds.includes(u.id));

    return {
      id: cls.id,
      classId: cls.id,
      code: cls.code,
      title: cls.title,
      subject: cls.subject || cls.title,
      section: cls.section || 'Regular',
      schedule: cls.schedule,
      room: cls.room,
      teacherId: cls.teacherId,
      teacherName: teacher ? teacher.name : cls.teacherName,
      teacherAvatar: teacher ? (teacher.avatar || '👨‍🏫') : '👨‍🏫',
      teacherSubject: teacher ? (teacher.subject || teacher.designation || 'Faculty') : 'Faculty',
      memberCount: students.length + (teacher ? 1 : 0),
      members: [
        ...(teacher ? [{
          id: teacher.id,
          name: teacher.name,
          role: 'teacher',
          avatar: teacher.avatar || '👨‍🏫',
          info: teacher.subject ? `${teacher.subject} Faculty Lead` : (teacher.designation || 'Teacher')
        }] : []),
        ...students.map(s => ({
          id: s.id,
          name: s.name,
          role: 'student',
          avatar: s.avatar || '👨‍🎓',
          info: s.batch || s.department || 'Enrolled Student'
        }))
      ]
    };
  }

  getSectionMessages(classId) {
    if (!Array.isArray(this.data.sectionMessages)) this.data.sectionMessages = [];
    return this.data.sectionMessages
      .filter(m => m.classId === classId)
      .map(m => {
        const sender = this.getUserById(m.senderId);
        return {
          ...m,
          senderName: sender ? sender.name : 'Unknown User',
          senderRole: sender ? sender.role : 'student',
          senderAvatar: sender ? (sender.avatar || (sender.role === 'teacher' ? '👨‍🏫' : '👨‍🎓')) : '👤',
          senderBatch: sender ? sender.batch : '',
          senderSubject: sender ? (sender.subject || sender.designation) : ''
        };
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  sendSectionMessage(msgData) {
    if (!Array.isArray(this.data.sectionMessages)) this.data.sectionMessages = [];
    const id = `SMSG-${Date.now().toString().slice(-5)}`;
    const newMsg = {
      id,
      classId: msgData.classId,
      senderId: msgData.senderId,
      content: msgData.content || '',
      attachmentUrl: msgData.attachmentUrl || null,
      attachmentName: msgData.attachmentName || null,
      attachmentType: msgData.attachmentType || null,
      attachmentSize: msgData.attachmentSize || null,
      createdAt: new Date().toISOString()
    };
    this.data.sectionMessages.push(newMsg);
    this.save();

    const sender = this.getUserById(msgData.senderId);
    return {
      ...newMsg,
      senderName: sender ? sender.name : 'Unknown User',
      senderRole: sender ? sender.role : 'student',
      senderAvatar: sender ? (sender.avatar || (sender.role === 'teacher' ? '👨‍🏫' : '👨‍🎓')) : '👤',
      senderBatch: sender ? sender.batch : '',
      senderSubject: sender ? (sender.subject || sender.designation) : ''
    };
  }

  // Notice Board & Announcements (All courses, teacher notices & exam dates)
  getNoticeBoardData(userId, role) {
    let classes = [];
    if (role === 'admin') {
      classes = this.getClasses();
    } else if (role === 'teacher') {
      classes = this.getClassesForTeacher(userId);
    } else {
      classes = this.getClassesForStudent(userId);
    }
    const classIds = classes.map(c => c.id);

    // 1. Filter Notices / Announcements
    const noticesRaw = this.data.announcements.filter(a => {
      if (role === 'admin') return true;
      return a.classId === null || classIds.includes(a.classId);
    });

    const notices = noticesRaw.map(a => {
      const cls = a.classId ? this.getClassById(a.classId) : null;
      const author = this.getUserById(a.postedBy);
      const readBy = Array.isArray(a.readBy) ? a.readBy : [];
      const isRead = readBy.includes(userId);
      return {
        ...a,
        classCode: cls ? cls.code : 'General',
        classTitle: cls ? cls.title : 'Nexus Academy Wide',
        section: cls ? cls.section : 'All Batches',
        teacherName: cls ? cls.teacherName : (author ? author.name : 'Academy Management'),
        authorName: author ? author.name : 'Academy Administration',
        authorRole: author ? author.role : 'admin',
        authorAvatar: author ? (author.avatar || (author.role === 'teacher' ? '👨‍🏫' : '👨‍💼')) : '👨‍💼',
        isRead,
        readCount: readBy.length
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 2. Filter Upcoming Exams
    const examsRaw = this.data.exams.filter(e => {
      if (role === 'admin') return true;
      if (role === 'teacher') return classIds.includes(e.classId);
      return e.isPublished && classIds.includes(e.classId);
    });

    const upcomingExams = examsRaw.map(e => {
      const cls = this.getClassById(e.classId);
      return {
        ...e,
        classCode: cls ? cls.code : 'EXAM',
        classTitle: cls ? cls.title : 'Course Assessment',
        section: cls ? cls.section : 'Regular',
        teacherName: cls ? cls.teacherName : 'Faculty Lead',
        subject: cls ? cls.subject : 'General'
      };
    }).sort((a, b) => {
      const dateA = a.examDate ? new Date(a.examDate).getTime() : 0;
      const dateB = b.examDate ? new Date(b.examDate).getTime() : 0;
      return dateA - dateB;
    });

    const urgentCount = notices.filter(n => n.priority === 'urgent' || n.category === 'urgent').length;
    const unreadCount = notices.filter(n => !n.isRead).length;

    return {
      notices,
      upcomingExams,
      stats: {
        totalNotices: notices.length,
        unreadCount,
        unreadNoticesCount: unreadCount,
        upcomingExamsCount: upcomingExams.length,
        urgentCount,
        enrolledClassesCount: classes.length
      },
      userClasses: classes.map(c => ({ id: c.id, code: c.code, title: c.title, section: c.section, teacherId: c.teacherId }))
    };
  }

  getAnnouncements(classId = null, userId = null) {
    return this.data.announcements
      .filter(a => a.classId === classId || a.classId === null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(a => {
        const author = this.getUserById(a.postedBy);
        const readBy = Array.isArray(a.readBy) ? a.readBy : [];
        return {
          ...a,
          authorName: author ? author.name : 'Administration',
          isRead: userId ? readBy.includes(userId) : false
        };
      });
  }

  markNoticeAsRead(noticeId, userId) {
    const ann = this.data.announcements.find(a => a.id === noticeId);
    if (!ann) return false;
    if (!Array.isArray(ann.readBy)) {
      ann.readBy = [];
    }
    if (!ann.readBy.includes(userId)) {
      ann.readBy.push(userId);
      this.save();
    }
    return true;
  }

  markAllNoticesAsRead(userId, role) {
    let classes = [];
    if (role === 'admin') {
      classes = this.getClasses();
    } else if (role === 'teacher') {
      classes = this.getClassesForTeacher(userId);
    } else {
      classes = this.getClassesForStudent(userId);
    }
    const classIds = classes.map(c => c.id);

    let changed = false;
    this.data.announcements.forEach(a => {
      const hasAccess = (role === 'admin' || a.classId === null || classIds.includes(a.classId));
      if (hasAccess) {
        if (!Array.isArray(a.readBy)) a.readBy = [];
        if (!a.readBy.includes(userId)) {
          a.readBy.push(userId);
          changed = true;
        }
      }
    });
    if (changed) this.save();
    return true;
  }

  getUnreadNoticesCount(userId, role) {
    let classes = [];
    if (role === 'admin') {
      classes = this.getClasses();
    } else if (role === 'teacher') {
      classes = this.getClassesForTeacher(userId);
    } else {
      classes = this.getClassesForStudent(userId);
    }
    const classIds = classes.map(c => c.id);

    return this.data.announcements.filter(a => {
      const hasAccess = (role === 'admin' || a.classId === null || classIds.includes(a.classId));
      if (!hasAccess) return false;
      const readBy = Array.isArray(a.readBy) ? a.readBy : [];
      return !readBy.includes(userId);
    }).length;
  }

  updateAnnouncement(id, data) {
    const ann = this.data.announcements.find(a => a.id === id);
    if (!ann) return null;
    if (data.title !== undefined) ann.title = data.title;
    if (data.content !== undefined) ann.content = data.content;
    if (data.priority !== undefined) ann.priority = data.priority;
    if (data.category !== undefined) ann.category = data.category;
    if (data.examDate !== undefined) ann.examDate = data.examDate || null;
    if (data.classId !== undefined) ann.classId = data.classId || null;
    ann.updatedAt = new Date().toISOString();
    this.save();
    return ann;
  }

  createAnnouncement(data) {
    const id = `ANN-${Date.now().toString().slice(-5)}`;
    const newAnn = {
      id,
      classId: data.classId || null,
      title: data.title,
      content: data.content,
      priority: data.priority || 'normal',
      category: data.category || (data.examDate ? 'exam' : 'general'),
      examDate: data.examDate || null,
      postedBy: data.postedBy,
      readBy: data.postedBy ? [data.postedBy] : [],
      createdAt: new Date().toISOString()
    };
    this.data.announcements.push(newAnn);
    this.save();
    return newAnn;
  }

  deleteAnnouncement(id) {
    const initialLen = this.data.announcements.length;
    this.data.announcements = this.data.announcements.filter(a => a.id !== id);
    if (this.data.announcements.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

const db = new Database();
module.exports = { db };
