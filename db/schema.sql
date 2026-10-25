-- ============================================================================
-- VSBEC IT Task Manager - Complete Database DDL & RLS Policies
-- Compatible with 1-click execution via Database Client extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  batch VARCHAR(20),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, name)
);

-- 3. Users Table (RBAC Architecture)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'SUPREME_ADMIN', 'HOD', 'CLASS_ADVISOR', 'FACULTY', 'STUDENT'
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  register_number VARCHAR(50) UNIQUE,
  is_coordinator BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  gender VARCHAR(20),
  phone VARCHAR(50),
  bio TEXT,
  github_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  avatar_url VARCHAR(1000),
  telegram_chat_id VARCHAR(50),
  telegram_username VARCHAR(100),
  telegram_linked_at TIMESTAMP,
  leetcode_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tasks Table with 5-Minute Pre-Deadline Backup Tracking
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  external_link VARCHAR(1000),
  deadline TIMESTAMP,
  screenshot_instruction TEXT,
  custom_field_label VARCHAR(255),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'OPEN', -- 'OPEN', 'COMPLETED', 'ARCHIVED'
  poster_url VARCHAR(1000),
  poster_cloudinary_public_id VARCHAR(255),
  submission_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
  min_team_size INT DEFAULT 2,
  max_team_size INT DEFAULT 5,
  backed_up_deadline TIMESTAMP,
  backup_file_path VARCHAR(1000),
  backup_taken_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Task Classes Mapping
CREATE TABLE IF NOT EXISTS task_classes (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, class_id)
);

-- 6. Task Submissions Table
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  custom_field_value TEXT,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'
  screenshot_url VARCHAR(1000),
  cloudinary_public_id VARCHAR(255),
  verification_note TEXT,
  rejection_reason TEXT,
  resubmission_count INT DEFAULT 0,
  original_filename VARCHAR(500),
  not_participating BOOLEAN DEFAULT FALSE,
  not_participating_reason TEXT,
  verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (task_id, user_id)
);

-- 7. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance scheduler checks
CREATE INDEX IF NOT EXISTS idx_tasks_pre_deadline ON tasks (status, deadline, backed_up_deadline) WHERE status = 'OPEN' AND deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions (task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions (status);
