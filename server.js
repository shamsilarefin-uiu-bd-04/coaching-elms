const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-academy-nexus-elms-secret-key-2024';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for Materials File Uploads
const uploadDir = path.join(__dirname, 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Configure Multer for Message Attachments (PDFs & Images)
const messageUploadDir = path.join(__dirname, 'uploads', 'messages');
if (!fs.existsSync(messageUploadDir)) {
  fs.mkdirSync(messageUploadDir, { recursive: true });
}

const messageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, messageUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
    cb(null, `msg-${base}-${uniqueSuffix}${ext}`);
  }
});

const uploadMessage = multer({
  storage: messageStorage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max for attachment
});

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token' });
    }
    const user = db.getUserById(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'Account not found or inactive' });
    }
    req.user = user;
    next();
  });
}

// Role Enforcement Middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions for this action' });
    }
    next();
  };
}

// Helper to check if a user has access to a specific class
function checkClassAccess(req, classId) {
  if (req.user.role === 'admin') return true;
  if (req.user.role === 'teacher') {
    const cls = db.getClassById(classId);
    return cls && cls.teacherId === req.user.id;
  }
  if (req.user.role === 'student') {
    const enrollments = db.data.enrollments;
    return enrollments.some(e => e.classId === classId && e.studentId === req.user.id && e.status === 'active');
  }
  return false;
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// -------------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { email, username, password, role } = req.body;
  const identifier = email || username;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username / Email and password are required' });
  }

  const userWithHash = db.getUserWithHash(identifier, role || null);
  if (!userWithHash) {
    return res.status(401).json({ error: 'Account not found. Please verify your credentials or selected role.' });
  }

  if (userWithHash.status !== 'active') {
    return res.status(403).json({ error: 'This account has been deactivated. Please contact administration.' });
  }

  const isMatch = bcrypt.compareSync(password, userWithHash.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const token = jwt.sign(
    { id: userWithHash.id, role: userWithHash.role, email: userWithHash.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...userSafe } = userWithHash;

  // Direct redirection guidance
  let defaultPanel = 'student';
  if (userSafe.role === 'admin') defaultPanel = 'admin';
  else if (userSafe.role === 'teacher') defaultPanel = 'teacher';

  res.json({
    token,
    user: userSafe,
    defaultPanel,
    message: `Welcome back, ${userSafe.name}!`
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required' });
  }

  const userWithHash = db.data.users.find(u => u.id === req.user.id);
  if (!bcrypt.compareSync(oldPassword, userWithHash.passwordHash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  db.updateUser(req.user.id, { password: newPassword });
  res.json({ success: true, message: 'Password updated successfully' });
});

// -------------------------------------------------------------
// 2. CLASSES / COURSES ROUTES
// -------------------------------------------------------------

// List classes - strict isolation according to role
app.get('/api/classes', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    // Admin has master access across all academy classes
    return res.json(db.getClasses());
  }
  if (req.user.role === 'teacher') {
    // Teachers ONLY have access to the sections/courses they are assigned to teach
    return res.json(db.getClassesForTeacher(req.user.id));
  }
  if (req.user.role === 'student') {
    // Students will be enrolled only in the specific classes they attend!
    return res.json(db.getClassesForStudent(req.user.id));
  }
  res.json([]);
});

app.get('/api/classes/:id', authenticateToken, (req, res) => {
  const classId = req.params.id;
  if (!checkClassAccess(req, classId)) {
    return res.status(403).json({ error: 'You are not enrolled in or authorized for this class' });
  }

  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  res.json(cls);
});

// Create Class (Admin only)
app.post('/api/classes', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { code, title, subject, section, schedule, room, teacherId, term, description, credits } = req.body;
    if (!code || !title || !teacherId) {
      return res.status(400).json({ error: 'Class code, title, and assigned teacher are required' });
    }
    const teacher = db.getUserById(teacherId);
    const assignedSubject = subject || (teacher ? (teacher.subject || teacher.designation) : title);
    const newClass = db.createClass({ code, title, subject: assignedSubject, section, schedule, room, teacherId, term, description, credits });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Class (Admin or assigned Teacher)
app.put('/api/classes/:id', authenticateToken, (req, res) => {
  const classId = req.params.id;
  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (req.user.role !== 'admin' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'Only the assigned teacher or administrator can update this class' });
  }

  const updated = db.updateClass(classId, req.body);
  res.json(updated);
});

