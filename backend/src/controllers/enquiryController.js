import Enquiry from "../models/Enquiry.js";
import AcademicYear from "../models/AcademicYear.js";

// Get enquiries with search and filtering
export const getEnquiries = async (req, res) => {
  try {
    const { search, className, status, academicYearId } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Dropdown filters
    if (className) {
      query.interestedClass = className;
    }

    if (status) {
      query.status = status;
    }

    // Handle academic year filter
    if (academicYearId) {
      query.academicYear = academicYearId;
    } else {
      // Default to active current academic year if not passed
      const currentYear = await AcademicYear.findOne({ isCurrent: true });
      if (currentYear) {
        query.academicYear = currentYear._id;
      }
    }

    const enquiries = await Enquiry.find(query)
      .populate("academicYear", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new enquiry
export const createEnquiry = async (req, res) => {
  try {
    const {
      studentName,
      fatherName,
      motherName,
      mobileNumber,
      alternateMobile,
      email,
      dateOfBirth,
      gender,
      interestedClass,
      interestedStream,
      currentSchool,
      city,
      leadSource,
      remarks,
      counselorAssigned,
      followUpDate,
      academicYearId,
    } = req.body;

    const studentNameTrimmed = String(studentName || "").trim();
    const fatherNameTrimmed = String(fatherName || "").trim();
    const mobileNumberTrimmed = String(mobileNumber || "").trim();
    const interestedClassTrimmed = String(interestedClass || "").trim();

    // Validate required fields
    if (!studentNameTrimmed || !fatherNameTrimmed || !mobileNumberTrimmed || !interestedClassTrimmed) {
      return res.status(400).json({
        success: false,
        message: "Please fill required fields",
      });
    }

    // Validate mobile number format (exactly 10 digits)
    if (!/^\d{10}$/.test(mobileNumberTrimmed)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }

    // Determine Academic Year
    let targetAcademicYearId = academicYearId;
    if (!targetAcademicYearId) {
      const currentYear = await AcademicYear.findOne({ isCurrent: true });
      if (!currentYear) {
        return res.status(400).json({
          success: false,
          message: "No current Academic Year set. Complete Master Setup first.",
        });
      }
      targetAcademicYearId = currentYear._id;
    }

    // Duplicate mobile number check within same academic year
    const existingMobile = await Enquiry.findOne({
      mobileNumber: mobileNumberTrimmed,
      academicYear: targetAcademicYearId,
    });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Enquiry with this mobile number already exists for this academic year.",
      });
    }

    // Duplicate email check
    if (email) {
      const emailTrimmed = String(email || "").trim().toLowerCase();
      if (emailTrimmed) {
        const existingEmail = await Enquiry.findOne({
          email: emailTrimmed,
          academicYear: targetAcademicYearId,
        });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Enquiry with this email address already exists for this academic year.",
          });
        }
      }
    }

    const newEnquiry = new Enquiry({
      studentName: studentNameTrimmed,
      fatherName: fatherNameTrimmed,
      motherName: String(motherName || "").trim(),
      mobileNumber: mobileNumberTrimmed,
      alternateMobile: String(alternateMobile || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      dateOfBirth: dateOfBirth || null,
      gender: gender || "",
      interestedClass: interestedClassTrimmed,
      interestedStream: interestedStream || "",
      currentSchool: currentSchool || "",
      city: city || "",
      leadSource: leadSource || "Walk-In",
      remarks: remarks || "",
      counselorAssigned: counselorAssigned || "",
      followUpDate: followUpDate || null,
      status: "New",
      academicYear: targetAcademicYearId,
    });

    await newEnquiry.save();

    res.status(201).json({
      success: true,
      message: "Enquiry captured successfully.",
      data: newEnquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update an enquiry
export const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    // Validate fields if updated
    if (updateFields.studentName !== undefined && !String(updateFields.studentName || "").trim()) {
      return res.status(400).json({ success: false, message: "Please fill required fields" });
    }
    if (updateFields.fatherName !== undefined && !String(updateFields.fatherName || "").trim()) {
      return res.status(400).json({ success: false, message: "Please fill required fields" });
    }
    if (updateFields.interestedClass !== undefined && !String(updateFields.interestedClass || "").trim()) {
      return res.status(400).json({ success: false, message: "Please fill required fields" });
    }

    if (updateFields.mobileNumber !== undefined) {
      updateFields.mobileNumber = String(updateFields.mobileNumber || "").trim();
      if (!updateFields.mobileNumber) {
        return res.status(400).json({ success: false, message: "Please fill required fields" });
      }
      if (!/^\d{10}$/.test(updateFields.mobileNumber)) {
        return res.status(400).json({ success: false, message: "Invalid mobile number" });
      }

      // Check duplicate mobile
      if (updateFields.mobileNumber !== enquiry.mobileNumber) {
        const duplicateMobile = await Enquiry.findOne({
          mobileNumber: updateFields.mobileNumber,
          academicYear: enquiry.academicYear,
          _id: { $ne: id },
        });
        if (duplicateMobile) {
          return res.status(400).json({
            success: false,
            message: "Mobile number is already used in another enquiry.",
          });
        }
      }
    }

    // Check duplicate email
    if (updateFields.email !== undefined) {
      updateFields.email = String(updateFields.email || "").trim().toLowerCase();
      if (updateFields.email && updateFields.email !== enquiry.email) {
        const duplicateEmail = await Enquiry.findOne({
          email: updateFields.email,
          academicYear: enquiry.academicYear,
          _id: { $ne: id },
        });
        if (duplicateEmail) {
          return res.status(400).json({
            success: false,
            message: "Email address is already used in another enquiry.",
          });
        }
      }
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully.",
      data: updatedEnquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Convert enquiry to Admission
export const convertEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    enquiry.status = "Converted";
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: "Enquiry marked as converted.",
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
