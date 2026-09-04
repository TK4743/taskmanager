/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Sparkles,
  ClipboardList,
  Code,
  Megaphone,
  Briefcase,
  Target,
  Users,
  ShieldCheck,
  Building2,
  BarChart3,
  Terminal,
  UserCheck,
  TrendingUp,
  LayoutDashboard,
  Zap,
  Radio,
  X,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Info,
  User,
  Settings,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

export type UserRole = 'STUDENT' | 'STUDENT_COORDINATOR' | 'CLASS_ADVISOR' | 'HOD' | 'SUPREME_ADMIN' | 'INDUSTRY';

export interface SidebarFeatureInfo {
  id: string;
  title: string;
  badge: string;
  description: string;
  keyPoints: string[];
  proTip?: string;
  icon: React.ReactNode;
  category?: string;
}

// -------------------------------------------------------------
// Comprehensive Role-Specific Sidebar Feature Information
// -------------------------------------------------------------

export const SIDEBAR_FEATURES: Record<string, Record<string, SidebarFeatureInfo>> = {
  STUDENT: {
    'dashboard': {
      id: 'dashboard',
      title: 'Academic Dashboard',
      badge: 'Overview',
      description: 'Your central command center showing task progress, coding streaks, urgent announcements, and upcoming deadlines.',
      keyPoints: [
        'Real-time summary of completed vs pending assignments',
        'Daily LeetCode & GitHub streak counters',
        'Quick shortcuts to urgent notices and assessments'
      ],
      proTip: 'Check this page every morning to stay on top of daily departmental requirements.',
      icon: <LayoutDashboard size={18} className="text-blue-500" />
    },
    'tasks': {
      id: 'tasks',
      title: 'Department Tasks & Submissions',
      badge: 'Assignments',
      description: 'View assignments, workshops, and technical competitions. Submit proof screenshots, enter custom details, and track approvals.',
      keyPoints: [
        'Upload image/PDF proofs before deadlines pass',
        'Form teams with classmates or complete solo entries',
        'Review feedback notes if a submission requires revision'
      ],
      proTip: 'Tasks marked as Urgent or due within 24h are highlighted in bright orange/red.',
      icon: <ClipboardList size={18} className="text-indigo-500" />
    },
    'leetcode-targets': {
      id: 'leetcode-targets',
      title: 'LeetCode & GitHub Coding Progress',
      badge: 'Coding Hub',
      description: 'Track daily problem counts, weekly targets, and GitHub commit activity with 1-click live sync and 30-day streak graphs.',
      keyPoints: [
        '1-click sync with your public LeetCode & GitHub handles',
        'Track progress toward advisor-assigned weekly problem targets',
        'View 30-day activity heatmaps and solve history'
      ],
      proTip: 'Consistent daily solves directly boost your placement readiness score.',
      icon: <Code size={18} className="text-amber-500" />
    },
    'notice-board': {
      id: 'notice-board',
      title: 'Digital Notice Board',
      badge: 'Announcements',
      description: 'Stay updated with urgent circulars, exam timetables, and official announcements with attachment downloads.',
      keyPoints: [
        'Filter notices by Urgent, High, and Normal priorities',
        'Download official circular attachments in PDF/Image formats',
        'Connect Telegram to receive instant smartphone push alerts'
      ],
      proTip: 'Urgent notices are highlighted and pinned at the top of your feed.',
      icon: <Megaphone size={18} className="text-rose-500" />
    },
    'skill-assessment': {
      id: 'skill-assessment',
      title: 'Placement Skill Assessment',
      badge: 'Adaptive AI',
      description: 'Take adaptive domain assessments across Coding, Core CS, Aptitude, and Verbal skills with instant radar analytics.',
      keyPoints: [
        'Adaptive difficulty questions across core engineering domains',
        'Visual radar chart feedback identifying strengths and weaknesses',
        'Earn verified skill badges displayed on your student profile'
      ],
      proTip: 'Retake assessments periodically to reflect your latest skills on your resume.',
      icon: <Sparkles size={18} className="text-purple-500" />
    },
    'placement-readiness': {
      id: 'placement-readiness',
      title: 'Placement Readiness Rating',
      badge: 'Career Index',
      description: 'Holistic 360-degree placement readiness percentile combining academics, coding consistency, and assessment scores.',
      keyPoints: [
        'Overall placement readiness percentile & benchmark rankings',
        'Detailed breakdown across technical, aptitude, and soft skills',
        'Actionable tips to improve your candidate rating'
      ],
      proTip: 'Students with ratings above 80% are prioritized in corporate recruiter candidate pools.',
      icon: <Target size={18} className="text-cyan-500" />
    },
    'live-teaching-hub': {
      id: 'live-teaching-hub',
      title: 'Live Teaching Hub & Sandbox',
      badge: 'Interactive Lab',
      description: 'Join real-time coding lectures with faculty, execute code in interactive sandboxes, and download lecture notes.',
      keyPoints: [
        'Watch live faculty code broadcasts and explanations',
        'Run sample code in an isolated multi-language sandbox',
        'Download lecture code snippets and PDF notes'
      ],
      proTip: 'Use split-screen mode on desktop to code alongside the live instructor broadcast.',
      icon: <Radio size={18} className="text-emerald-500" />
    },
    'opportunities': {
      id: 'opportunities',
      title: 'Placement Drives & Internships',
      badge: 'Campus Drives',
      description: 'Explore job openings and internships posted by verified corporate partners. Filter by eligibility and apply with 1 click.',
      keyPoints: [
        'Filter drives by full-time, internship, stipend, and role',
        '1-click application submission with auto-verified profile data',
        'Real-time tracking of shortlisting and interview rounds'
      ],
      proTip: 'Complete all 4 profile sections to unlock 1-click rapid drive applications.',
      icon: <Briefcase size={18} className="text-teal-500" />
    },
    'student-coding-assessments': {
      id: 'student-coding-assessments',
      title: 'Company Coding Assessments',
      badge: 'Coding IDE',
      description: 'Attempt recruiter technical coding challenges inside a Monaco IDE sandbox with real-time test case verification.',
      keyPoints: [
        'Multi-language code editor with syntax highlighting and auto-complete',
        'Run against public test cases before final hidden submission',
        'Live execution timer and automated test case scoring'
      ],
      proTip: 'Always test edge cases using custom test inputs before submitting your final solution.',
      icon: <Terminal size={18} className="text-indigo-500" />
    },
    'skill-gap-analyzer': {
      id: 'skill-gap-analyzer',
      title: 'Skill Gap AI Analyzer',
      badge: 'Career AI',
      description: 'Compare your verified skills against real industry job descriptions to identify missing skills and get curated learning paths.',
      keyPoints: [
        'Role-targeted readiness scoring for Frontend, Backend, AI/ML, and DevOps',
        'Personalized roadmap of high-demand skills to learn',
        'Curated project ideas to bridge specific technical gaps'
      ],
      proTip: 'Run an analysis whenever you complete new projects or certifications.',
      icon: <Zap size={18} className="text-amber-500" />
    },
    'submissions': {
      id: 'submissions',
      title: 'My Submission History',
      badge: 'Proof Records',
      description: 'Comprehensive log of all your submitted tasks, proof screenshots, verification timestamps, and faculty feedback notes.',
      keyPoints: [
        'Review approval status: Verified, Pending Review, or Re-submission Needed',
        'Read detailed advisor feedback notes on any rejected proofs',
        'Quickly resubmit corrected proof files with 1 click'
      ],
      proTip: 'If a submission is marked Re-submit, read the advisor comment and upload a fresh proof.',
      icon: <CheckCircle2 size={18} className="text-teal-500" />
    },
    'profile': {
      id: 'profile',
      title: 'Profile & Verified PDF Resume',
      badge: 'Certified CV',
      description: 'Manage personal details, skills, projects, and achievements. Generate an ATS-compliant, verified department PDF resume.',
      keyPoints: [
        'Track profile completion percentage across 4 key sections',
        'Add project links, hackathon wins, and certifications',
        'Generate instant verified PDF resume with official seal'
      ],
      proTip: 'The verified PDF resume automatically embeds your verified LeetCode and GitHub metrics.',
      icon: <User size={18} className="text-blue-600" />
    },
    'settings': {
      id: 'settings',
      title: 'Account Settings',
      badge: 'Preferences',
      description: 'Manage account security, update password, link Telegram notifications, and customize your portal experience.',
      keyPoints: [
        'Update account password and recovery details',
        'Configure notification and alert preferences',
        'Manage linked external developer accounts'
      ],
      proTip: 'Keep your contact number updated so advisors can reach you for placement drives.',
      icon: <Settings size={18} className="text-slate-500" />
    }
  },

  STUDENT_COORDINATOR: {
    'dashboard': {
      id: 'dashboard',
      title: 'Coordinator Command Dashboard',
      badge: 'Coordinator Hub',
      description: 'Dual view for student tasks and class-wide submission monitoring, defaulter stats, and pending verification queues.',
      keyPoints: [
        'Track class-wide task submission percentages',
        'Monitor daily LeetCode compliance across your section',
        'Quick shortcuts to verify proofs and send reminder alerts'
      ],
      proTip: 'Use your coordinator authority to keep class submission rates at 100%.',
      icon: <LayoutDashboard size={18} className="text-blue-500" />
    },
    'verifications': {
      id: 'verifications',
      title: 'Class Submission Verifications',
      badge: 'Verification Authority',
      description: 'Inspect proof screenshots and custom fields submitted by peers in your section. Approve valid entries or request fixes.',
      keyPoints: [
        'Full-resolution preview of classmate completion proofs',
        '1-click approval or rejection with feedback comments',
        'Collaborate directly with your faculty Class Advisor on pending queues'
      ],
      proTip: 'Adding clear rejection notes helps classmates quickly fix proof errors.',
      icon: <ShieldCheck size={18} className="text-emerald-600" />
    },
    'tasks': {
      id: 'tasks',
      title: 'Tasks & Pending Email Reminders',
      badge: 'Defaulter Alerts',
      description: 'View department assignments, create team submissions, and dispatch automated reminder emails to incomplete classmates.',
      keyPoints: [
        '1-click Send Pending Email Alert to all incomplete peers',
        'Monitor who has submitted versus who is still pending',
        'Form and lead team submissions for group assignments'
      ],
      proTip: 'Dispatch pending email reminders 24 hours before deadlines to maximize submissions.',
      icon: <ClipboardList size={18} className="text-indigo-500" />
    },
    'leetcode-targets': {
      id: 'leetcode-targets',
      title: 'Class Coding Streak Monitor',
      badge: 'Coding Monitor',
      description: 'Track daily problem counts, weekly targets, and GitHub commit streaks across all students in your class section.',
      keyPoints: [
        'Track daily target compliance rates for your section',
        'Identify inactive classmates and encourage active streaks',
        'Sync your personal LeetCode & GitHub stats regularly'
      ],
      proTip: 'Celebrate top weekly coders in your class group to build healthy competition.',
      icon: <Code size={18} className="text-amber-500" />
    },
    'opportunities': {
      id: 'opportunities',
      title: 'Placement Drives & Verified Resume',
      badge: 'Career Hub',
      description: 'Apply to verified campus recruitment opportunities and export your ATS-friendly certified department PDF resume.',
      keyPoints: [
        'Explore verified company drives and internships',
        '1-click application submission with verified credentials',
        'Download your official certified PDF resume'
      ],
      proTip: 'Maintain a high placement rating by completing domain assessments.',
      icon: <Briefcase size={18} className="text-teal-500" />
    }
  },

  CLASS_ADVISOR: {
    'dashboard': {
      id: 'dashboard',
      title: 'Class Advisor Dashboard',
      badge: 'Advisor Hub',
      description: 'Central overview of class submission rates, pending verification queues, LeetCode target compliance, and quick action shortcuts.',
      keyPoints: [
        'Class-wide task completion metrics and compliance percentages',
        'Pending verification counter for quick review',
        'Recent notices and student milestone summaries'
      ],
      proTip: 'Review the pending verifications counter daily to keep approval queues clear.',
      icon: <LayoutDashboard size={18} className="text-blue-500" />
    },
    'verifications': {
      id: 'verifications',
      title: 'Task Verification & Approval Center',
      badge: 'Primary Approval',
      description: 'Inspect student screenshots and custom proof fields. Approve valid submissions or reject with feedback notes for resubmission.',
      keyPoints: [
        'Full-resolution image preview of student completion proofs',
        'Instant 1-click approval or rejection with custom feedback notes',
        'Filter submissions by task category, student register number, or status'
      ],
      proTip: 'Rejections automatically unlock a resubmission slot for the student.',
      icon: <ShieldCheck size={18} className="text-emerald-600" />
    },
    'tasks': {
      id: 'tasks',
      title: 'Class Task & Defaulter Management',
      badge: 'Defaulter Alerts',
      description: 'Track task submissions for your assigned class and dispatch automated reminder emails to incomplete students with 1 click.',
      keyPoints: [
        '1-click automated email dispatch to all incomplete students',
        'View live completion percentages per task',
        'Filter by pending vs submitted student rosters'
      ],
      proTip: 'Dispatch pending email alerts 24 hours prior to deadline to minimize defaulters.',
      icon: <ClipboardList size={18} className="text-indigo-500" />
    },
    'leetcode-targets': {
      id: 'leetcode-targets',
      title: 'LeetCode & GitHub Progress Monitor',
      badge: 'Target Config',
      description: 'Configure daily & weekly problem targets for your class section, monitor solves in real-time, and export Excel compliance reports.',
      keyPoints: [
        'Set class-wide daily & weekly problem-solving targets',
        'Monitor live solve counts and identify inactive students',
        'Export Excel reports for departmental compliance records'
      ],
      proTip: 'Use the Target Configuration tool to set realistic milestones during exam weeks.',
      icon: <Code size={18} className="text-amber-500" />
    },
    'my-class': {
      id: 'my-class',
      title: 'Class Roster & Student Directory',
      badge: 'Roster Control',
      description: 'Complete student directory with GPA tracking, contact numbers, parent details, and verified PDF resume downloads.',
      keyPoints: [
        'Quick search by register number, name, or CGPA',
        'Inspect individual student submission histories and achievements',
        '1-click password reset tool for student accounts'
      ],
      proTip: 'Click on any student card to view their complete academic and coding portfolio.',
      icon: <Building2 size={18} className="text-violet-500" />
    },
    'notice-board': {
      id: 'notice-board',
      title: 'Class Notice Broadcasts',
      badge: 'Broadcasts',
      description: 'Publish official circulars, exam schedules, and announcements with optional PDF/image attachments targeted to your class.',
      keyPoints: [
        'Attach official PDF circulars or image flyers',
        'Select priority level: Urgent, High, Normal',
        'Pin critical announcements to the top of student feeds'
      ],
      proTip: 'Notices marked as Urgent trigger instant Telegram alerts to linked students.',
      icon: <Megaphone size={18} className="text-rose-500" />
    },
    'faculty-industry-hub': {
      id: 'faculty-industry-hub',
      title: 'Faculty-Industry Collaboration',
      badge: 'Industry Bridge',
      description: 'Collaborate with corporate recruiters on student mentorship, joint project tracks, and placement drive coordination.',
      keyPoints: [
        'Review corporate partner engagement requests',
        'Coordinate industry workshops and hackathon mentorships',
        'Track student placement conversion rates across drives'
      ],
      proTip: 'Connect high-performing student cohorts directly with industry project mentors.',
      icon: <GraduationCap size={18} className="text-blue-400" />
    },
    'institutional-skill-heatmap': {
      id: 'institutional-skill-heatmap',
      title: 'Class Skill Heatmap Analytics',
      badge: 'Skill Analytics',
      description: 'Visual heatmap breaking down technical competencies, coding readiness, and skill gaps across your class section.',
      keyPoints: [
        'Identify specific technical domains where students need targeted workshops',
        'Compare section performance against department benchmarks',
        'Export visual reports for departmental review meetings'
      ],
      proTip: 'Use domain gap data to arrange specialized hands-on coaching sessions.',
      icon: <BarChart3 size={18} className="text-pink-400" />
    }
  },

  HOD: {
    'dashboard': {
      id: 'dashboard',
      title: 'HOD Executive Dashboard',
      badge: 'Executive Oversight',
      description: 'Strategic oversight of all academic batches (1st-4th Year), class advisors, department analytics, and industry tie-ups.',
      keyPoints: [
        'Multi-batch task compliance and submission trend charts',
        'Overview of active classes, advisors, and student enrollments',
        '1-click shortcuts to broadcast department circulars'
      ],
      proTip: 'Use batch comparison charts to monitor placement readiness across 3rd & 4th year cohorts.',
      icon: <LayoutDashboard size={18} className="text-blue-500" />
    },
    'tasks': {
      id: 'tasks',
      title: 'Department Task & Deadline Control',
      badge: 'Academic Control',
      description: 'Create multi-class tasks, attach poster previews, dispatch automated email reminders to defaulters, and extend deadlines.',
      keyPoints: [
        'Broadcast tasks to all department sections simultaneously',
        'Send 1-click email alerts to all incomplete students across batches',
        'Re-open closed tasks by extending deadlines with custom dates'
      ],
      proTip: 'The multi-node email dispatch automatically delivers reminder notices to student inboxes.',
      icon: <ClipboardList size={18} className="text-indigo-500" />
    },
    'institutional-skill-heatmap': {
      id: 'institutional-skill-heatmap',
      title: 'Institutional Skill Heatmap',
      badge: 'Cohort AI',
      description: 'Interactive visual heatmaps breaking down technical competencies, coding readiness, and skill gaps across all batches.',
      keyPoints: [
        'Batch-by-batch technical competency comparisons across all 4 years',
        'Identify department-wide skill deficiencies for curriculum refinement',
        'Export visual reports for accreditation and review committees'
      ],
      proTip: 'Filter by year to compare 3rd year vs 4th year placement preparedness.',
      icon: <BarChart3 size={18} className="text-pink-500" />
    },
    'faculty-industry-hub': {
      id: 'faculty-industry-hub',
      title: 'Faculty-Industry Innovation Hub',
      badge: 'Corporate Tie-ups',
      description: 'Coordinate joint academic-industry initiatives, approve corporate recruitment partners, and organize coding tracks.',
      keyPoints: [
        'Review corporate recruiter registration requests and company credentials',
        'Manage joint student-industry innovation projects',
        'Track student placement conversion rates across drives'
      ],
      proTip: 'Check the pending approvals badge to promptly activate newly registered recruiters.',
      icon: <GraduationCap size={18} className="text-blue-500" />
    },
    'industry-approvals': {
      id: 'industry-approvals',
      title: 'Corporate Partner Approvals',
      badge: 'Recruiter Vetting',
      description: 'Review registering corporate HR accounts, verify company credentials, and approve access to student talent pools.',
      keyPoints: [
        'Inspect recruiter company profiles, official domains, and contact info',
        'Approve or decline recruiter access to student resumes',
        'Audit recruiter hiring and assessment activities'
      ],
      proTip: 'Verify corporate email domains before granting candidate search access.',
      icon: <Briefcase size={18} className="text-emerald-500" />
    },
    'classes': {
      id: 'classes',
      title: 'Classes & Advisor Assignments',
      badge: 'Faculty Admin',
      description: 'Create and organize sections across 1st to 4th year, designate faculty class advisors, and track student enrollment.',
      keyPoints: [
        'Create class sections and designate faculty advisors',
        'Monitor student enrollment counts and advisor workloads',
        'Manage coordinator appointments per section'
      ],
      proTip: 'Assign qualified faculty advisors to each class section for autonomous verification.',
      icon: <Building2 size={18} className="text-violet-500" />
    },
    'users': {
      id: 'users',
      title: 'Faculty & Student User Directory',
      badge: 'User Control',
      description: 'Manage department faculty, advisors, and students with 1-click password resets, role edits, and account activation tools.',
      keyPoints: [
        'Search users across all batches and faculty roles',
        '1-click password reset to default credentials',
        'Promote or designate student coordinator privileges'
      ],
      proTip: 'Filter by role to perform quick maintenance on faculty or student accounts.',
      icon: <Users size={18} className="text-sky-500" />
    },
    'verifications': {
      id: 'verifications',
      title: 'Department Verifications Audit',
      badge: 'Audit Trail',
      description: 'High-level audit of all submitted task proofs, advisor review speeds, and verification dispute resolutions.',
      keyPoints: [
        'Audit proof verification turnaround times across advisors',
        'Review approved and rejected submission archives',
        'Override or resolve disputed student verifications'
      ],
      proTip: 'Ensure advisors maintain zero backlog on active task verifications.',
      icon: <ShieldCheck size={18} className="text-emerald-600" />
    }
  },

  SUPREME_ADMIN: {
    'dashboard': {
      id: 'dashboard',
      title: 'Supreme Master Command Center',
      badge: 'Super Admin',
      description: 'Global system statistics, active department counts, user registrations, server health, and institutional activity relays.',
      keyPoints: [
        'Real-time overview of all departments, batches, and users',
        'Global system logs and database backup relays',
        'System-wide announcement broadcasting'
      ],
      proTip: 'Monitor active user counts and server response times during peak hours.',
      icon: <LayoutDashboard size={18} className="text-blue-500" />
    },
    'departments': {
      id: 'departments',
      title: 'Department & Batch Architecture',
      badge: 'Institutional Architecture',
      description: 'Create and configure institutional departments, course codes, academic branches, and designate department heads.',
      keyPoints: [
        'Create new departments and assigned code identifiers',
        'Oversee cross-departmental user distribution',
        'Assign and update HOD leadership accounts'
      ],
      proTip: 'Department structures dynamically organize all subordinate class sections and tasks.',
      icon: <Building2 size={18} className="text-violet-500" />
    },
    'industry-approvals': {
      id: 'industry-approvals',
      title: 'Corporate Recruiter Verification',
      badge: 'Global Approvals',
      description: 'Review registering corporate HR accounts, verify company credentials, and approve access to student talent pools.',
      keyPoints: [
        'Inspect recruiter company profiles and contact emails',
        'Approve or decline recruiter access to student resumes',
        'Audit recruiter hiring and assessment activities'
      ],
      proTip: 'Approved corporate recruiters gain instant access to candidate search and coding test creation.',
      icon: <Briefcase size={18} className="text-emerald-500" />
    },
    'users': {
      id: 'users',
      title: 'Global User Administration',
      badge: 'Global Users',
      description: 'Manage all student, faculty, advisor, HOD, and recruiter accounts with instant credential resets and role upgrades.',
      keyPoints: [
        'Search users across all roles and departments',
        '1-click password reset to default register number',
        'Manage student coordinator badges and role permissions'
      ],
      proTip: 'Filter by role to perform quick maintenance on faculty or advisor accounts.',
      icon: <Users size={18} className="text-sky-500" />
    },
    'institutional-skill-heatmap': {
      id: 'institutional-skill-heatmap',
      title: 'Institution-wide Skill Heatmap',
      badge: 'Campus Analytics',
      description: 'Campus-wide technical competency heatmaps across all engineering branches, batches, and coding platforms.',
      keyPoints: [
        'Cross-departmental skill comparisons and benchmarks',
        'Identify institutional training requirements',
        'Export comprehensive reports for management and accreditation'
      ],
      proTip: 'Compare engineering branches to identify high-performing domains.',
      icon: <BarChart3 size={18} className="text-pink-400" />
    }
  },

  INDUSTRY: {
    'industry-dashboard': {
      id: 'industry-dashboard',
      title: 'Recruiter Dashboard',
      badge: 'Corporate Hub',
      description: 'Recruiter command center showing active job listings, received applications, and candidate match rates.',
      keyPoints: [
        'Overview of active campus job and internship drives',
        'Summary of received student applications and review statuses',
        'Quick access to coding assessments and candidate talent pool'
      ],
      proTip: 'Check received applications daily to schedule timely interview rounds.',
      icon: <LayoutDashboard size={18} className="text-blue-500" />
    },
    'industry-applications': {
      id: 'industry-applications',
      title: 'Candidate Applications',
      badge: 'Applicant Review',
      description: 'Review student applications for your postings, inspect verified resumes, update application statuses, and shortlist candidates.',
      keyPoints: [
        'Filter applicants by job posting, CGPA, and coding scores',
        'Download verified, ATS-compliant department-certified student PDF resumes',
        'Update candidate status: Applied, Shortlisted, Interviewed, Offered'
      ],
      proTip: 'Shortlisted candidates automatically receive notification updates.',
      icon: <UserCheck size={18} className="text-indigo-500" />
    },
    'industry-postings': {
      id: 'industry-postings',
      title: 'Campus Job & Internship Postings',
      badge: 'Drive Postings',
      description: 'Create and publish job listings with tailored eligibility criteria, salary/stipend packages, and application deadlines.',
      keyPoints: [
        'Specify required minimum CGPA, department branches, and skills',
        'Set application deadlines and attach drive guidelines',
        'Target specific graduation batches (e.g., 2026 Batch)'
      ],
      proTip: 'Specify required skills so the platform highlights matching student profiles.',
      icon: <Briefcase size={18} className="text-amber-500" />
    },
    'industry-coding-assessments': {
      id: 'industry-coding-assessments',
      title: 'Custom Coding Challenges & Tests',
      badge: 'Technical Assessment',
      description: 'Build algorithmic coding challenges with custom test cases, hidden evaluation criteria, and automated scoring.',
      keyPoints: [
        'Create questions in C++, Java, Python, and JavaScript',
        'Configure public and private test cases with score weights',
        'Inspect candidate submitted code, execution times, and memory metrics'
      ],
      proTip: 'Use private test cases to detect hard-coded edge case solutions.',
      icon: <Terminal size={18} className="text-emerald-500" />
    },
    'users': {
      id: 'users',
      title: 'Candidate Talent Pool & Verified Resumes',
      badge: 'Talent Sourcing',
      description: 'Search top-ranking students across coding solved counts, CGPA, and skill proficiencies. Download verified PDF profiles.',
      keyPoints: [
        'Real-time ranking of top student coders across the institution',
        'Direct download of verified, department-certified PDF resumes',
        'Direct candidate filtering by graduation year and tech stack'
      ],
      proTip: 'Look for students with high Placement Readiness ratings for rapid hiring.',
      icon: <Users size={18} className="text-sky-500" />
    },
    'faculty-industry-hub': {
      id: 'faculty-industry-hub',
      title: 'Academia-Industry Innovation Network',
      badge: 'Faculty Hub',
      description: 'Collaborate with faculty on curriculum enhancement, sponsored student projects, and hackathon initiatives.',
      keyPoints: [
        'Engage early with student cohorts through sponsored workshops',
        'Propose real-world capstone project topics to faculty',
        'Organize campus hackathons with department support'
      ],
      proTip: 'Early academic engagement dramatically improves final placement conversions.',
      icon: <GraduationCap size={18} className="text-purple-500" />
    },
    'industry-reports': {
      id: 'industry-reports',
      title: 'Recruitment Analytics & Reports',
      badge: 'HR Metrics',
      description: 'Comprehensive hiring analytics, assessment score distributions, and talent pipeline performance reports.',
      keyPoints: [
        'Analyze candidate assessment pass rates and test score distributions',
        'Track hiring pipeline conversion funnel from application to offer',
        'Export summary reports for corporate recruitment reviews'
      ],
      proTip: 'Use score distribution graphs to calibrate test difficulty for future rounds.',
      icon: <TrendingUp size={18} className="text-rose-500" />
    },
    'industry-profile': {
      id: 'industry-profile',
      title: 'Company Profile & Branding',
      badge: 'Company Profile',
      description: 'Manage corporate branding, company logo, description, recruiter contacts, and website links displayed to students.',
      keyPoints: [
        'Update corporate overview, culture details, and benefits',
        'Upload high-resolution corporate logo for job drive headers',
        'Manage primary HR recruiter contact info'
      ],
      proTip: 'A detailed company profile increases student drive application volume.',
      icon: <Building2 size={18} className="text-teal-500" />
    },
    'settings': {
      id: 'settings',
      title: 'Recruiter Settings',
      badge: 'Security',
      description: 'Manage corporate account password, login credentials, and notification alert preferences.',
      keyPoints: [
        'Update account security credentials',
        'Configure applicant email notification alerts'
      ],
      proTip: 'Enable email alerts to be notified immediately when a top candidate applies.',
      icon: <Settings size={18} className="text-slate-500" />
    }
  }
};