// Delete Class (Admin only)
app.delete('/api/classes/:id', authenticateToken, requireRole('admin'), (req, res) => {
  db.deleteClass(req.params.id);
  res.json({ success: true, message: 'Class deleted successfully' });
});

// -------------------------------------------------------------
// 3. ENROLLMENT MANAGEMENT (Exclusively by Teacher & Admin)
// -------------------------------------------------------------

// Get enrolled students for a class
app.get('/api/classes/:id/students', authenticateToken, (req, res) => {
  const classId = req.params.id;
  if (!checkClassAccess(req, classId)) {
    return res.status(403).json({ error: 'Unauthorized to view roster' });
  }

  const enrollments = db.getEnrollments(classId);
  res.json(enrollments);
});

// Get registered students with their current enrollments
// - Teachers can ONLY view students who are enrolled in their assigned classes/sections
// - Teachers CANNOT view all students in the academy or other teachers' students
// - Admin can view all students academy-wide
app.get('/api/students', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const allStudents = db.getUsers().filter(u => u.role === 'student');
  const allEnrollments = db.data.enrollments.filter(e => e.status === 'active');
  const allClasses = db.getClasses();

  let targetStudents = allStudents;
  let allowedClassIds = null;

  if (req.user.role === 'teacher') {
    // Teachers ONLY have access to students enrolled in their assigned classes/sections
    const myClasses = db.getClassesForTeacher(req.user.id);
    const myClassIds = new Set(myClasses.map(c => c.id));

    if (req.query.classId) {
      if (!myClassIds.has(req.query.classId)) {
        return res.status(403).json({ error: 'Access denied: You are not assigned to this class section' });
      }
      allowedClassIds = new Set([req.query.classId]);
    } else {
      allowedClassIds = myClassIds;
    }

    // Filter enrollments to only the teacher's authorized class(es)
    const myEnrollments = allEnrollments.filter(e => allowedClassIds.has(e.classId));
    const enrolledStudentIds = new Set(myEnrollments.map(e => e.studentId));

    // Strictly keep only students who are enrolled in this teacher's class(es)
    targetStudents = allStudents.filter(s => enrolledStudentIds.has(s.id));
  } else if (req.user.role === 'admin') {
    if (req.query.classId) {
      allowedClassIds = new Set([req.query.classId]);
      const classEnrollments = allEnrollments.filter(e => e.classId === req.query.classId);
      const enrolledStudentIds = new Set(classEnrollments.map(e => e.studentId));
      targetStudents = allStudents.filter(s => enrolledStudentIds.has(s.id));
    }
  }

  const result = targetStudents.map(s => {
    // Only return enrollments that the current user is authorized to view
    const sEnrollments = allEnrollments.filter(e => {
      if (e.studentId !== s.id) return false;
      if (allowedClassIds) return allowedClassIds.has(e.classId);
      return true;
    });

    const enrolledClasses = sEnrollments.map(e => {
      const cls = allClasses.find(c => c.id === e.classId);
      return cls ? {
        enrollmentId: e.id,
        classId: cls.id,
        code: cls.code,
        title: cls.title,
        section: cls.section,
        schedule: cls.schedule,
        room: cls.room,
        teacherName: cls.teacherName
      } : null;
    }).filter(Boolean);

    return {
      ...s,
      enrolledClasses,
      enrolledCount: enrolledClasses.length
    };
  });

  res.json(result);
});

