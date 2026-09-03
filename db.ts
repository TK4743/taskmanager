import * as dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
// Parse Postgres INT8 / COUNT(*) directly as Number for 2x faster JSON serialization and aggregation speed
pg.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const rawDatabaseUrl = process.env.DATABASE_URL;
if (!rawDatabaseUrl) {
  console.warn("WARNING: DATABASE_URL environment variable is missing! Please configure DATABASE_URL in Vercel Environment Variables.");
}

// Automatically upgrade Supabase pooler from Session mode (port 5432, hard limit 15 clients)
// to Transaction mode (port 6543, unlimited concurrent clients) to prevent EMAXCONNSESSION crashes
let databaseUrl = rawDatabaseUrl || '';
if (databaseUrl && databaseUrl.includes('pooler.supabase.com:5432')) {
  console.log('[PostgreSQL Pool] Automatically routing Supabase connection to Port 6543 (Transaction Mode) to eliminate EMAXCONNSESSION limit.');
  databaseUrl = databaseUrl.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
}

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

// Serverless optimization: In Vercel/Lambda, set poolMin=0 and poolMax=2-3 to prevent Supavisor EMAXCONN (200 limit)
const poolMax = isServerless
  ? Math.min(process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 3, 4)
  : (process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : (process.env.PGMAXCONNECTIONS ? parseInt(process.env.PGMAXCONNECTIONS, 10) : 25));

const poolMin = isServerless ? 0 : (process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN, 10) : 1);
const connectionTimeoutMillis = process.env.DB_CONNECTION_TIMEOUT_MS ? parseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10) : (isServerless ? 6000 : 15000);
const idleTimeoutMillis = process.env.DB_IDLE_TIMEOUT_MS ? parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) : (isServerless ? 1500 : 25000);
const statementTimeout = process.env.DB_STATEMENT_TIMEOUT_MS ? parseInt(process.env.DB_STATEMENT_TIMEOUT_MS, 10) : 20000;
const maxUses = process.env.DB_POOL_MAX_USES ? parseInt(process.env.DB_POOL_MAX_USES, 10) : (isServerless ? 100 : 7500);

export const pool = new Pool(databaseUrl ? {
  connectionString: databaseUrl,
  max: poolMax,
  min: poolMin,
  idleTimeoutMillis: idleTimeoutMillis,
  connectionTimeoutMillis: connectionTimeoutMillis,
  statement_timeout: statementTimeout,
  maxUses: maxUses,
  keepAlive: true,
  ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false }
} : undefined);

pool.on('error', (err: any) => {
  console.error('[PostgreSQL Pool] Unexpected error on idle client:', err?.message || err);
});

export function getPoolStatus() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    max: poolMax,
    min: poolMin,
  };
}

