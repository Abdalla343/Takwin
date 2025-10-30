const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Class = require('../models/Class');
const User = require('../models/User');
const StudentClass = require('../models/StudentClass');
const Subject = require('../models/Subject');

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied. Teacher role required.' });
  }
  next();
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Student role required.' });
  }
  next();
};

/**
 * @route   POST /api/classes
 * @desc    Create a new class (Teacher only)
 * @access  Private
 */
router.post('/', protect, isTeacher, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    const newClass = await Class.create({
      name,
      description,
      teacherId: req.user.id
    });

    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/classes
 * @desc    Get all classes for the authenticated teacher
 * @access  Private
 */
router.get('/', protect, isTeacher, async (req, res) => {
  try {
    const classes = await Class.findAll({
      where: { teacherId: req.user.id },
      include: [
        {
          model: User,
          as: 'students',
          through: { attributes: [] },
          attributes: ['id', 'name', 'email']
        },
        {
          model: Subject,
          as: 'subjects',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/classes/available-students
 * @desc    Get all students who are not enrolled in any class
 * @access  Private (Teacher only)
 */
router.get('/available-students', protect, isTeacher, async (req, res) => {
  try {
    // Get all students
    const allStudents = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email']
    });

    // Get students who are already enrolled in classes
    const enrolledStudents = await StudentClass.findAll({
      attributes: ['studentId']
    });

    const enrolledStudentIds = enrolledStudents.map(sc => sc.studentId);
    
    // Filter out enrolled students
    const availableStudents = allStudents.filter(
      student => !enrolledStudentIds.includes(student.id)
    );

    res.json(availableStudents);
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/classes/:id
 * @desc    Get a specific class with students and subjects
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const classId = req.params.id;
    
    const classData = await Class.findByPk(classId, {
      include: [
        {
          model: User,
          as: 'students',
          through: { attributes: [] },
          attributes: ['id', 'name', 'email']
        },
        {
          model: Subject,
          as: 'subjects',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is the teacher of this class or a student in this class
    const isTeacherOfClass = classData.teacherId === req.user.id;
    const isStudentInClass = req.user.role === 'student' && 
      classData.students.some(student => student.id === req.user.id);

    if (!isTeacherOfClass && !isStudentInClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(classData);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error44' });
  }
});

/**
 * @route   POST /api/classes/:id/students
 * @desc    Add students to a class (Teacher only)
 * @access  Private
 */
router.post('/:id/students', protect, isTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    // Check if class exists and belongs to the teacher
    const classData = await Class.findByPk(classId);
    if (!classData || classData.teacherId !== req.user.id) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }

    // Check if students exist and are not already enrolled
    const existingEnrollments = await StudentClass.findAll({
      where: { studentId: studentIds }
    });

    if (existingEnrollments.length > 0) {
      return res.status(400).json({ 
        message: 'Some students are already enrolled in other classes',
        enrolledStudents: existingEnrollments.map(e => e.studentId)
      });
    }

    // Add students to class
    const enrollments = studentIds.map(studentId => ({
      studentId,
      classId
    }));

    await StudentClass.bulkCreate(enrollments);

    res.json({ message: 'Students added to class successfully' });
  } catch (error) {
    console.error('Add students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/classes/:id/students/:studentId
 * @desc    Remove a student from a class (Teacher only)
 * @access  Private
 */
router.delete('/:id/students/:studentId', protect, isTeacher, async (req, res) => {
  try {
    const { id: classId, studentId } = req.params;

    // Check if class exists and belongs to the teacher
    const classData = await Class.findByPk(classId);
    if (!classData || classData.teacherId !== req.user.id) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }

    // Remove student from class
    const result = await StudentClass.destroy({
      where: { classId, studentId }
    });

    if (result === 0) {
      return res.status(404).json({ message: 'Student not found in this class' });
    }

    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