// Register a new student (Teacher or Admin authority)
app.post('/api/students', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { name, email, password, phone, batch, department, initialClassId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Student name and email/username are required' });
    }

    const newStudent = db.createUser({
      name,
      email,
      role: 'student',
      password: password || 'nexus123',
      phone: phone || '',
      batch: batch || 'Regular',
      department: department || 'General'
    });

    let enrolledMessage = '';
    if (initialClassId) {
      try {
        db.enrollStudent(initialClassId, newStudent.id, req.user.id);
        const cls = db.getClassById(initialClassId);
        if (cls) enrolledMessage = ` and enrolled into ${cls.code} (${cls.section || 'Regular'})`;
      } catch (_) {}
    }

    res.status(201).json({
      success: true,
      student: newStudent,
      message: `${newStudent.name} registered successfully${enrolledMessage}!`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get eligible students available to be enrolled into this class
app.get('/api/classes/:id/available-students', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const classId = req.params.id;
  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: You can only view students for your own assigned class' });
  }

  const currentEnrolledStudentIds = db.data.enrollments
    .filter(e => e.classId === classId && e.status === 'active')
    .map(e => e.studentId);

  const availableStudents = db.getUsers()
    .filter(u => u.role === 'student' && u.status === 'active' && !currentEnrolledStudentIds.includes(u.id));

  res.json(availableStudents);
});

// Enroll a student (Teacher or Admin)
app.post('/api/classes/:id/enroll', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const classId = req.params.id;
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Student ID is required' });

  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'You are only authorized to enroll students into your own assigned section/class' });
  }

  try {
    const enrollment = db.enrollStudent(classId, studentId, req.user.id);
    const student = db.getUserById(studentId);
    res.status(201).json({
      success: true,
      enrollment,
      message: `${student ? student.name : 'Student'} has been enrolled in ${cls.title} (${cls.section || 'Regular'})`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Unenroll a student (Teacher or Admin)
app.delete('/api/classes/:id/enroll/:studentId', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const { id: classId, studentId } = req.params;
  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'You are only authorized to unenroll students from your own assigned section/class' });
  }

  try {
    db.unenrollStudent(classId, studentId);
    res.json({ success: true, message: 'Student removed from class enrollment roster' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. COURSE MATERIALS (Soft Copies of Notes)
// -------------------------------------------------------------

// List materials (Enrolled Student, Teacher, Admin)
app.get('/api/classes/:id/materials', authenticateToken, (req, res) => {
  const classId = req.params.id;
  if (!checkClassAccess(req, classId)) {
    return res.status(403).json({ error: 'Access denied: You are not enrolled in this class' });
  }
  const materials = db.getMaterials(classId);
  res.json(materials);
});

// Upload/Add soft copies of notes - Only teachers (and admin) have the authority!
app.post('/api/classes/:id/materials', authenticateToken, requireRole('teacher', 'admin'), upload.single('file'), (req, res) => {
  const classId = req.params.id;
  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'Only the designated class teacher can add lecture materials' });
  }

  const { title, topic, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Material title is required' });

  let fileUrl = '';
  let fileName = '';
  let fileSize = 'Online Note';
  let fileType = 'text';

  if (req.file) {
    fileName = req.file.originalname;
    fileUrl = `/uploads/materials/${req.file.filename}`;
    const bytes = req.file.size;
    if (bytes >= 1024 * 1024) {
      fileSize = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      fileSize = `${Math.round(bytes / 1024)} KB`;
    }
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    fileType = ext || 'file';
  } else if (req.body.externalFileUrl) {
    fileUrl = req.body.externalFileUrl;
    fileName = req.body.externalFileName || 'Document.pdf';
    fileSize = 'Cloud File';
    fileType = 'pdf';
  } else {
    return res.status(400).json({ error: 'Please attach a document file (PDF, PPT, Word, image)' });
  }

  const material = db.createMaterial({
    classId,
    topic: topic || 'General Resources',
    title,
    description: description || '',
    fileName,
    fileUrl,
    fileSize,
    fileType,
    uploadedBy: req.user.id
  });

  res.status(201).json(material);
});

// Delete material (Teacher or Admin)
app.delete('/api/materials/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const mat = db.data.courseMaterials.find(m => m.id === req.params.id);
    if (!mat) return res.status(404).json({ error: 'Material not found' });

    if (req.user.role === 'teacher') {
      const cls = db.getClassById(mat.classId);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this material' });
      }
    }

    // Try deleting physical file if local
    if (mat.fileUrl.startsWith('/uploads/materials/')) {
      const filePath = path.join(__dirname, mat.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
    }

    db.deleteMaterial(req.params.id);
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. EXTERNAL LINKS (YouTube, Google Drive, LMS, Web Links)
// -------------------------------------------------------------

// List external links
app.get('/api/classes/:id/links', authenticateToken, (req, res) => {
  const classId = req.params.id;
  if (!checkClassAccess(req, classId)) {
    return res.status(403).json({ error: 'Access denied: You are not enrolled in this class' });
  }
  const links = db.getLinks(classId);
  res.json(links);
});

// Add external link - Only teachers (and admin) have the authority!
app.post('/api/classes/:id/links', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const classId = req.params.id;
  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'Only the assigned teacher can add external links for this class' });
  }

  const { title, url, topic, category, description } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Link title and URL are required' });
  }

  let finalUrl = url.trim();
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl;
  }

  let detectedCategory = category || 'website';
  if (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) detectedCategory = 'youtube';
  else if (finalUrl.includes('drive.google.com')) detectedCategory = 'google_drive';
  else if (finalUrl.includes('zoom.us') || finalUrl.includes('meet.google.com')) detectedCategory = 'zoom';

  const link = db.createLink({
    classId,
    title,
    url: finalUrl,
    topic: topic || 'Important Links',
    category: detectedCategory,
    description: description || '',
    addedBy: req.user.id
  });

  res.status(201).json(link);
});

