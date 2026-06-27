# REST API Reference Specification

All endpoints reside under the base path `/api`. Endpoints secured with `protect` require an `Authorization: Bearer <JWT_Token>` request header.

---

## 1. Authentication & Profile Endpoints

### 1.1 Login User
- **Method / Route**: `POST /api/auth/login`
- **Purpose**: Authenticates credentials and returns session tokens.
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "identifier": "admin@erp.com",
    "password": "Admin@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "60c72b2f...",
      "fullName": "System Admin",
      "email": "admin@erp.com",
      "role": "ADMIN"
    }
  }
  ```

### 1.2 Update Profile Settings
- **Method / Route**: `PUT /api/auth/profile`
- **Purpose**: Updates details or avatar picture.
- **Authentication**: JWT Protected (Any Role)
- **Request Body (JSON)**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "teacher@erp.com"
  }
  ```
  *(Or FormData with `photo` binary parameter for photo upload)*
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "fullName": "Jane Doe",
      "email": "teacher@erp.com",
      "photoUrl": "/uploads/photo-1700..."
    }
  }
  ```

### 1.3 Change Password
- **Method / Route**: `POST /api/auth/change-password`
- **Purpose**: Updates authenticated user password.
- **Authentication**: JWT Protected (Any Role)
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

## 2. Dashboard Endpoints

### 2.1 Fetch Summary Metrics
- **Method / Route**: `GET /api/dashboard/summary`
- **Purpose**: Returns KPIs tailored to Admin, Teacher, or Parent context.
- **Authentication**: JWT Protected (Any Role)
- **Response (200 OK - Teacher Example)**:
  ```json
  {
    "success": true,
    "role": "TEACHER",
    "data": {
      "todaysClasses": [
        {
          "className": "Class 10",
          "sectionName": "A",
          "subjectName": "Mathematics",
          "time": "09:00 AM - 10:00 AM"
        }
      ],
      "assignedStudentsCount": 7,
      "studentAttendanceRateToday": 85,
      "upcomingExams": []
    }
  }
  ```

---

## 3. Student Management Endpoints

### 3.1 Fetch Student List
- **Method / Route**: `GET /api/students`
- **Purpose**: Queries student directories. Filters results matching the Teacher's class assignments or Parent's linked children.
- **Authentication**: JWT Protected (Any Role)
- **Query Parameters**: `?class=Class 10&section=A`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "students": [
      {
        "_id": "60c72b5f...",
        "firstName": "Test",
        "lastName": "Student",
        "admissionNo": "ADM001",
        "className": "Class 10",
        "sectionName": "A"
      }
    ]
  }
  ```

---

## 4. Admission Workflows

### 4.1 Process Application Approval
- **Method / Route**: `POST /api/admissions/applications/:id/approve`
- **Purpose**: Enrolls candidate as a student. Creates user accounts and fee assignments.
- **Authentication**: JWT Protected (`ADMIN` only)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Application approved and student enrolled successfully",
    "student": { "admissionNo": "ADM021", "className": "Class 10" }
  }
  ```

---

## 5. Fees & Finance Endpoints

### 5.1 Process Dues Payment Collection
- **Method / Route**: `POST /api/finance/payments/collect/:id`
- **Purpose**: Logs payment transaction against a fee assignment.
- **Authentication**: JWT Protected (`ADMIN` only)
- **Request Body**:
  ```json
  {
    "amountPaid": 5000,
    "paymentMode": "Cash",
    "remarks": "Term 1 Fees"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payment recorded successfully",
    "receipt": { "receiptNo": "REC-10023", "amountPaid": 5000 }
  }
  ```