// -------------------------------------------------------------
// Helper to look up feature information for any role & view
// -------------------------------------------------------------

export function getSidebarFeatureInfo(
  viewKey: string,
  userRole?: string,
  isCoordinator?: boolean
): SidebarFeatureInfo | null {
  const effectiveRole = (isCoordinator && userRole?.toUpperCase() === 'STUDENT')
    ? 'STUDENT_COORDINATOR'
    : (userRole?.toUpperCase() || 'STUDENT');

  const roleFeatures = SIDEBAR_FEATURES[effectiveRole] || SIDEBAR_FEATURES.STUDENT;

  if (roleFeatures[viewKey]) {
    return roleFeatures[viewKey];
  }

  // Fallback to student features if not in specific role
  if (SIDEBAR_FEATURES.STUDENT[viewKey]) {
    return SIDEBAR_FEATURES.STUDENT[viewKey];
  }

  // Fallback to advisor/HOD/industry if applicable
  for (const roleKey of Object.keys(SIDEBAR_FEATURES)) {
    if (SIDEBAR_FEATURES[roleKey][viewKey]) {
      return SIDEBAR_FEATURES[roleKey][viewKey];
    }
  }

  return null;
}

// -------------------------------------------------------------
// Mini Feature Popover Card Component for Sidebar Items
// -------------------------------------------------------------