// Delete external link
app.delete('/api/links/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const link = db.data.externalLinks.find(l => l.id === req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });

  if (req.user.role === 'teacher') {
    const cls = db.getClassById(link.classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this link' });
    }
  }

  db.deleteLink(req.params.id);
  res.json({ success: true, message: 'Link removed successfully' });
});

// -------------------------------------------------------------
// 6. EXAMS & RESULTS (UCAM Continuous Assessment & Grades)
// -------------------------------------------------------------

// List exams for a class
app.get('/api/classes/:id/exams', authenticateToken, (req, res) => {
  const classId = req.params.id;
  if (!checkClassAccess(req, classId)) {
    return res.status(403).json({ error: 'Access denied: You are not enrolled in this class' });
  }

  let exams = db.getExams(classId);
  if (req.user.role === 'student') {
    exams = exams.filter(e => e.isPublished);
  }
  res.json(exams);
});

// Create an exam / assessment (Teacher or Admin)
app.post('/api/classes/:id/exams', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const classId = req.params.id;
  const cls = db.getClassById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'Only the assigned teacher can create exams for this class' });
  }

  const { title, type, maxMarks, weightPercentage, examDate, isPublished } = req.body;
  if (!title || !maxMarks) {
    return res.status(400).json({ error: 'Exam title and maximum marks are required' });
  }

  const exam = db.createExam({
    classId,
    title,
    type,
    maxMarks,
    weightPercentage: weightPercentage || 10,
    examDate,
    isPublished: isPublished !== undefined ? isPublished : true
  });

  res.status(201).json(exam);
});

// Delete Exam
app.delete('/api/exams/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  db.deleteExam(req.params.id);
  res.json({ success: true, message: 'Exam and associated marks deleted successfully' });
});

// Get marks roster for an exam (Teacher/Admin view)
app.get('/api/exams/:id/roster', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const exam = db.data.exams.find(e => e.id === req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const cls = db.getClassById(exam.classId);
  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'You are not authorized to view the marks roster for another teacher\'s class' });
  }

  const enrolledStudents = db.getEnrollments(exam.classId);
  const results = db.getResultsForExam(exam.id);

  const roster = enrolledStudents.map(e => {
    const res = results.find(r => r.studentId === e.studentId);
    return {
      studentId: e.studentId,
      studentName: e.studentName,
      studentBatch: e.studentBatch,
      marksObtained: res ? res.marksObtained : null,
      remarks: res ? res.remarks : '',
      updatedAt: res ? res.updatedAt : null
    };
  });

  res.json({ exam, roster });
});

// Submit/Save Marks for an Exam (Single or Batch)
app.post('/api/exams/:id/results', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const exam = db.data.exams.find(e => e.id === req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const cls = db.getClassById(exam.classId);
  if (req.user.role === 'teacher' && cls.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'Only the assigned teacher can enter marks for this exam' });
  }

  const { marks } = req.body; // array of { studentId, marksObtained, remarks } or single object
  if (!marks) return res.status(400).json({ error: 'Marks payload is required' });

  const marksList = Array.isArray(marks) ? marks : [marks];

  marksList.forEach(m => {
    if (m.studentId !== undefined && m.marksObtained !== null && m.marksObtained !== '') {
      db.saveExamResult({
        examId: exam.id,
        classId: exam.classId,
        studentId: m.studentId,
        marksObtained: m.marksObtained,
        remarks: m.remarks || '',
        gradedBy: req.user.id
      });
    }
  });

  res.json({ success: true, message: 'Marks updated successfully' });
});

