import AcademicYear from "../models/AcademicYear.js";
import Student from "../models/Student.js";
import Admission from "../models/Admission.js";
import StudentAttendance from "../models/StudentAttendance.js";
import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";
import Invoice from "../models/Invoice.js";
import ExamSchedule from "../models/ExamSchedule.js";
import StudentActivityLog from "../models/StudentActivityLog.js";

const generateAcademicYearName = (
    startDate,
    endDate
) => {
    const startYear =
        new Date(startDate).getFullYear();

    const endYear =
        new Date(endDate).getFullYear();

    return `${startYear}-${String(endYear).slice(-2)}`;
};

export const createAcademicYear = async (
    req,
    res
) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Start date and end date are required",
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message:
                    "End date must be greater than start date",
            });
        }

        const sessionName =
            generateAcademicYearName(
                startDate,
                endDate
            );

        const existingSession =
            await AcademicYear.findOne({
                name: sessionName,
            });

        if (existingSession) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic year already exists",
            });
        }

        const overlappingYear =
            await AcademicYear.findOne({
                $or: [
                    {
                        startDate: {
                            $lte: end,
                        },
                        endDate: {
                            $gte: start,
                        },
                    },
                ],
            });

        if (overlappingYear) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic year dates overlap with an existing session",
            });
        }

        const currentYearCount =
            await AcademicYear.countDocuments();

        const academicYear =
            await AcademicYear.create({
                name: sessionName,
                startDate,
                endDate,
                isCurrent:
                    currentYearCount === 0,
            });

        return res.status(201).json({
            success: true,
            message:
                "Academic year created successfully",
            academicYear,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAcademicYears =
  async (req, res) => {
    try {
      const academicYears =
        await AcademicYear.find().sort({
          startDate: 1,
        });

      return res.status(200).json({
        success: true,
        academicYears,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

export const getCurrentAcademicYear =
  async (req, res) => {
    try {
      const academicYear =
        await AcademicYear.findOne({
          isCurrent: true,
          isActive: true,
        });

      return res.status(200).json({
        success: true,
        academicYear,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

export const setCurrentAcademicYear =
    async (req, res) => {
        try {
            const { id } = req.params;

            const academicYear =
                await AcademicYear.findById(id);

            if (!academicYear) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Academic year not found",
                });
            }

            await AcademicYear.updateMany(
                {},
                {
                    isCurrent: false,
                }
            );

            academicYear.isCurrent = true;

            await academicYear.save();

            return res.status(200).json({
                success: true,
                message:
                    "Current academic year updated",
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

export const deleteAcademicYear =
  async (req, res) => {
    try {
      const { id } = req.params;

      const academicYear =
        await AcademicYear.findById(id);

      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message:
            "Academic year not found",
        });
      }

      if (academicYear.isCurrent) {
        return res.status(400).json({
          success: false,
          message:
            "Current academic year cannot be deleted",
        });
      }

      // Deep dependency checks
      const studentCount = await Student.countDocuments({ academicYear: id });
      const admissionCount = await Admission.countDocuments({ academicYear: id });
      const attendanceCount = await StudentAttendance.countDocuments({ academicYear: id });
      const examCount = await Exam.countDocuments({ academicYear: id });
      const resultCount = await ExamResult.countDocuments({ academicYear: id });
      
      const promotionCount = await Student.countDocuments({
        $or: [
          { "promotionHistory.fromAcademicYear": id },
          { "promotionHistory.toAcademicYear": id }
        ]
      });

      const studentsInYear = await Student.find({ academicYear: id }).select("_id");
      const studentIds = studentsInYear.map(s => s._id);
      const feeCount = await Invoice.countDocuments({ student: { $in: studentIds } });
      const scheduleCount = await ExamSchedule.countDocuments({ academicYear: id });
      const activityLogCount = await StudentActivityLog.countDocuments({ student: { $in: studentIds } });

      const totalDependencies = studentCount + admissionCount + attendanceCount + examCount + resultCount + promotionCount + feeCount + scheduleCount + activityLogCount;

      if (totalDependencies > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete academic year because records exist",
        });
      }

      await AcademicYear.deleteOne({
        _id: id,
      });

      return res.status(200).json({
        success: true,
        message:
          "Academic year deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
