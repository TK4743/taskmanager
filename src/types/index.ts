/**
 * Domain Types for VSBEC IT Vault
 */

import type React from 'react';

export interface YearStats {
  total_students: number;
  total_classes: number;
  taskStats: { id: string; title: string; submitted: number; verified: number; pending: number; rejected: number; }[];
  classStats: { id: string; name: string; total_students: number; participating_students: number; }[];
  year: number;
}

export interface User {
  id: string | number;
  username: string;
  role: 'SUPREME_ADMIN' | 'HOD' | 'CLASS_ADVISOR' | 'STUDENT' | 'INDUSTRY' | 'FACULTY' | 'STAFF';
  full_name: string;
  name?: string;
  department_id: string | number | null;
  department_name?: string;
  class_id?: string | number | null;
  class_name?: string;
  email?: string;
  register_number?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'Not Specified' | string;
  phone?: string;
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  avatar_url?: string;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  telegram_linked_at?: string | null;
  year?: number | string;
  batch?: string;
  is_coordinator?: boolean;
  is_active?: boolean;
  status?: string;
  is_approved?: boolean;
  created_at?: string;
}

export interface Department {
  id: string | number;
  name: string;
  code?: string;
}

export interface Class {
  id: string | number;
  name: string;
  department_id: string | number;
  department_name?: string;
  year?: number;
  batch?: string;
  advisor_id?: string | number;
}

export interface Task {
  id: string | number;
  title: string;
  description: string;
  category?: string;
  external_link?: string;
  deadline?: string;
  screenshot_instruction?: string;
  custom_field_label?: string;
  creator_name: string;
  department_name: string | null;
  department_id?: string | number | null;
  department_ids?: (string | number)[];
  class_ids: (string | number)[];
  status: 'OPEN' | 'CLOSED';
  submission_type?: 'INDIVIDUAL' | 'TEAM';
  min_team_size?: number;
  max_team_size?: number;
  created_at: string;
  submission_status?: string;
  submission_count?: number;
  poster_url?: string | null;
  poster_cloudinary_public_id?: string | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  student_id: string;
  full_name?: string;
  register_number?: string;
  username?: string;
  email?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REMOVED';
  accepted_at?: string;
  joined_at: string;
}

export interface TeamInvitation {
  task_category?: string;
  task_id?: string | number;
  id: string;
  team_id: string;
  student_id: string;
  invited_by: string;
  inviter_name?: string;
  team_name?: string;
  task_title?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  created_at: string;
}

export interface TeamSubmission {
  id: string;
  team_id: string;
  submitted_by: string;
  proof_url: string;
  cloudinary_public_id?: string;
  original_filename?: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED' | string;
  task_id?: string | number;
  task_title?: string;
  class_id?: string | number;
  leader_id?: string | number;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  team_name?: string;
  leader_name?: string;
  leader_regno?: string;
  members?: TeamMember[];
}

export interface Team {
  id: string;
  task_id: string;
  class_id: string;
  leader_id: string;
  leader_name?: string;
  leader_regno?: string;
  team_name: string;
  status: 'FORMING' | 'READY' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
  invitations?: TeamInvitation[];
  submission?: TeamSubmission | null;
  min_team_size?: number;
  max_team_size?: number;
  task_title?: string;
}

export interface Submission {
  id: string | number;
  task_id: string | number;
  task_title: string;
  task_deadline?: string;
  submission_type?: string;
  custom_field_label?: string;
  custom_field_type?: string;
  user_id: string | number;
  student_name?: string;
  student_email?: string;
  student_avatar?: string;
  student_gender?: string;
  gender?: string;
  register_number?: string;
  department_id?: string | number;
  department_name?: string;
  class_id?: string | number;
  class_name?: string;
  class_year?: number;
  custom_field_value?: string;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'NOT_PARTICIPATING';
  screenshot_url: string;
  original_filename?: string;
  verification_note?: string;
  rejection_reason?: string;
  submitted_at: string;
  verified_at?: string;
  resubmission_count?: number;
  not_participating?: boolean;
  not_participating_reason?: string;
  class_ids?: (string | number)[];
  task_category?: string;
  verified_by_name?: string | null;
  verified_by_username?: string | null;
  verified_by_role?: string | null;
  is_duplicate?: boolean;
  proof_file_hash?: string | null;
  duplicate_matched_submission_id?: string | null;
  duplicate_match?: {
    student_name: string;
    register_number: string;
    submitted_at: string;
  } | null;
  duplicate_match_name?: string | null;
  duplicate_match_regno?: string | null;
  duplicate_match_submitted_at?: string | null;
}