// Student Grade Sheet & Rank Summary (UCAM Assessment View)
app.get('/api/gradesheet', authenticateToken, (req, res) => {
  let targetStudentId = req.user.id;
  const { studentId, classId } = req.query;

  if (req.user.role === 'admin' || req.user.role === 'teacher') {
    if (studentId) targetStudentId = studentId;
  }

  const student = db.getUserById(targetStudentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const gradeSheet = db.getStudentGradeSheet(targetStudentId, classId);

  // Overall Rank & Performance Summary
  let totalWeightedScore = 0;
  let totalMaxWeight = 0;
  let ranksList = [];

  gradeSheet.forEach(course => {
    totalWeightedScore += course.totalWeightedMarks;
    totalMaxWeight += course.totalPossibleWeight;
    if (course.showRank && course.classRank) ranksList.push(course.classRank);
  });

  const bestRank = ranksList.length > 0 ? Math.min(...ranksList) : null;
  const overallAvgScore = totalMaxWeight > 0 ? parseFloat(((totalWeightedScore / totalMaxWeight) * 100).toFixed(1)) : 0;

  res.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      batch: student.batch,
      department: student.department
    },
    bestRank,
    overallAvgScore,
    totalEnrolledCourses: gradeSheet.length,
    courses: gradeSheet
  });
});

// -------------------------------------------------------------
// 7. DIRECT & SECTION GROUP MESSAGING
// -------------------------------------------------------------

// 7A. SECTION DISCUSSION GROUPS (Teacher + Enrolled Students)
// Get list of enrolled section groups for current user
app.get('/api/messages/groups', authenticateToken, (req, res) => {
  const groups = db.getUserSectionGroups(req.user.id, req.user.role);
  res.json(groups);
});

// Get messages and member details for a specific section group
app.get('/api/messages/groups/:classId', authenticateToken, (req, res) => {
  const classId = req.params.classId;
  if (!checkClassAccess(req, classId)) {
    return res.status(403).json({ error: 'Access denied: You are not enrolled in or assigned to this section group.' });
  }

  const group = db.getSectionGroupDetails(classId);
  if (!group) return res.status(404).json({ error: 'Section group not found' });

  const messages = db.getSectionMessages(classId);
  res.json({ group, messages });
});

// Post a message to a section group (with optional PDF or Image attachment)
app.post('/api/messages/groups/:classId', authenticateToken, uploadMessage.single('attachment'), (req, res) => {
  const classId = req.params.classId;
  if (!checkClassAccess(req, classId)) {
    return res.status(403).json({ error: 'Access denied: You are not enrolled in or assigned to this section group.' });
  }

  const { content } = req.body;
  if ((!content || !content.trim()) && !req.file) {
    return res.status(400).json({ error: 'Please enter a message or attach a file (PDF or Image)' });
  }

  let attachmentUrl = null;
  let attachmentName = null;
  let attachmentType = null;
  let attachmentSize = null;

  if (req.file) {
    attachmentName = req.file.originalname;
    attachmentUrl = `/uploads/messages/${req.file.filename}`;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      attachmentType = 'image';
    } else if (ext === 'pdf') {
      attachmentType = 'pdf';
    } else {
      attachmentType = 'file';
    }

    const bytes = req.file.size;
    attachmentSize = bytes >= 1024 * 1024 
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` 
      : `${Math.round(bytes / 1024)} KB`;
  }

  const message = db.sendSectionMessage({
    classId,
    senderId: req.user.id,
    content: (content || '').trim(),
    attachmentUrl,
    attachmentName,
    attachmentType,
    attachmentSize
  });

  res.status(201).json(message);
});

// 7B. DIRECT MESSAGING (Student <-> Teacher / Classmate)
// Get list of conversations for current user
app.get('/api/messages/conversations', authenticateToken, (req, res) => {
  const conversations = db.getConversations(req.user.id);
  res.json(conversations);
});

// Get message history with a specific partner
app.get('/api/messages/:partnerId', authenticateToken, (req, res) => {
  const partnerId = req.params.partnerId;
  const classId = req.query.classId || null;

  const partner = db.getUserById(partnerId);
  if (!partner) return res.status(404).json({ error: 'Recipient not found' });

  // Mark incoming messages as read
  db.markAsRead(partnerId, req.user.id, classId);

  const messages = db.getMessages(req.user.id, partnerId, classId);
  res.json({ partner, messages });
});

// Send a message (with optional PDF or Image attachment)
app.post('/api/messages', authenticateToken, uploadMessage.single('attachment'), (req, res) => {
  const { receiverId, classId, subject, content } = req.body;
  if (!receiverId) {
    return res.status(400).json({ error: 'Recipient is required' });
  }

  if ((!content || !content.trim()) && !req.file) {
    return res.status(400).json({ error: 'Please enter a message or attach a file (PDF or Image)' });
  }

  const receiver = db.getUserById(receiverId);
  if (!receiver) return res.status(404).json({ error: 'Recipient user not found' });

  // Validation: Student can ONLY message teachers of their ENROLLED classes, enrolled classmates, and admins
  // Students CANNOT text/message other non-enrolled teachers in the academy
  if (req.user.role === 'student') {
    if (receiver.role === 'teacher') {
      const myClasses = db.getClassesForStudent(req.user.id);
      const isMyTeacher = myClasses.some(c => c.teacherId === receiver.id);
      if (!isMyTeacher) {
        return res.status(403).json({ error: 'Access denied: You can only message teachers of your enrolled courses.' });
      }
    } else if (receiver.role === 'student') {
      const myClasses = db.getClassesForStudent(req.user.id).map(c => c.id);
      const receiverClasses = db.getClassesForStudent(receiver.id).map(c => c.id);
      const sharesClass = myClasses.some(id => receiverClasses.includes(id));
      if (!sharesClass) {
        return res.status(403).json({ error: 'Access denied: You can only message classmates in your enrolled courses.' });
      }
    } else if (receiver.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid recipient.' });
    }
  }

  // Validation: Teacher can ONLY message students enrolled in their classes/sections, fellow teachers, and admins
  if (req.user.role === 'teacher') {
    if (receiver.role === 'student') {
      const myClasses = db.getClassesForTeacher(req.user.id);
      const myClassIds = myClasses.map(c => c.id);
      const isMyStudent = db.data.enrollments.some(e => myClassIds.includes(e.classId) && e.studentId === receiver.id && e.status === 'active');
      if (!isMyStudent) {
        return res.status(403).json({ error: 'Access denied: You can only message students enrolled in your course sections.' });
      }
    }
  }

  let attachmentUrl = null;
  let attachmentName = null;
  let attachmentType = null;
  let attachmentSize = null;

  if (req.file) {
    attachmentName = req.file.originalname;
    attachmentUrl = `/uploads/messages/${req.file.filename}`;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      attachmentType = 'image';
    } else if (ext === 'pdf') {
      attachmentType = 'pdf';
    } else {
      attachmentType = 'file';
    }

    const bytes = req.file.size;
    attachmentSize = bytes >= 1024 * 1024 
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` 
      : `${Math.round(bytes / 1024)} KB`;
  }

  const message = db.sendMessage({
    senderId: req.user.id,
    receiverId,
    classId: classId || null,
    subject: subject || '',
    content: (content || '').trim(),
    attachmentUrl,
    attachmentName,
    attachmentType,
    attachmentSize
  });

  res.status(201).json(message);
});