interface SidebarFeaturePopoverProps {
  feature: SidebarFeatureInfo;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  isActive?: boolean;
  anchorRect?: DOMRect | null;
}

export function SidebarFeaturePopover({
  feature,
  isOpen,
  onClose,
  onNavigate,
  isActive = false,
  anchorRect
}: SidebarFeaturePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate position relative to viewport or anchor
  const topPosition = anchorRect ? Math.min(Math.max(anchorRect.top - 10, 60), window.innerHeight - 340) : 100;
  const leftPosition = anchorRect ? anchorRect.right + 12 : 260;

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, x: -8, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -8, scale: 0.96 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        style={{
          top: `${topPosition}px`,
          left: `${leftPosition}px`
        }}
        className="fixed z-[9999] w-80 max-w-[calc(100vw-300px)] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-950/20 border border-zinc-200/90 dark:border-zinc-800 p-4 text-left pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
              {feature.icon}
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100/90 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {feature.badge}
              </span>
              <h4 className="text-xs font-black text-zinc-900 dark:text-white truncate mt-0.5">
                {feature.title}
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Close mini tab"
          >
            <X size={14} />
          </button>
        </div>

        {/* Short Description */}
        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed mb-3">
          {feature.description}
        </p>

        {/* Key Highlights */}
        {feature.keyPoints && feature.keyPoints.length > 0 && (
          <div className="space-y-1.5 mb-3 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-indigo-500" /> Key Features:
            </p>
            <ul className="space-y-1">
              {feature.keyPoints.map((point, idx) => (
                <li key={idx} className="text-[10.5px] text-zinc-700 dark:text-zinc-300 flex items-start gap-1.5 leading-tight">
                  <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pro Tip if available */}
        {feature.proTip && (
          <div className="flex items-start gap-1.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 rounded-lg p-2 mb-3 leading-snug font-medium">
            <Lightbulb size={12} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>{feature.proTip}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {isActive ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2 py-1">
              <CheckCircle2 size={12} /> Currently Active View
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <span>Open View</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// -------------------------------------------------------------
// Compact Sidebar Feature Guide Flyout Drawer
// (Triggered cleanly from top-bar/sidebar without full-screen modal)
// -------------------------------------------------------------

interface SidebarFeatureGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  isCoordinator?: boolean;
  onNavigateView: (view: string) => void;
  currentView: string;
}

export function SidebarFeatureGuideDrawer({
  isOpen,
  onClose,
  userRole = 'STUDENT',
  isCoordinator = false,
  onNavigateView,
  currentView
}: SidebarFeatureGuideDrawerProps) {
  const effectiveRole = (isCoordinator && userRole?.toUpperCase() === 'STUDENT')
    ? 'STUDENT_COORDINATOR'
    : (userRole?.toUpperCase() || 'STUDENT');

  const roleFeatures = SIDEBAR_FEATURES[effectiveRole] || SIDEBAR_FEATURES.STUDENT;
  const featureList = Object.entries(roleFeatures);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return featureList;
    const q = search.toLowerCase();
    return featureList.filter(([_, item]) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  }, [featureList, search]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex pointer-events-auto">
        {/* Subtle backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Compact Slide-out Side Drawer */}
        <motion.div
          initial={{ x: -360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -360, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="relative w-96 max-w-[90vw] h-full bg-white dark:bg-zinc-900 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 z-10 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Sidebar Feature Guide
                </h3>
                <p className="text-[10px] font-bold text-zinc-500">
                  {effectiveRole.replace(/_/g, ' ')} Portal Reference
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
            <input
              type="text"
              placeholder="Search sidebar features..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
          </div>

          {/* List of features */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filtered.map(([viewKey, feat]) => {
              const isCurrent = currentView === viewKey;
              return (
                <div
                  key={viewKey}
                  onClick={() => {
                    onNavigateView(viewKey);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer group ${
                    isCurrent
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                      : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0">{feat.icon}</div>
                      <span className="text-xs font-black text-zinc-900 dark:text-white truncate">
                        {feat.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 shrink-0">
                      {feat.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed line-clamp-2 mb-2">
                    {feat.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                    <span>{isCurrent ? '● Active Tab' : 'Click to Switch'}</span>
                    <ExternalLink size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-center">
            <p className="text-[10px] text-zinc-500 font-semibold">
              Tip: Hover or click the mini <Info size={11} className="inline text-indigo-500 mx-0.5" /> icon on any sidebar item for instant feature guides!
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Default export for backward compatibility
export default function PortalTutorGuide(props: any) {
  return (
    <SidebarFeatureGuideDrawer
      isOpen={props.isOpen}
      onClose={props.onClose}
      userRole={props.userRole}
      isCoordinator={props.isCoordinator}
      onNavigateView={props.onNavigateView}
      currentView={props.currentView}
    />
  );
}