export interface Notification {
  id: string | number;
  message: string;
  type: string;
  title?: string;
  is_read: boolean;
  created_at: string;
}

export interface UserReview {
  id: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
  user_email?: string;
}

export interface DefaulterAudit {
  user_id: string;
  full_name: string;
  name?: string;
  register_number: string;
  class_name: string;
  department_name: string;
  pending_tasks: {
    task_id: number;
    title: string;
    deadline: string;
  }[];
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  scope: 'ALL' | 'DEPARTMENT' | 'YEAR' | 'CLASS';
  department_id?: string | null;
  class_id?: string | null;
  year?: number | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  attachment_url?: string | null;
  attachment_cloudinary_public_id?: string | null;
  created_by: string;
  creator_name?: string;
  creator_role?: string;
  department_name?: string;
  class_name?: string;
  is_pinned?: boolean;
  publish_at: string;
  expire_at?: string | null;
  created_at: string;
}



export interface HODStats {
  total_classes?: number;
  total_advisors?: number;
  total_students?: number;
  not_participating_submissions?: number;
  taskStats: {
    id: number;
    title: string;
    submitted: number;
    verified: number;
    pending: number;
    rejected: number;
    class_breakdown: {
      class_name: string;
      total_students: number;
      completed: number;
      not_completed: number;
    }[];
  }[];
  classStats: {
    name: string;
    total_students: number;
    participating_students: number;
  }[];
}

export interface AdvisorStats {
  total_students?: number;
  submitted_tasks_count?: number;
  verified_tasks_count?: number;
  rejected_tasks_count?: number;
  pending_tasks_count?: number;
  total_boys?: number;
  total_girls?: number;
  boys_verified?: number;
  girls_verified?: number;
  boys_incomplete?: number;
  girls_incomplete?: number;
  taskStats: {
    id: number;
    title: string;
    submitted: number;
    verified: number;
    pending: number;
    rejected: number;
  }[];
  studentStats: {
    full_name: string;
  name?: string;
    completed_tasks: number;
    total_tasks: number;
  }[];
}

export interface StudentStats {
  total_tasks: number;
  verified_tasks: number;
  submitted_tasks: number;
  rejected_tasks: number;
}

export interface CoordinatorStats {
  class_student_count?: number;
  total_students?: number;
  pending_reviews?: number;
  verified_submissions?: number;
  rejected_submissions?: number;
  total_boys?: number;
  total_girls?: number;
  boys_verified?: number;
  girls_verified?: number;
  boys_incomplete?: number;
  girls_incomplete?: number;
  taskStats: {
    id: number;
    title: string;
    submitted: number;
    verified: number;
    pending: number;
    rejected: number;
  }[];
  studentStats: {
    full_name: string;
  name?: string;
    register_number?: string;
    completed_tasks: number;
    total_tasks: number;
  }[];
}


export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface AppRouteState {
  view: string;
  codingPlatformTab?: 'LEETCODE' | 'GITHUB';
  footerModal?: 'PRIVACY' | 'TERMS' | 'SUPPORT' | 'SOURCES' | null;
  studentTaskFilter?: 'ALL' | 'PENDING_ACTION' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'NOT_INTERESTED' | 'OVERDUE';
  verificationFilter?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT INTERESTED' | 'ALL';
  portfolioRegNo?: string;
  taskId?: string;
  userId?: string;
  section?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export type ClassItem = Class;