// Available message recipients for the user
app.get('/api/messages-contacts', authenticateToken, (req, res) => {
  if (req.user.role === 'student') {
    // Student can ONLY message teachers of their ENROLLED classes, enrolled classmates, and admins
    // Non-enrolled teachers are strictly excluded from contacts
    const myClasses = db.getClassesForStudent(req.user.id);
    const myClassIds = myClasses.map(c => c.id);
    const myTeacherIds = new Set(myClasses.map(c => c.teacherId));

    const enrolledTeachers = db.getUsers().filter(u => u.role === 'teacher' && u.status === 'active' && myTeacherIds.has(u.id));
    const admins = db.getUsers().filter(u => u.role === 'admin' && u.status === 'active');

    // Fellow classmates in the same enrolled classes/sections
    const myEnrollments = db.data.enrollments.filter(e => myClassIds.includes(e.classId) && e.status === 'active');
    const classmateIds = new Set(myEnrollments.map(e => e.studentId).filter(id => id !== req.user.id));
    const classmates = db.getUsers().filter(u => classmateIds.has(u.id) && u.status === 'active').map(s => {
      const sharedClasses = myClasses.filter(c => myEnrollments.some(e => e.classId === c.id && e.studentId === s.id));
      return {
        ...s,
        isClassmate: true,
        classes: sharedClasses.map(c => ({ id: c.id, code: c.code, title: c.title, section: c.section }))
      };
    });

    const teacherContacts = enrolledTeachers.map(t => {
      const classesTaught = myClasses.filter(c => c.teacherId === t.id);
      return {
        ...t,
        isMyTeacher: true,
        classes: classesTaught.map(c => ({ id: c.id, code: c.code, title: c.title, section: c.section }))
      };
    });

    res.json([...teacherContacts, ...classmates, ...admins]);
  } else if (req.user.role === 'teacher') {
    // Teacher can ONLY see & message students enrolled in their classes, fellow teachers, and admins
    const myClasses = db.getClassesForTeacher(req.user.id);
    const myClassIds = myClasses.map(c => c.id);
    const enrollments = db.data.enrollments.filter(e => myClassIds.includes(e.classId) && e.status === 'active');
    const myStudentIds = new Set(enrollments.map(e => e.studentId));

    const enrolledStudents = db.getUsers().filter(u => u.role === 'student' && u.status === 'active' && myStudentIds.has(u.id));
    const fellowTeachers = db.getUsers().filter(u => u.role === 'teacher' && u.id !== req.user.id && u.status === 'active');
    const admins = db.getUsers().filter(u => u.role === 'admin' && u.status === 'active');

    const formattedStudents = enrolledStudents.map(s => {
      const myStudentEnrollments = enrollments.filter(e => e.studentId === s.id);
      const studentClasses = myStudentEnrollments.map(e => {
        const c = myClasses.find(cls => cls.id === e.classId);
        return c ? { id: c.id, code: c.code, title: c.title, section: c.section } : null;
      }).filter(Boolean);

      return {
        ...s,
        isMyStudent: true,
        classes: studentClasses
      };
    });

    res.json([...formattedStudents, ...fellowTeachers, ...admins]);
  } else {
    // Admin can message any active user
    const users = db.getUsers().filter(u => u.id !== req.user.id && u.status === 'active');
    res.json(users);
  }
});

