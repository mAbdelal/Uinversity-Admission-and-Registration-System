
# Uinversity Admission and Registration System

This system is a simulation of the Admission and Registration system of the University of Palestine. It is developed for practice and educational purposes. Normally, this system must be integrated with other University systems such as the human resources system, financial system, academic affairs, and more. To enhance functionality, a portion of these features has been incorporated into this project.

## Features of the System

- Robust authentication
- Role-based and permission-based authorization
- Auditing and logging services
- MVC architecture implementation

## System Focus

The system is focused on the following key areas:

### 1. Students
- Allow creation, deletion, and updates of student records based on roles and permissions.
- Filtering students based on different metrics.
- Allow students to send requests to employees.
- Notification system.

### 2. Classes
- Create, update, and delete classes.
- Ensure semester consistency with classes.
- Enable the locking of classes.
- Full control over class scheduling.

### 3. Enrollments
- Allow students to enroll and unroll from classes.
- Enable employees to manage enrollments for students.
- Restrict and control enrollment actions based on academic policies.

## Controller Details

### Students Controller
Manages student-related operations including:
- CRUD operations for student records.
- Fetching academic records and managing documents.
- Notification system and auditing.

### Courses Controller
Handles course operations including:
- CRUD operations for courses.
- Course prerequisites and status management.
- Auditing and security.

### Classes Controller
Manages class-related operations:
- Scheduling and appointment management.
- Class status locking and status changes.
- Auditing and data integrity.

### Enrollment Controller
Handles student enrollments:
- Ensures enrollment prerequisites.
- Grade and status management for enrollments.
- Role-based access control for enrollment operations.

### Authentication Controller
Responsible for:
- User authentication using JWT tokens.
- Password management and reset functionality.
- Utility functions such as parsing time and ID prefix formatting.

### Employees Controller
Manages employee data:
- CRUD operations for employee records.
- Managing positions and qualifications.
- Notifications and auditing.

### Faculties Controller
Manages faculty and department operations:
- CRUD operations for faculties and departments.
- Ensures the proper structure of the academic hierarchy.

### Permissions Controller
Manages role-based access control (RBAC):
- Creation and management of permissions.
- Role assignments and validation.
- Auditing of permission-related actions.

### Requests Controller
Manages requests within the system:
- Creating, responding, and managing requests.
- Filtering and securing request operations.

## Middleware Overview

This system includes several middleware functions to ensure proper authentication, authorization, and access control:

### 1. authenticate
- Verifies user authentication using JWT tokens.
- Extracts user information and attaches it to the request.

### 2. authorizeRoleOrPermission
- Ensures the user has the correct role or permission to access resources.

### 3. ensureStudentSelfAccessOnly
- Restricts students to access only their own resources.

### 4. ensureStudentSelfAccess
- Allows employees to bypass self-access checks for students.

### 5. ensureEmployeeSelfAccess
- Ensures employees can only access their own resources.