export async function initDB() {
  let client;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err: any) {
      if (attempt === 5) throw err;
      console.warn(`[initDB] Connection attempt ${attempt} failed (${err.message}). Retrying in 1.5s...`);
      await new Promise(res => setTimeout(res, 1500));
    }
  }
  if (!client) throw new Error("Failed to connect to database pool.");

  try {
    // Enable uuid extension if available
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    } catch (e) {
      console.log('Note: uuid-ossp extension could not be enabled, using built-in gen_random_uuid() or standard UUIDs');
    }

    // 1. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
        year INT,
        batch VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL, -- 'SUPREME_ADMIN','HOD','CLASS_ADVISOR','STUDENT'
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
        full_name VARCHAR(255),
        email VARCHAR(255),
        register_number VARCHAR(255),
        is_coordinator BOOLEAN DEFAULT FALSE,
        gender VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_email UNIQUE (email),
        CONSTRAINT unique_register UNIQUE (register_number)
      );
    `);

    // Ensure gender and profile columns exist if table was already created
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMP;`);

    // Clean up any improperly saved Telegram group IDs from individual user accounts
    await client.query(`UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL, telegram_linked_at = NULL WHERE telegram_chat_id LIKE '-%';`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
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
        status VARCHAR(50) DEFAULT 'OPEN',
        poster_url VARCHAR(1000),
        poster_cloudinary_public_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS task_classes (
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, class_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS task_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        custom_field_value TEXT,
        status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING','SUBMITTED','VERIFIED','REJECTED'
        screenshot_url VARCHAR(1000),
        cloudinary_public_id VARCHAR(255),
        verification_note TEXT,
        rejection_reason TEXT,
        resubmission_count INT DEFAULT 0,
        submitted_at TIMESTAMP,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (task_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS submission_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id UUID REFERENCES task_submissions(id) ON DELETE CASCADE NOT NULL,
        reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        event_type VARCHAR(100),
        channel VARCHAR(50) DEFAULT 'IN_APP',
        title TEXT,
        status VARCHAR(50) DEFAULT 'SENT',
        reference_type VARCHAR(100),
        reference_id VARCHAR(255),
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_type VARCHAR(100);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'IN_APP';
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SENT';
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(100);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS error_message TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
        email_enabled BOOLEAN DEFAULT TRUE,
        telegram_enabled BOOLEAN DEFAULT TRUE,
        in_app_enabled BOOLEAN DEFAULT TRUE,
        application_notifications BOOLEAN DEFAULT TRUE,
        interview_notifications BOOLEAN DEFAULT TRUE,
        selection_notifications BOOLEAN DEFAULT TRUE,
        system_notifications BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS report_download_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
        report_type VARCHAR(100) NOT NULL,
        format VARCHAR(20) NOT NULL,
        filters JSONB,
        record_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Web Push Subscriptions for Mobile / PWA Lock-screen Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
      );
      CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id);
    `);

    // Team Tasks Feature Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        leader_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        team_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'FORMING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        accepted_at TIMESTAMP,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_team_student UNIQUE (team_id, student_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        invited_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS team_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
        submitted_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        proof_url VARCHAR(1000),
        cloudinary_public_id VARCHAR(255),
        remarks TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ─── Student Profile Module Tables ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        mobile_number VARCHAR(50),
        date_of_birth VARCHAR(50),
        semester INT,
        cgpa NUMERIC(4,2),
        current_arrears INT DEFAULT 0,
        history_of_arrears INT DEFAULT 0,
        about_me TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        skill_name VARCHAR(100) NOT NULL,
        category VARCHAR(100) DEFAULT 'Technical',
        level VARCHAR(50) DEFAULT 'Intermediate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        description TEXT,
        tech_stack VARCHAR(500),
        github_url VARCHAR(500),
        live_demo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_internships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        company VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        duration VARCHAR(100),
        mode VARCHAR(50) DEFAULT 'Offline',
        certificate_url VARCHAR(1000),
        cloudinary_public_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_certifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        certificate_name VARCHAR(255) NOT NULL,
        provider VARCHAR(255),
        issue_date VARCHAR(50),
        credential_id VARCHAR(255),
        certificate_url VARCHAR(1000),
        cloudinary_public_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_coding_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        github VARCHAR(500),
        leetcode VARCHAR(500),
        hackerrank VARCHAR(500),
        codechef VARCHAR(500),
        geeksforgeeks VARCHAR(500),
        linkedin VARCHAR(500),
        portfolio VARCHAR(500),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        resume_url VARCHAR(1000),
        cloudinary_public_id VARCHAR(255),
        file_name VARCHAR(255),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Hackathons',
        description TEXT,
        event_date VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        language VARCHAR(100) NOT NULL,
        proficiency VARCHAR(50) DEFAULT 'Fluent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_career_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        preferred_role VARCHAR(255),
        preferred_domain VARCHAR(255),
        preferred_location VARCHAR(255),
        willing_to_relocate BOOLEAN DEFAULT TRUE,
        work_mode VARCHAR(50) DEFAULT 'Hybrid',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ─── Module 2: Digital Notice Board ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        scope VARCHAR(50) DEFAULT 'ALL',
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
        year INT,
        priority VARCHAR(50) DEFAULT 'NORMAL',
        attachment_url VARCHAR(1000),
        attachment_cloudinary_public_id VARCHAR(255),
        created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        publish_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expire_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);



    // ─── Module 4: Smart Reminder System ────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        scheduled_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_notification_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        task_reminders BOOLEAN DEFAULT TRUE,
        event_reminders BOOLEAN DEFAULT TRUE,
        notice_reminders BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        attempts INT DEFAULT 0,
        used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS task_deadline_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) DEFAULT '2_HOUR',
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, user_id, alert_type)
      );
    `);

    // Schema Migrations
    await client.query(`
      ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS poster_url VARCHAR(1000);
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS poster_cloudinary_public_id VARCHAR(255);
    `);
    await client.query(`
      ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS not_participating BOOLEAN DEFAULT FALSE;
    `);
    await client.query(`
      ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS not_participating_reason TEXT;
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submission_type VARCHAR(50) DEFAULT 'INDIVIDUAL';
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS min_team_size INT DEFAULT 2;
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_team_size INT DEFAULT 5;
    `);
    await client.query(`
      ALTER TABLE leetcode_daily_progress ADD COLUMN IF NOT EXISTS solved_yesterday INT NOT NULL DEFAULT 0;
    `);

    // Create indexes — original tables
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submissions_task_user ON task_submissions(task_id, user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_class_role ON users(class_id, role);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_dept_role ON users(department_id, role);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_classes_class ON task_classes(class_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submissions_status ON task_submissions(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_lower_username ON users(LOWER(username));`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_lower_regno ON users(LOWER(register_number));`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_teams_task_class ON teams(task_id, class_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_team_members_student ON team_members(student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_team_members_team_status ON team_members(team_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_team_invitations_student_status ON team_invitations(student_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_team_invitations_team_student ON team_invitations(team_id, student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_team_submissions_team ON team_submissions(team_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);

    // Create indexes — new module tables
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notices_scope_dept ON notices(scope, department_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notices_class ON notices(class_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notices_publish ON notices(publish_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_notifs_user ON scheduled_notifications(user_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_notifs_time ON scheduled_notifications(scheduled_time, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, deadline);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline_dept ON tasks(status, deadline, department_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON task_submissions(submitted_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submissions_verified_at ON task_submissions(verified_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submissions_cloudinary ON task_submissions(cloudinary_public_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_submissions_user_status ON task_submissions(user_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_submissions_task_status ON task_submissions(task_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_coding_user ON student_coding_profiles(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_skills_user ON student_skills(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_projects_user ON student_projects(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_internships_user ON student_internships(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_certifications_user ON student_certifications(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_achievements_user ON student_achievements(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_languages_user ON student_languages(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_career_user ON student_career_preferences(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_student_resumes_user ON student_resumes(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submission_reviews_submission ON submission_reviews(submission_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_classes_task ON task_classes(task_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_classes_dept ON classes(department_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_password_resets_lookup ON password_resets(email, otp_code, used);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_submissions_user_task_status ON task_submissions(user_id, task_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_dept_class ON users(role, department_id, class_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_classes_dept_year ON classes(department_id, year);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_teams_task_status ON teams(task_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_deadline_alerts ON task_deadline_alerts(task_id, user_id, alert_type);`);

    // ─── Module 5: LeetCode Targets & Progress Tracking ───────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS leetcode_targets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        daily_target INT NOT NULL DEFAULT 0,
        weekly_target INT NOT NULL DEFAULT 0,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        year INT,
        department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leetcode_daily_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        date DATE NOT NULL,
        total_solved INT,
        solved_today INT NOT NULL DEFAULT 0,
        solved_yesterday INT NOT NULL DEFAULT 0,
        daily_target INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL, -- 'COMPLETED', 'INCOMPLETE', 'DATA_UNAVAILABLE'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, date)
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_leetcode_targets_scope ON leetcode_targets(user_id, class_id, year, department_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leetcode_targets_dates ON leetcode_targets(start_date, end_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leetcode_progress_date ON leetcode_daily_progress(user_id, date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leetcode_progress_date_range ON leetcode_daily_progress(date, user_id);`);

    // ─── Module 6: GitHub Daily Commit Count Tracking ─────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS github_daily_commits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        github_username TEXT,
        date DATE NOT NULL,
        daily_commit_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, date)
      );
    `);

    // Safely migrate existing records from legacy github_daily_progress if present
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'github_daily_progress') THEN
          INSERT INTO github_daily_commits (student_id, github_username, date, daily_commit_count, created_at, updated_at)
          SELECT user_id, github_username, date, COALESCE(commits_today, 0), created_at, updated_at
          FROM github_daily_progress
          ON CONFLICT (student_id, date) DO UPDATE
            SET daily_commit_count = EXCLUDED.daily_commit_count,
                github_username = EXCLUDED.github_username,
                updated_at = EXCLUDED.updated_at;
        END IF;
      END $$;
    `);

    // Drop legacy & obsolete tables
    await client.query(`DROP TABLE IF EXISTS github_daily_progress CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS github_targets CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS system_vapid_keys CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS user_push_subscriptions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS email_notifications CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS task_discussions CASCADE;`);

    // Ensure leetcode_url and github_url columns exist on users table
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS leetcode_url VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);`);

    // GitHub Daily Commits table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_github_daily_commits_student_date ON github_daily_commits(student_id, date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_github_daily_commits_date ON github_daily_commits(date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_github_daily_commits_username ON github_daily_commits(github_username);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_github_daily_commits_date_commits ON github_daily_commits(date, daily_commit_count);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leetcode_progress_status_date ON leetcode_daily_progress(status, date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leetcode_daily_user_date_status ON leetcode_daily_progress(user_id, date, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leetcode_daily_progress_date_solved ON leetcode_daily_progress(date, solved_today);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_class_dept_role ON users(class_id, department_id, role);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_regno_username ON users(register_number, username);`);

    // Clean up duplicate target configuration rows if any exist
    await client.query(`
      DELETE FROM leetcode_targets t1
      USING leetcode_targets t2
      WHERE t1.created_at < t2.created_at
        AND t1.start_date = t2.start_date
        AND t1.end_date = t2.end_date
        AND COALESCE(t1.user_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(t2.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND COALESCE(t1.class_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(t2.class_id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND COALESCE(t1.year, -1) = COALESCE(t2.year, -1)
        AND COALESCE(t1.department_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(t2.department_id, '00000000-0000-0000-0000-000000000000'::uuid);
    `);

    // Seed Supreme Admin if not exists
    const adminRes = await client.query(`SELECT * FROM users WHERE role = 'SUPREME_ADMIN' LIMIT 1;`);
    if (adminRes.rowCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO users (username, password, role, full_name)
        VALUES ('admin', $1, 'SUPREME_ADMIN', 'Supreme Administrator');
      `, [hashedPassword]);
      console.log('Supreme Admin seeded: admin / admin123');
    }

    // Seed Default Department & Classes if none exist
    const deptRes = await client.query(`SELECT id FROM departments LIMIT 1;`);
    let defaultDeptId = deptRes.rows[0]?.id;
    if (!defaultDeptId) {
      const newDeptRes = await client.query(`
        INSERT INTO departments (name) VALUES ('Information Technology') RETURNING id;
      `);
      defaultDeptId = newDeptRes.rows[0].id;
      console.log('Default Department seeded: Information Technology');
    }

    const classRes = await client.query(`SELECT id FROM classes LIMIT 1;`);
    if (classRes.rowCount === 0 && defaultDeptId) {
      const c1 = await client.query(`
        INSERT INTO classes (name, department_id, year, batch) VALUES ('III IT-A', $1, 3, '2024-2028') RETURNING id;
      `, [defaultDeptId]);
      await client.query(`
        INSERT INTO classes (name, department_id, year, batch) VALUES ('III IT-B', $1, 3, '2024-2028');
      `, [defaultDeptId]);
      await client.query(`
        INSERT INTO classes (name, department_id, year, batch) VALUES ('II IT-A', $1, 2, '2025-2029');
      `, [defaultDeptId]);
      const defaultClassId = c1.rows[0].id;

      // Assign unassigned students & coordinators to default class and department
      await client.query(`
        UPDATE users 
        SET department_id = $1, class_id = $2 
        WHERE class_id IS NULL OR department_id IS NULL;
      `, [defaultDeptId, defaultClassId]);
      console.log('Default Classes seeded & unassigned users linked.');
    } else if (defaultDeptId) {
      // Ensure existing users without class_id are linked to the first available class
      const firstClassRes = await client.query(`SELECT id FROM classes ORDER BY name ASC LIMIT 1;`);
      if (firstClassRes.rows.length > 0) {
        await client.query(`
          UPDATE users 
          SET department_id = COALESCE(department_id, $1), class_id = COALESCE(class_id, $2) 
          WHERE class_id IS NULL OR department_id IS NULL;
        `, [defaultDeptId, firstClassRes.rows[0].id]);
      }
    }

    // Update batch definitions for Year 2 (2025-2029) and Year 3 (2024-2028)
    await client.query(`UPDATE classes SET batch = '2025-2029', updated_at = NOW() WHERE year = 2;`);
    await client.query(`UPDATE classes SET batch = '2024-2028', updated_at = NOW() WHERE year = 3;`);

    // ─── 📝 Skill & Aptitude Assessment Question Bank & Submissions Schema ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option INTEGER NOT NULL,
        category VARCHAR(100) DEFAULT 'Quantitative Aptitude',
        skill_tag VARCHAR(100) DEFAULT 'Aptitude',
        difficulty VARCHAR(50) DEFAULT 'MEDIUM',
        explanation TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        student_name VARCHAR(255),
        register_number VARCHAR(100),
        total_questions INTEGER NOT NULL DEFAULT 10,
        correct_count INTEGER NOT NULL DEFAULT 0,
        score_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
        category_breakdown JSONB,
        answers_summary JSONB,
        strengths JSONB,
        gaps JSONB,
        time_taken_seconds INTEGER DEFAULT 0,
        proctor_photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE student_assessments ADD COLUMN IF NOT EXISTS proctor_photo_url TEXT;
      ALTER TABLE student_assessments ALTER COLUMN proctor_photo_url TYPE TEXT;
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS track_type VARCHAR(50) DEFAULT 'GENERAL_APTITUDE';
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS track_title VARCHAR(150) DEFAULT 'General Aptitude Benchmark';
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS cutoff_percentage NUMERIC(5,2) DEFAULT 60.00;

      ALTER TABLE student_assessments ADD COLUMN IF NOT EXISTS track_type VARCHAR(50) DEFAULT 'GENERAL_APTITUDE';
      ALTER TABLE student_assessments ADD COLUMN IF NOT EXISTS track_title VARCHAR(150) DEFAULT 'General Aptitude Benchmark';
      ALTER TABLE student_assessments ADD COLUMN IF NOT EXISTS cutoff_percentage NUMERIC(5,2) DEFAULT 60.00;
      ALTER TABLE student_assessments ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT FALSE;

      CREATE INDEX IF NOT EXISTS idx_assessment_q_track ON assessment_questions(track_type, is_active);
      CREATE INDEX IF NOT EXISTS idx_student_assessments_track ON student_assessments(user_id, track_type);

      CREATE TABLE IF NOT EXISTS assessment_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        track_type VARCHAR(50) NOT NULL,
        track_title VARCHAR(150) NOT NULL,
        target_year VARCHAR(10) DEFAULT 'ALL',
        target_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
        custom_instructions TEXT,
        deadline TIMESTAMP,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_assessment_assignments_target ON assessment_assignments(target_year, target_class_id);

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assessment_assignments_created_by_fkey') THEN
          ALTER TABLE assessment_assignments DROP CONSTRAINT assessment_assignments_created_by_fkey;
        END IF;
        ALTER TABLE assessment_assignments ADD CONSTRAINT assessment_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    // Seed 15 standardized aptitude questions (5 Quant, 5 Logical, 5 Verbal) if question bank is empty
    const countCheck = await client.query(`SELECT COUNT(*) FROM assessment_questions;`);
    if (parseInt(countCheck.rows[0].count, 10) === 0) {
      const seedAptitudeQuestions = [
        // ── Quantitative Aptitude (5 Questions) ──────────────────────────────
        {
          question_text: "A train running at 60 km/hr crosses a telegraph pole in 9 seconds. What is the length of the train?",
          options: ["120 metres", "150 metres", "180 metres", "324 metres"],
          correct_option: 1,
          category: "Quantitative Aptitude",
          skill_tag: "Speed, Time & Distance",
          difficulty: "EASY",
          explanation: "Speed in m/s = 60 * (5/18) = 50/3 m/s. Length (Distance) = Speed * Time = (50/3) * 9 = 150 metres."
        },
        {
          question_text: "If 12 workers can construct a road section in 15 days, in how many days can 20 workers complete the same task at the same pace?",
          options: ["8 days", "9 days", "10 days", "12 days"],
          correct_option: 1,
          category: "Quantitative Aptitude",
          skill_tag: "Time & Work",
          difficulty: "MEDIUM",
          explanation: "Work = Workers * Days = 12 * 15 = 180 man-days. Days required by 20 workers = 180 / 20 = 9 days."
        },
        {
          question_text: "A shopkeeper sells a monitor for ₹840 at a 20% profit margin. What was the original cost price?",
          options: ["₹680", "₹700", "₹720", "₹750"],
          correct_option: 1,
          category: "Quantitative Aptitude",
          skill_tag: "Profit & Loss",
          difficulty: "EASY",
          explanation: "Selling Price = Cost Price * 1.20. Therefore, Cost Price = 840 / 1.20 = ₹700."
        },
        {
          question_text: "The average score of 5 students in an assessment is 78. If a 6th student scoring 90 is added, what is the new group average?",
          options: ["79.0", "80.0", "81.0", "82.5"],
          correct_option: 1,
          category: "Quantitative Aptitude",
          skill_tag: "Averages & Percentages",
          difficulty: "MEDIUM",
          explanation: "Total score of 5 students = 5 * 78 = 390. Total score of 6 students = 390 + 90 = 480. New average = 480 / 6 = 80.0."
        },
        {
          question_text: "In a box, there are 10 prize tokens and 25 blank tokens. If one token is drawn at random, what is the probability of drawing a prize token?",
          options: ["1/7", "2/7", "2/5", "3/7"],
          correct_option: 1,
          category: "Quantitative Aptitude",
          skill_tag: "Probability & Permutations",
          difficulty: "MEDIUM",
          explanation: "Total tokens = 10 + 25 = 35. Probability of a prize token = 10 / 35 = 2/7."
        },

        // ── Logical Reasoning (5 Questions) ───────────────────────────────────
        {
          question_text: "Identify the next number in the sequence: 4, 9, 25, 49, 121, ___",
          options: ["144", "169", "196", "225"],
          correct_option: 1,
          category: "Logical Reasoning",
          skill_tag: "Pattern & Number Series",
          difficulty: "MEDIUM",
          explanation: "The series consists of squares of consecutive prime numbers: 2^2=4, 3^2=9, 5^2=25, 7^2=49, 11^2=121. The next prime number is 13, and 13^2 = 169."
        },
        {
          question_text: "Pointing to a photograph of a boy, Suresh remarked: 'He is the only son of my mother.' How is Suresh related to the boy?",
          options: ["Brother", "Father", "Uncle", "Grandfather"],
          correct_option: 1,
          category: "Logical Reasoning",
          skill_tag: "Blood Relations",
          difficulty: "EASY",
          explanation: "'The only son of Suresh\\'s mother' refers to Suresh himself. Therefore, the boy is Suresh\\'s son, and Suresh is his father."
        },
        {
          question_text: "In a given substitution cipher, 'SYSTEM' is encoded as 'TZTUFN'. Following the same rule, how is 'ACTION' encoded?",
          options: ["BDUJP O", "BDUJPO", "BCUIPO", "BDTKPO"],
          correct_option: 1,
          category: "Logical Reasoning",
          skill_tag: "Coding & Decoding",
          difficulty: "EASY",
          explanation: "Each letter is shifted forward by +1: A->B, C->D, T->U, I->J, O->P, N->O => BDUJPO."
        },
        {
          question_text: "Statements: All algorithms are structured. Some structured elements are optimized. Conclusion: Which deduction is definitely valid?",
          options: ["All algorithms are optimized", "Some structured elements are algorithms", "No algorithms are optimized", "All optimized elements are algorithms"],
          correct_option: 1,
          category: "Logical Reasoning",
          skill_tag: "Syllogism & Deductive Logic",
          difficulty: "HARD",
          explanation: "If all algorithms are structured, then by immediate conversion, some structured elements are definitely algorithms."
        },
        {
          question_text: "A person walks 20 metres North, turns right and walks 30 metres, then turns right again and walks 20 metres. How far and in what direction is he from his starting point?",
          options: ["20 metres East", "30 metres East", "30 metres West", "50 metres South"],
          correct_option: 1,
          category: "Logical Reasoning",
          skill_tag: "Direction Sense",
          difficulty: "EASY",
          explanation: "The 20m North and 20m South movements cancel out vertically. The horizontal displacement is 30m due East."
        },

        // ── Verbal Ability (5 Questions) ──────────────────────────────────────
        {
          question_text: "Choose the word most nearly OPPOSITE in meaning to the word 'METICULOUS':",
          options: ["Diligent", "Careless", "Precise", "Methodical"],
          correct_option: 1,
          category: "Verbal Ability",
          skill_tag: "Vocabulary & Antonyms",
          difficulty: "EASY",
          explanation: "'Meticulous' means showing great attention to detail. Its exact antonym is 'Careless'."
        },
        {
          question_text: "Identify the sentence with the correct grammatical structure and subject-verb agreement:",
          options: [
            "Neither the advisor nor the students was present.",
            "Neither the advisor nor the students were present.",
            "Neither the advisor or the students was present.",
            "Neither the advisor nor the students has been present."
          ],
          correct_option: 1,
          category: "Verbal Ability",
          skill_tag: "Grammar & Error Spotting",
          difficulty: "MEDIUM",
          explanation: "When subjects are connected by 'neither... nor', the verb agrees with the closer subject ('students' is plural, requiring 'were')."
        },
        {
          question_text: "Select the grammatically correct replacement for the underlined segment: 'The project manager insisted that each engineer submits their code daily.'",
          options: [
            "each engineer submitting their code",
            "each engineer submit their code",
            "each engineer will submit their code",
            "each engineer submitted their code"
          ],
          correct_option: 1,
          category: "Verbal Ability",
          skill_tag: "Sentence Correction",
          difficulty: "HARD",
          explanation: "The verb 'insisted that' governs the subjunctive mood base form 'submit', rather than the third-person 'submits'."
        },
        {
          question_text: "What is the true figurative meaning of the idiom 'To burn the candle at both ends'?",
          options: [
            "To waste money carelessly on luxury",
            "To work exhaustingly hard from early morning until late at night",
            "To create unnecessary workplace disputes",
            "To attempt solving two conflicting problems at once"
          ],
          correct_option: 1,
          category: "Verbal Ability",
          skill_tag: "Idioms & Phrases",
          difficulty: "MEDIUM",
          explanation: "The idiom refers to exhausting one's energy by waking early and staying up late to work excessively."
        },
        {
          question_text: "Fill in the blank with the most appropriate word: 'The lead researcher\\'s hypothesis was so _______ that the review panel approved the project without hesitation.'",
          options: ["Ambiguous", "Compelling", "Superficial", "Tentative"],
          correct_option: 1,
          category: "Verbal Ability",
          skill_tag: "Contextual Vocabulary",
          difficulty: "EASY",
          explanation: "'Compelling' means powerfully convincing and demanding attention or agreement."
        }
      ];

      for (const q of seedAptitudeQuestions) {
        await client.query(`
          INSERT INTO assessment_questions (question_text, options, correct_option, category, skill_tag, difficulty, explanation)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [q.question_text, JSON.stringify(q.options), q.correct_option, q.category, q.skill_tag, q.difficulty, q.explanation]);
      }
      console.log('[Assessment] Seeded 10 standard aptitude questions successfully.');
    }

    // ─── 🏭 SIH26044: Academia–Industry Collaboration Tables ─────────────────

    // Table 1: Company Profiles (linked to INDUSTRY role users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        industry_sector VARCHAR(255),
        company_size VARCHAR(100),
        website VARCHAR(500),
        description TEXT,
        logo_url VARCHAR(1000),
        logo_cloudinary_public_id VARCHAR(255),
        hq_location VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table 2: Industry Postings (Jobs / Internships / Training / Workshops / FDP / Research)
    await client.query(`
      CREATE TABLE IF NOT EXISTS industry_postings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
        posting_type VARCHAR(50) NOT NULL DEFAULT 'INTERNSHIP',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        mode VARCHAR(50) DEFAULT 'Hybrid',
        stipend_or_salary VARCHAR(100),
        duration VARCHAR(100),
        required_skills JSONB DEFAULT '[]',
        min_cgpa NUMERIC(4,2) DEFAULT 0,
        min_year INT DEFAULT 1,
        max_year INT DEFAULT 4,
        eligibility_notes TEXT,
        application_deadline TIMESTAMP,
        start_date VARCHAR(100),
        total_seats INT,
        status VARCHAR(50) DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table 3: Student Applications to Industry Postings (full lifecycle)
    await client.query(`
      CREATE TABLE IF NOT EXISTS posting_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        posting_id UUID REFERENCES industry_postings(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        match_score NUMERIC(5,2) DEFAULT 0,
        matched_skills JSONB DEFAULT '[]',
        gap_skills JSONB DEFAULT '[]',
        cover_note TEXT,
        status VARCHAR(50) DEFAULT 'APPLIED',
        shortlisted_at TIMESTAMP,
        interview_date TIMESTAMP,
        interview_notes TEXT,
        decision_at TIMESTAMP,
        decision_note TEXT,
        mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        progress_notes TEXT,
        completion_date TIMESTAMP,
        certificate_url VARCHAR(1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (posting_id, student_id)
      );
    `);

    // Table 4: Faculty–Industry Opportunities (FDP, Consultancy, Research, Guest Lectures, etc.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS faculty_industry_opportunities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
        opportunity_type VARCHAR(100) NOT NULL DEFAULT 'FDP',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        compensation VARCHAR(255),
        duration VARCHAR(100),
        location VARCHAR(255),
        mode VARCHAR(50) DEFAULT 'Hybrid',
        application_deadline TIMESTAMP,
        status VARCHAR(50) DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table 5: Faculty Applications to Industry Opportunities
    await client.query(`
      CREATE TABLE IF NOT EXISTS faculty_opportunity_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id UUID REFERENCES faculty_industry_opportunities(id) ON DELETE CASCADE,
        faculty_id UUID REFERENCES users(id) ON DELETE CASCADE,
        proposal TEXT,
        status VARCHAR(50) DEFAULT 'APPLIED',
        decision_note TEXT,
        decision_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (opportunity_id, faculty_id)
      );
    `);

    // Table 6: Industry Collaboration Projects (powers Live Teaching Hub rebranding)
    await client.query(`
      CREATE TABLE IF NOT EXISTS industry_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        required_skills JSONB DEFAULT '[]',
        max_students INT DEFAULT 5,
        status VARCHAR(50) DEFAULT 'OPEN',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        evaluation_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table 6b: Industry Project Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS industry_project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES industry_projects(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (project_id, student_id)
      );
    `);

    // Table 7: Skill Gap Recommendations Cache (pre-computed per student+posting pair)
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_gap_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        posting_id UUID REFERENCES industry_postings(id) ON DELETE CASCADE,
        match_score NUMERIC(5,2),
        matched_skills JSONB DEFAULT '[]',
        gap_skills JSONB DEFAULT '[]',
        recommendations JSONB DEFAULT '[]',
        computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, posting_id)
      );
    `);

    // Indexes for SIH26044 industry tables
    await client.query(`CREATE INDEX IF NOT EXISTS idx_company_profiles_user ON company_profiles(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_company_profiles_verified ON company_profiles(is_verified);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_industry_postings_company ON industry_postings(company_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_industry_postings_type_status ON industry_postings(posting_type, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_industry_postings_deadline ON industry_postings(application_deadline);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_posting_applications_posting ON posting_applications(posting_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_posting_applications_student ON posting_applications(student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_posting_applications_status ON posting_applications(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_posting_applications_score ON posting_applications(posting_id, match_score DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_faculty_opptys_company ON faculty_industry_opportunities(company_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_faculty_opptys_type_status ON faculty_industry_opportunities(opportunity_type, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_faculty_oppty_apps_opp ON faculty_opportunity_applications(opportunity_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_faculty_oppty_apps_faculty ON faculty_opportunity_applications(faculty_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_industry_projects_company ON industry_projects(company_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_industry_project_members ON industry_project_members(project_id, student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_skill_gap_recs ON skill_gap_recommendations(student_id, posting_id);`);

    // ─── 💻 Short Industry Coding Assessment Tables ─────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS coding_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INT DEFAULT 60,
        question_pool_size INT DEFAULT 10,
        questions_per_student INT DEFAULT 2,
        passing_score NUMERIC(5,2) DEFAULT 60.00,
        start_at TIMESTAMP,
        end_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'DRAFT',
        allowed_languages JSONB DEFAULT '["c","cpp","java","python"]',
        proctoring_config JSONB DEFAULT '{"camera_required":true,"fullscreen_required":true,"tab_monitoring":true}',
        target_departments JSONB DEFAULT '[]',
        target_classes JSONB DEFAULT '[]',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coding_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID REFERENCES coding_assessments(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        problem_statement TEXT NOT NULL,
        input_format TEXT,
        output_format TEXT,
        constraints TEXT,
        difficulty VARCHAR(50) DEFAULT 'MEDIUM',
        marks INT DEFAULT 50,
        skills JSONB DEFAULT '[]',
        allowed_languages JSONB DEFAULT '["c","cpp","java","python"]',
        display_order INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coding_test_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID REFERENCES coding_questions(id) ON DELETE CASCADE,
        input_data TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        is_hidden BOOLEAN DEFAULT FALSE,
        weight NUMERIC(5,2) DEFAULT 1.0,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coding_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID REFERENCES coding_assessments(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        assigned_question_ids JSONB NOT NULL DEFAULT '[]',
        started_at TIMESTAMP,
        submitted_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'NOT_STARTED',
        final_score NUMERIC(5,2) DEFAULT 0.00,
        is_passed BOOLEAN DEFAULT FALSE,
        proctoring_summary JSONB DEFAULT '{"camera_interruptions":0,"tab_switches":0,"fullscreen_exits":0,"face_alerts":0}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (assessment_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS coding_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES coding_assignments(id) ON DELETE CASCADE,
        question_id UUID REFERENCES coding_questions(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        source_code TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'ACCEPTED',
        score NUMERIC(5,2) DEFAULT 0.00,
        max_marks INT DEFAULT 50,
        public_tests_passed INT DEFAULT 0,
        public_tests_total INT DEFAULT 0,
        hidden_tests_passed INT DEFAULT 0,
        hidden_tests_total INT DEFAULT 0,
        execution_time_ms INT DEFAULT 0,
        memory_used_kb INT DEFAULT 0,
        compiler_output TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coding_proctoring_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES coding_assignments(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) DEFAULT 'LOW',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coding_assignment_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES coding_assignments(id) ON DELETE CASCADE,
        question_id UUID REFERENCES coding_questions(id) ON DELETE CASCADE,
        question_order INT DEFAULT 1,
        score NUMERIC(5,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'NOT_STARTED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (assignment_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS coding_code_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES coding_assignments(id) ON DELETE CASCADE,
        question_id UUID REFERENCES coding_questions(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        source_code TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (assignment_id, question_id)
      );
    `);

    // Add deadline_at column to coding_assignments if not exists
    await client.query(`ALTER TABLE coding_assignments ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP;`);

    // Purge legacy year coordinator columns from users table
    await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS is_year_coordinator;`);
    await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS year_scope;`);

    // Ensure student_skills has proficiency, verified, updated_at, and unique constraint
    await client.query(`ALTER TABLE student_skills ADD COLUMN IF NOT EXISTS proficiency INT DEFAULT 70;`);
    await client.query(`ALTER TABLE student_skills ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;`);
    await client.query(`ALTER TABLE student_skills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'student_skills_user_skill_key'
        ) THEN
          ALTER TABLE student_skills ADD CONSTRAINT student_skills_user_skill_key UNIQUE (user_id, skill_name);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_assessments_company ON coding_assessments(company_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_assessments_status ON coding_assessments(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_questions_assessment ON coding_questions(assessment_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_test_cases_question ON coding_test_cases(question_id, is_hidden);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_assignments_student ON coding_assignments(student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_assignments_assessment ON coding_assignments(assessment_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_assignment_questions_assign ON coding_assignment_questions(assignment_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_code_drafts_assign_q ON coding_code_drafts(assignment_id, question_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_submissions_assignment ON coding_submissions(assignment_id, question_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coding_proctoring_assignment ON coding_proctoring_events(assignment_id);`);

    console.log('[SIH26044] Industry Short Coding Assessment tables initialized successfully.');

    // ─── 🛡️ Supabase Security & Row Level Security (RLS) Auto-Enforcement ───
    try {
      await client.query(`
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
            EXECUTE 'DROP POLICY IF EXISTS service_role_all_policy ON public.' || quote_ident(r.tablename) || ';';
            EXECUTE 'CREATE POLICY service_role_all_policy ON public.' || quote_ident(r.tablename) || ' FOR ALL TO service_role USING (true) WITH CHECK (true);';
          END LOOP;
        END $$;
      `);
      console.log('[PostgreSQL] Row Level Security (RLS) successfully enforced on all public schema tables.');
    } catch (rlsErr: any) {
      console.warn('[PostgreSQL] RLS auto-enforcement notice:', rlsErr.message);
    }

  } catch (err) {
    console.error('Error initializing PostgreSQL tables:', err);
    throw err;
  } finally {
    client.release();
  }
}