// -------------------------------------------------------------
// 8. NOTICE BOARD & ANNOUNCEMENTS (All Courses, Teacher Notices & Exam Dates)
// -------------------------------------------------------------

// Comprehensive Notice Board Feed (Role-isolated for student & teacher, full for admin)
app.get('/api/notices', authenticateToken, (req, res) => {
  const data = db.getNoticeBoardData(req.user.id, req.user.role);
  res.json(data);
});

// Get count of unread notices for current user
app.get('/api/notices/unread-count', authenticateToken, (req, res) => {
  const unreadCount = db.getUnreadNoticesCount(req.user.id, req.user.role);
  res.json({ unreadCount });
});

// Mark a specific notice as read by current user
app.post('/api/notices/:id/read', authenticateToken, (req, res) => {
  const success = db.markNoticeAsRead(req.params.id, req.user.id);
  const unreadCount = db.getUnreadNoticesCount(req.user.id, req.user.role);
  res.json({ success, isRead: true, unreadCount });
});

app.post('/api/announcements/:id/read', authenticateToken, (req, res) => {
  const success = db.markNoticeAsRead(req.params.id, req.user.id);
  const unreadCount = db.getUnreadNoticesCount(req.user.id, req.user.role);
  res.json({ success, isRead: true, unreadCount });
});

// Mark all accessible notices as read for current user
app.post('/api/notices/mark-all-read', authenticateToken, (req, res) => {
  db.markAllNoticesAsRead(req.user.id, req.user.role);
  res.json({ success: true, unreadCount: 0 });
});

// Backward-compatible announcements endpoint
app.get('/api/announcements', authenticateToken, (req, res) => {
  const classId = req.query.classId || null;
  const list = db.getAnnouncements(classId, req.user.id);
  res.json(list);
});

// Post a Notice / Announcement (Teacher for own classes, Admin for all/global)
app.post('/api/notices', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const { classId, title, content, priority, category, examDate } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Notice title and content are required' });
  }

  if (req.user.role === 'teacher' && classId) {
    const cls = db.getClassById(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'You are only authorized to post notices for your assigned classes' });
    }
  }

  if (req.user.role === 'teacher' && !classId) {
    return res.status(403).json({ error: 'Teachers must select an assigned class for the notice' });
  }

  const notice = db.createAnnouncement({
    classId: classId || null,
    title,
    content,
    priority: priority || 'normal',
    category: category || (examDate ? 'exam' : 'general'),
    examDate: examDate || null,
    postedBy: req.user.id
  });

  res.status(201).json(notice);
});

app.post('/api/announcements', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const { classId, title, content, priority, category, examDate } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  if (req.user.role === 'teacher' && classId) {
    const cls = db.getClassById(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'You can only post notices for your assigned classes' });
    }
  }

  const ann = db.createAnnouncement({
    classId: classId || null,
    title,
    content,
    priority: priority || 'normal',
    category: category || (examDate ? 'exam' : 'general'),
    examDate: examDate || null,
    postedBy: req.user.id
  });

  res.status(201).json(ann);
});

// Edit / Update a Notice (Teacher for own notice, Admin for any)
app.put('/api/notices/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const notice = db.data.announcements.find(a => a.id === req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found' });

  if (req.user.role === 'teacher' && notice.postedBy !== req.user.id) {
    return res.status(403).json({ error: 'You are only authorized to edit your own posted notices' });
  }

  const { title, content, priority, category, examDate, classId } = req.body;
  if (req.user.role === 'teacher' && classId && classId !== notice.classId) {
    const cls = db.getClassById(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'You are only authorized to assign notices to your own classes' });
    }
  }

  const updated = db.updateAnnouncement(req.params.id, {
    title,
    content,
    priority,
    category,
    examDate,
    classId
  });

  res.json({ success: true, message: 'Notice updated successfully', notice: updated });
});

app.put('/api/announcements/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const notice = db.data.announcements.find(a => a.id === req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found' });

  if (req.user.role === 'teacher' && notice.postedBy !== req.user.id) {
    return res.status(403).json({ error: 'You are only authorized to edit your own posted notices' });
  }

  const { title, content, priority, category, examDate, classId } = req.body;
  if (req.user.role === 'teacher' && classId && classId !== notice.classId) {
    const cls = db.getClassById(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'You are only authorized to assign notices to your own classes' });
    }
  }

  const updated = db.updateAnnouncement(req.params.id, {
    title,
    content,
    priority,
    category,
    examDate,
    classId
  });

  res.json({ success: true, message: 'Notice updated successfully', announcement: updated });
});

// Delete a Notice (Teacher for own notice, Admin for any)
app.delete('/api/notices/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const notice = db.data.announcements.find(a => a.id === req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found' });

  if (req.user.role === 'teacher' && notice.postedBy !== req.user.id) {
    return res.status(403).json({ error: 'You are only authorized to delete your own posted notices' });
  }

  db.deleteAnnouncement(req.params.id);
  res.json({ success: true, message: 'Notice removed from notice board' });
});

app.delete('/api/announcements/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const notice = db.data.announcements.find(a => a.id === req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found' });

  if (req.user.role === 'teacher' && notice.postedBy !== req.user.id) {
    return res.status(403).json({ error: 'You are only authorized to delete your own posted notices' });
  }

  db.deleteAnnouncement(req.params.id);
  res.json({ success: true, message: 'Notice deleted successfully' });
});

// -------------------------------------------------------------
// 9. ADMINISTRATOR MANAGEMENT (Full Control Over The System)
// -------------------------------------------------------------

// Dashboard summary stats
app.get('/api/admin/stats', authenticateToken, requireRole('admin'), (req, res) => {
  const users = db.getUsers();
  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const classes = db.getClasses();
  const activeEnrollments = db.data.enrollments.filter(e => e.status === 'active').length;
  const materialsCount = db.data.courseMaterials.length;
  const linksCount = db.data.externalLinks.length;
  const examsCount = db.data.exams.length;

  res.json({
    totalUsers: users.length,
    studentsCount: students.length,
    teachersCount: teachers.length,
    classesCount: classes.length,
    activeEnrollments,
    materialsCount,
    linksCount,
    examsCount
  });
});

// User management list with role filtering
app.get('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
  const { role, search } = req.query;
  let users = db.getUsers();

  if (role) {
    users = users.filter(u => u.role === role);
  }

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.batch && u.batch.toLowerCase().includes(q))
    );
  }

  res.json(users);
});

// Create a new user (Student or Teacher or Admin)
app.post('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, email, role, password, phone, batch, department, designation, subject } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const newUser = db.createUser({
      name,
      email,
      role,
      password: password || 'nexus123',
      phone,
      batch,
      department,
      designation,
      subject: subject || (role === 'teacher' ? (designation || 'General Science') : '')
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user details
app.put('/api/admin/users/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const updated = db.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }
    db.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted from system' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reset user password
app.post('/api/admin/users/:id/reset-password', authenticateToken, requireRole('admin'), (req, res) => {
  const { newPassword } = req.body;
  const pass = newPassword || 'nexus123';
  db.updateUser(req.params.id, { password: pass });
  res.json({ success: true, message: `Password reset to: ${pass}` });
});

// Fallback to index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` NexusAcademyLS Portal is active on http://localhost:${PORT}`);
  console.log(` Coaching Center e-Learning & Academic System (UCAM & ELMS)`);
  console.log(`=======================================================`);
});
