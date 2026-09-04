/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  FileDown,
  UserCheck,
  TrendingUp,
  LayoutDashboard,
  Zap,
  Radio,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Info,
  Layers,
  Send,
  User
} from 'lucide-react';

export type UserRole = 'STUDENT' | 'STUDENT_COORDINATOR' | 'CLASS_ADVISOR' | 'HOD' | 'SUPREME_ADMIN' | 'INDUSTRY';

export interface TourStep {
  id: string;
  targetId?: string; // DOM element ID to spotlight
  view?: string;     // Portal view to switch to for this step
  title: string;
  description: string;
  badge?: string;
  category?: string;
  tips?: string[];
  icon: React.ReactNode;
}

export interface FeatureGuideItem {
  id: string;
  title: string;
  category: 'Core' | 'Academic & Tasks' | 'Coding & Skills' | 'Placement & Industry' | 'Administration';
  description: string;
  targetView: string;
  icon: React.ReactNode;
  keyPoints: string[];
  proTip: string;
}

interface PortalTutorGuideProps {
  userRole?: string;
  isCoordinator?: boolean;
  userName?: string;
  currentView: string;
  onNavigateView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'TOUR' | 'DIRECTORY';
}

// -------------------------------------------------------------
// Role-Specific Step & Feature Definitions
// -------------------------------------------------------------

export const ROLE_TOUR_STEPS: Record<string, TourStep[]> = {
  STUDENT_COORDINATOR: [
    {
      id: 'coord-welcome',
      title: 'Welcome to Student Coordinator Command Hub',
      description: 'You have dual capabilities: complete your student tasks & coding targets, plus help your Class Advisor verify submissions, track defaulters, and manage class broadcasts.',
      badge: 'Student Coordinator',
      icon: <GraduationCap className="text-indigo-600" size={24} />,
      tips: [
        'Assist your Class Advisor in verifying classmate submissions and proofs',
        'Monitor class-wide LeetCode & GitHub streak completion',
        'Help broadcast circulars and send reminder alerts to incomplete peers'
      ]
    },
    {
      id: 'coord-verifications',
      targetId: 'nav-item-verifications',
      view: 'verifications',
      title: 'Classmate Submission Verifications',
      description: 'Inspect task proofs submitted by peers in your section. Approve verified completions or send feedback for resubmissions.',
      badge: 'Coordinator Authority',
      icon: <ShieldCheck className="text-emerald-600" size={24} />,
      tips: [
        'Review uploaded screenshots and custom registration field proofs',
        'Collaborate with your faculty Class Advisor on pending review queues'
      ]
    },
    {
      id: 'coord-tasks',
      targetId: 'nav-item-tasks',
      view: 'tasks',
      title: 'Tasks & Pending Email Reminders',
      description: 'View department assignments, create team entries, and dispatch automated reminder alerts to incomplete classmates.',
      badge: 'Task Management',
      icon: <ClipboardList className="text-indigo-500" size={24} />,
      tips: [
        'Use "Send Pending Email Alert" to notify incomplete classmates across your section',
        'Monitor who has submitted versus who is still pending'
      ]
    },
    {
      id: 'coord-coding',
      targetId: 'nav-item-leetcode-targets',
      view: 'leetcode-targets',
      title: 'Class Coding Progress & Daily Targets',
      description: 'Track daily problem counts, weekly targets, and GitHub commit activity across all students in your assigned class.',
      badge: 'Coding Monitor',
      icon: <Code className="text-amber-500" size={24} />,
      tips: [
        'Track daily target compliance rates for your section',
        'Sync your personal LeetCode and GitHub stats regularly'
      ]
    },
    {
      id: 'coord-opportunities',
      targetId: 'nav-item-opportunities',
      view: 'opportunities',
      title: 'Placement Drives & Verified Resume',
      description: 'Apply to verified campus recruitment opportunities and export your ATS-friendly certified department PDF resume.',
      badge: 'Career & Placement',
      icon: <Briefcase className="text-teal-500" size={24} />,
      tips: [
        'Maintain a high Placement Readiness rating by completing domain assessments'
      ]
    }
  ],
  STUDENT: [
    {
      id: 'student-welcome',
      title: 'Welcome to Student Academic & Career Portal',
      description: 'Your central hub for tracking departmental tasks, daily coding challenges, skill assessments, placement opportunities, and live classes.',
      badge: 'Getting Started',
      icon: <GraduationCap className="text-indigo-600" size={24} />,
      tips: [
        'Complete assigned tasks before deadlines to maintain 100% compliance',
        'Sync your GitHub and LeetCode daily to boost your placement readiness rating',
        'Download your verified academic & skill resume directly from the profile tab'
      ]
    },
    {
      id: 'tour-tasks',
      targetId: 'nav-item-tasks',
      view: 'tasks',
      title: 'Department Tasks & Event Submissions',
      description: 'View assignments, workshops, and competitions. Submit proof screenshots, complete custom fields, or form teams for group tasks.',
      badge: 'Core Feature',
      icon: <ClipboardList className="text-indigo-500" size={24} />,
      tips: [
        'Attach clear screenshots showing completion before submitting',
        'For team tasks, invite classmates from your section or complete solo',
        'Check feedback notes if a submission requires revisions'
      ]
    },
    {
      id: 'tour-coding',
      targetId: 'nav-item-leetcode-targets',
      view: 'leetcode-targets',
      title: 'LeetCode & GitHub Daily Progress Tracker',
      description: 'Track daily problem counts, weekly targets, and GitHub commit activity with real-time sync and 30-day performance graphs.',
      badge: 'Coding Hub',
      icon: <Code className="text-amber-500" size={24} />,
      tips: [
        'Click the Sync button to fetch your latest LeetCode solves and commits',
        'Aim to meet your daily targets set by faculty advisors'
      ]
    },
    {
      id: 'tour-opportunities',
      targetId: 'nav-item-opportunities',
      view: 'opportunities',
      title: 'Corporate Recruitment & Internships',
      description: 'Explore campus drive listings and internships posted by verified industry partners. Filter by eligibility and apply with one click.',
      badge: 'Placement & Career',
      icon: <Briefcase className="text-teal-500" size={24} />,
      tips: [
        'Keep your profile information 100% completed to increase shortlist rates',
        'Attempt company coding tests directly through the assessment module'
      ]
    },
    {
      id: 'tour-assessments',
      targetId: 'nav-item-skill-assessment',
      view: 'skill-assessment',
      title: 'Placement Skill Assessment & Radar Analytics',
      description: 'Take adaptive domain assessments across Coding, Core CS, Aptitude, and Verbal skills. Receive immediate radar chart feedback.',
      badge: 'Assessment AI',
      icon: <Sparkles className="text-purple-500" size={24} />,
      tips: [
        'Use the Skill Gap AI analyzer to identify target skills needed for specific job roles',
        'Earn validated skill badges displayed on your verified student profile'
      ]
    },
    {
      id: 'tour-live-hub',
      targetId: 'nav-item-live-teaching-hub',
      view: 'live-teaching-hub',
      title: 'Live Teaching Hub & Collaborative Sandbox',
      description: 'Join real-time coding sessions with faculty, run code in isolated sandboxes, and download lecture resources.',
      badge: 'Classroom Hub',
      icon: <Radio className="text-emerald-500" size={24} />,
      tips: [
        'Practice live syntax and debug directly alongside faculty instructions'
      ]
    },
    {
      id: 'tour-notice-board',
      targetId: 'nav-item-notice-board',
      view: 'notice-board',
      title: 'Digital Notice Board & Official Broadcasts',
      description: 'Stay updated with urgent announcements, exam schedules, and circulars with priority filtering and attachment downloads.',
      badge: 'Announcements',
      icon: <Megaphone className="text-rose-500" size={24} />,
      tips: [
        'Connect Telegram to receive instantaneous 1-to-1 reminders for all announcements'
      ]
    },
    {
      id: 'tour-profile',
      targetId: 'nav-item-profile',
      view: 'profile',
      title: 'Student Profile & Verified PDF Resume Generator',
      description: 'Manage personal info, skills, projects, achievements, and export an ATS-friendly, verified department PDF resume.',
      badge: 'Profile & Resume',
      icon: <User className="text-blue-600" size={24} />,
      tips: [
        'Include verified project links, certifications, and GitHub repositories',
        'Click Generate Verified PDF to instantly download your placement resume'
      ]
    }
  ],

  CLASS_ADVISOR: [
    {
      id: 'advisor-welcome',
      title: 'Welcome to Class Advisor Management Portal',
      description: 'Your command center for verifying class submissions, monitoring student coding targets, broadcasting notices, and tracking performance.',
      badge: 'Advisor Hub',
      icon: <ShieldCheck className="text-indigo-600" size={24} />,
      tips: [
        'Review pending task submissions daily to give prompt feedback',
        'Set daily & weekly LeetCode targets for your class section',
        'Dispatch automated email reminders to incomplete students with 1 click'
      ]
    },
    {
      id: 'tour-verifications',
      targetId: 'nav-item-verifications',
      view: 'verifications',
      title: 'Task Verification & Approval Workflow',
      description: 'Inspect student screenshots and custom fields. Approve valid submissions or reject with feedback notes for resubmission.',
      badge: 'Verification Center',
      icon: <ShieldCheck className="text-emerald-600" size={24} />,
      tips: [
        'Click on screenshots to view full-resolution proof images',
        'Add constructive rejection notes so students know how to correct errors'
      ]
    },
    {
      id: 'tour-coding-monitor',
      targetId: 'nav-item-leetcode-targets',
      view: 'leetcode-targets',
      title: 'Class Coding Progress & Target Configurations',
      description: 'Monitor daily and weekly LeetCode solves and GitHub commit activity for all students in your class section.',
      badge: 'Coding Monitor',
      icon: <Code className="text-amber-500" size={24} />,
      tips: [
        'Use the "LeetCode Target" button to assign class-wide daily problem targets',
        'Export Excel reports for departmental compliance records'
      ]
    },
    {
      id: 'tour-my-class',
      targetId: 'nav-item-my-class',
      view: 'my-class',
      title: 'Class Roster & Student Profiles',
      description: 'View the complete directory of students in your assigned class, track individual GPA, submission rates, and contact info.',
      badge: 'Class Roster',
      icon: <Building2 className="text-violet-500" size={24} />,
      tips: [
        'Click on any student to view their full portfolio, achievements, and verified resume'
      ]
    },
    {
      id: 'tour-notices-advisor',
      targetId: 'nav-item-notice-board',
      view: 'notice-board',
      title: 'Publish Class & Department Notices',
      description: 'Broadcast urgent circulars, exam schedules, and instructions with optional PDF/image attachments targeted specifically to your class.',
      badge: 'Communications',
      icon: <Megaphone className="text-rose-500" size={24} />,
      tips: [
        'Pin important circulars to keep them at the top of students notice boards'
      ]
    }
  ],

  HOD: [
    {
      id: 'hod-welcome',
      title: 'Welcome to Department Head (HOD) Portal',
      description: 'Strategic oversight of all academic batches, class advisors, department analytics, institutional skill heatmaps, and industry collaborations.',
      badge: 'HOD Executive Portal',
      icon: <Building2 className="text-indigo-600" size={24} />,
      tips: [
        'Analyze department-wide submission trends across all four academic years',
        'Review corporate tie-ups and approve registered industry partners',
        'Broadcast official department-wide announcements with 1 click'
      ]
    },
    {
      id: 'tour-department-tasks',
      targetId: 'nav-item-tasks',
      view: 'tasks',
      title: 'Department Task Creation & Deadline Extensions',
      description: 'Create multi-class tasks, attach poster previews, dispatch automated email reminders to defaulters, and extend deadlines as needed.',
      badge: 'Academic Control',
      icon: <ClipboardList className="text-indigo-500" size={24} />,
      tips: [
        'Use "Send Pending Email Alert" to notify incomplete students across classes',
        'Re-open tasks easily using "Extend Deadline & Reopen"'
      ]
    },
    {
      id: 'tour-skill-heatmap',
      targetId: 'nav-item-institutional-skill-heatmap',
      view: 'institutional-skill-heatmap',
      title: 'Institutional Skill Heatmap & Cohort Analytics',
      description: 'Interactive visual heatmaps breaking down technical competencies, coding readiness, and skill gaps across all sections.',
      badge: 'Analytics AI',
      icon: <BarChart3 className="text-pink-500" size={24} />,
      tips: [
        'Identify specific technical domains where students require targeted workshops'
      ]
    },
    {
      id: 'tour-faculty-hub',
      targetId: 'nav-item-faculty-industry-hub',
      view: 'faculty-industry-hub',
      title: 'Faculty-Industry Innovation Hub',
      description: 'Collaborate with corporate partners, review joint research and project requests, and manage corporate coding assessment tracks.',
      badge: 'Industry Tie-ups',
      icon: <GraduationCap className="text-blue-500" size={24} />,
      tips: [
        'Coordinate joint campus recruitment drives and industrial mentorship programs'
      ]
    },
    {
      id: 'tour-classes-hod',
      targetId: 'nav-item-classes',
      view: 'classes',
      title: 'Classes, Sections & Advisor Assignments',
      description: 'Create and organize sections across 1st to 4th year, designate faculty class advisors, and track student enrollment.',
      badge: 'Faculty Admin',
      icon: <Users className="text-sky-500" size={24} />,
      tips: [
        'Assign qualified faculty advisors to each class section for autonomous verification'
      ]
    }
  ],

  SUPREME_ADMIN: [
    {
      id: 'admin-welcome',
      title: 'Welcome to Supreme Administrator Portal',
      description: 'Total administrative authority over departments, user roles, system settings, corporate approvals, and global campus broadcasts.',
      badge: 'Super Admin Control',
      icon: <Zap className="text-indigo-600" size={24} />,
      tips: [
        'Create departments and designate HOD accounts with automated password resets',
        'Review and approve pending corporate recruiter accounts',
        'Monitor global system logs and database backup relays'
      ]
    },
    {
      id: 'tour-admin-departments',
      targetId: 'nav-item-departments',
      view: 'departments',
      title: 'Department & Academic Branch Management',
      description: 'Create and configure institutional departments, course codes, and assign department heads.',
      badge: 'Institutional Architecture',
      icon: <Building2 className="text-violet-500" size={24} />,
      tips: [
        'Set up department codes and batch structures for seamless student grouping'
      ]
    },
    {
      id: 'tour-admin-industry',
      targetId: 'nav-item-industry-approvals',
      view: 'industry-approvals',
      title: 'Corporate & Recruiter Account Approvals',
      description: 'Review registering industry partners, verify company credentials, and approve access to talent recruitment pools.',
      badge: 'Industry Approvals',
      icon: <Briefcase className="text-emerald-500" size={24} />,
      tips: [
        'Verify corporate email domains before granting candidate search access'
      ]
    },
    {
      id: 'tour-admin-users',
      targetId: 'nav-item-users',
      view: 'users',
      title: 'Global User Accounts & Role Control',
      description: 'Manage HODs, Class Advisors, Students, and Recruiters with instant password reset tools and role promotions.',
      badge: 'User Directory',
      icon: <Users className="text-sky-500" size={24} />,
      tips: [
        'Use the 1-click password reset to restore student or faculty credentials'
      ]
    }
  ],

  INDUSTRY: [
    {
      id: 'industry-welcome',
      title: 'Welcome to Corporate Recruiter & Partner Portal',
      description: 'Hire top verified student talent, post internships and job opportunities, design custom coding assessments, and review candidates.',
      badge: 'Recruiter Hub',
      icon: <Briefcase className="text-indigo-600" size={24} />,
      tips: [
        'Post recruitment drives with specific CGPA and skill requirements',
        'Design automated coding challenges to pre-screen candidates',
        'Download verified, ATS-ready student resumes with 1 click'
      ]
    },
    {
      id: 'tour-postings',
      targetId: 'nav-item-industry-postings',
      view: 'industry-postings',
      title: 'Job & Internship Drive Postings',
      description: 'Create and manage recruitment listings with custom eligibility criteria, stipend/salary packages, deadlines, and application links.',
      badge: 'Drive Manager',
      icon: <Briefcase className="text-amber-500" size={24} />,
      tips: [
        'Specify required skills so the platform matches eligible student profiles'
      ]
    },
    {
      id: 'tour-coding-assessments-hr',
      targetId: 'nav-item-industry-coding-assessments',
      view: 'industry-coding-assessments',
      title: 'HR Coding Challenges & Online Tests',
      description: 'Create technical coding tests with custom test cases, hidden validation rules, and automated execution scoring.',
      badge: 'Technical Assessment',
      icon: <Terminal className="text-emerald-500" size={24} />,
      tips: [
        'Add public and private test cases to evaluate edge cases accurately'
      ]
    },
    {
      id: 'tour-candidate-pool',
      targetId: 'nav-item-users',
      view: 'users',
      title: 'Candidate Talent Pool & Verified Resumes',
      description: 'Search top-ranking students across coding solved counts, CGPA, and skill proficiencies. Download verified PDF profiles.',
      badge: 'Talent Sourcing',
      icon: <Users className="text-sky-500" size={24} />,
      tips: [
        'Filter by year, branch, and technical proficiencies for targeted shortlisting'
      ]
    },
    {
      id: 'tour-faculty-collaboration',
      targetId: 'nav-item-faculty-industry-hub',
      view: 'faculty-industry-hub',
      title: 'Academia-Industry Collaboration Hub',
      description: 'Collaborate with faculty on curriculum enhancement, sponsored student projects, and hackathon initiatives.',
      badge: 'Innovation Network',
      icon: <GraduationCap className="text-purple-500" size={24} />,
      tips: [
        'Engage early with student cohorts through sponsored workshops and mentorship'
      ]
    }
  ]
};

export const ROLE_FEATURE_CATALOG: Record<string, FeatureGuideItem[]> = {
  STUDENT: [
    {
      id: 'feat-tasks',
      title: 'Daily Tasks & Submission Proofs',
      category: 'Academic & Tasks',
      description: 'View mandatory department assignments, workshops, and competitions. Submit proof screenshots and join team activities.',
      targetView: 'tasks',
      icon: <ClipboardList className="text-indigo-600" size={20} />,
      keyPoints: [
        'Upload image/PDF proofs before the deadline passes',
        'Form teams with classmates or submit solo for team tasks',
        'Track verification status: Pending, Verified, or Re-submit'
      ],
      proTip: 'Tasks marked as Urgent or due within 24h are highlighted in orange and red.'
    },
    {
      id: 'feat-coding',
      title: 'LeetCode & GitHub Live Sync',
      category: 'Coding & Skills',
      description: 'Track daily problem counts, weekly targets, and GitHub commit activity with real-time sync and 30-day history graphs.',
      targetView: 'leetcode-targets',
      icon: <Code className="text-amber-500" size={20} />,
      keyPoints: [
        'One-click synchronization with your public LeetCode handle',
        'Daily commit tracking to ensure coding consistency',
        'History charts showing 30-day streak & target completion'
      ],
      proTip: 'Ensure your LeetCode username is correctly entered in your profile for accurate automated syncing.'
    },
    {
      id: 'feat-opportunities',
      title: 'Campus Recruitment & Internships',
      category: 'Placement & Industry',
      description: 'Explore campus recruitment drives, internships, and hackathons posted by verified corporate partners.',
      targetView: 'opportunities',
      icon: <Briefcase className="text-teal-500" size={20} />,
      keyPoints: [
        'Filter opportunities by full-time vs internship',
        'Direct apply links and eligibility criteria checking',
        'Track application status in real-time'
      ],
      proTip: 'Complete all 4 sections of your profile to unlock 1-click rapid applications.'
    },
    {
      id: 'feat-coding-assessments',
      title: 'Company Coding Tests & Sandbox',
      category: 'Coding & Skills',
      description: 'Attempt corporate technical coding challenges in a live IDE sandbox with real-time test case verification.',
      targetView: 'student-coding-assessments',
      icon: <Terminal className="text-emerald-500" size={20} />,
      keyPoints: [
        'Full Monaco code editor supporting multiple programming languages',
        'Run sample test cases and submit for final hidden validation',
        'Live execution timer and score leaderboards'
      ],
      proTip: 'Always test edge cases using custom inputs before submitting your final solution.'
    },
    {
      id: 'feat-skill-gap',
      title: 'Skill Gap AI Analyzer',
      category: 'Coding & Skills',
      description: 'Compare your verified technical skills against real industry job descriptions to identify gaps and get curated learning paths.',
      targetView: 'skill-gap-analyzer',
      icon: <Zap className="text-amber-400" size={20} />,
      keyPoints: [
        'Role-targeted readiness scoring against Frontend, Backend, AI/ML, and DevOps',
        'Personalized roadmap of missing skills to acquire',
        'Recommended projects to build to bridge skill gaps'
      ],
      proTip: 'Run an analysis whenever you add new projects or certifications to your profile.'
    },
    {
      id: 'feat-placement-rating',
      title: 'Placement Readiness Rating',
      category: 'Placement & Industry',
      description: 'Holistic 360-degree placement rating combining academic consistency, coding activity, and skill assessments.',
      targetView: 'placement-readiness',
      icon: <Target className="text-cyan-500" size={20} />,
      keyPoints: [
        'Overall placement readiness percentile',
        'Breakdown across Coding, Core CS, Aptitude, and Soft Skills',
        'Benchmark comparisons against department averages'
      ],
      proTip: 'Students with rating above 80% are automatically highlighted in the Corporate Recruiter Pool.'
    },
    {
      id: 'feat-live-hub',
      title: 'Live Teaching Hub',
      category: 'Academic & Tasks',
      description: 'Join interactive live coding lectures, explore shared faculty code repositories, and download study notes.',
      targetView: 'live-teaching-hub',
      icon: <Radio className="text-emerald-500" size={20} />,
      keyPoints: [
        'Real-time classroom code broadcasts',
        'Embedded terminal sandbox to run code snippets',
        'Lecture attachments and source code downloads'
      ],
      proTip: 'Use split-screen mode on desktop to code along while watching the faculty broadcast.'
    },
    {
      id: 'feat-notice-board',
      title: 'Digital Notice Board',
      category: 'Core',
      description: 'Official department announcements, circulars, and urgent alerts with priority filters and instant Telegram alerts.',
      targetView: 'notice-board',
      icon: <Megaphone className="text-rose-500" size={20} />,
      keyPoints: [
        'Filter by Urgent, High, and Normal priorities',
        'Download official circular attachments in PDF/Image formats',
        'Share individual notices with classmates via direct link'
      ],
      proTip: 'Connect Telegram in your top navbar to receive instant smartphone notifications when new notices are posted.'
    },
    {
      id: 'feat-profile',
      title: 'Profile & Verified PDF Resume',
      category: 'Core',
      description: 'Manage your portfolio, achievements, social handles, and generate an ATS-compliant verified PDF resume.',
      targetView: 'profile',
      icon: <User className="text-blue-600" size={20} />,
      keyPoints: [
        'Track profile completion percentage across 4 sections',
        'Log hackathon wins, published papers, and certifications',
        'Download instant verified PDF resume with department seal'
      ],
      proTip: 'The verified PDF resume automatically embeds your real-time LeetCode and GitHub stats.'
    }
  ],

  CLASS_ADVISOR: [
    {
      id: 'adv-verifications',
      title: 'Task Verifications Queue',
      category: 'Academic & Tasks',
      description: 'Review and approve/reject student task submissions with proof screenshots and custom field validations.',
      targetView: 'verifications',
      icon: <ShieldCheck className="text-emerald-600" size={20} />,
      keyPoints: [
        'Full-resolution image preview of student completion proofs',
        'Instant 1-click approval or rejection with feedback comments',
        'Filter by task category, student register number, or class'
      ],
      proTip: 'Rejections automatically unlock a resubmission slot for the student.'
    },
    {
      id: 'adv-coding-monitor',
      title: 'LeetCode & GitHub Progress Monitor',
      category: 'Coding & Skills',
      description: 'Track daily problem counts, weekly targets, and GitHub commit activity for all students in your class section.',
      targetView: 'leetcode-targets',
      icon: <Code className="text-amber-500" size={20} />,
      keyPoints: [
        'Configure class-level daily & weekly problem solving targets',
        'Identify students with zero solves or inactive streaks',
        'Export Excel reports for departmental compliance records'
      ],
      proTip: 'Use the Target Configurations tab to adjust difficulty expectations throughout the semester.'
    },
    {
      id: 'adv-my-class',
      title: 'Class Roster & Student Directory',
      category: 'Core',
      description: 'Complete student directory with GPA tracking, contact numbers, parent details, and verified PDF resume downloads.',
      targetView: 'my-class',
      icon: <Building2 className="text-violet-500" size={20} />,
      keyPoints: [
        'Quick search by register number or name',
        'Inspect individual student submission histories and achievements',
        'One-click student password reset tool'
      ],
      proTip: 'Click on any student card to view their complete academic and coding portfolio.'
    },
    {
      id: 'adv-notices',
      title: 'Class Notice Broadcasts',
      category: 'Core',
      description: 'Publish official announcements, exam schedules, and circulars targeted specifically to your class section.',
      targetView: 'notice-board',
      icon: <Megaphone className="text-rose-500" size={20} />,
      keyPoints: [
        'Attach PDF circulars or image flyers',
        'Select priority level: Urgent, High, Normal',
        'Pin critical announcements to the top of student feeds'
      ],
      proTip: 'Notices marked as Urgent trigger instant Telegram alerts to all linked students.'
    }
  ],

  HOD: [
    {
      id: 'hod-tasks',
      title: 'Department Task & Deadline Control',
      category: 'Academic & Tasks',
      description: 'Create multi-class tasks, attach poster previews, dispatch automated email reminders to defaulters, and extend deadlines.',
      targetView: 'tasks',
      icon: <ClipboardList className="text-indigo-500" size={20} />,
      keyPoints: [
        'Broadcast tasks to all department sections simultaneously',
        'Send 1-click email alerts to all incomplete students',
        'Reopen closed tasks by extending deadlines with custom dates'
      ],
      proTip: 'The multi-node email dispatch automatically delivers reminder notices to student inboxes.'
    },
    {
      id: 'hod-heatmap',
      title: 'Institutional Skill Heatmap',
      category: 'Coding & Skills',
      description: 'Cohort-level visualization of technical proficiencies, placement readiness, and skill competencies across all batches.',
      targetView: 'institutional-skill-heatmap',
      icon: <BarChart3 className="text-pink-500" size={20} />,
      keyPoints: [
        'Batch-by-batch technical competency comparisons',
        'Identify department-wide skill deficiencies',
        'Export visual reports for accreditation and review committees'
      ],
      proTip: 'Use heatmap filters to compare 3rd year vs 4th year placement preparedness.'
    },
    {
      id: 'hod-industry-hub',
      title: 'Faculty-Industry Collaboration Hub',
      category: 'Placement & Industry',
      description: 'Coordinate joint academic-industry initiatives, approve corporate recruitment partners, and organize coding tracks.',
      targetView: 'faculty-industry-hub',
      icon: <GraduationCap className="text-blue-500" size={20} />,
      keyPoints: [
        'Review corporate recruiter registration requests',
        'Manage joint student-industry innovation projects',
        'Track student placement conversion rates across drives'
      ],
      proTip: 'Check the pending approvals badge to promptly activate newly registered recruiters.'
    }
  ],

  SUPREME_ADMIN: [
    {
      id: 'admin-depts',
      title: 'Department & Batch Architecture',
      category: 'Administration',
      description: 'Configure academic departments, course branches, and designate department heads.',
      targetView: 'departments',
      icon: <Building2 className="text-violet-500" size={20} />,
      keyPoints: [
        'Create new departments and assigned code identifiers',
        'Oversee cross-departmental user distribution',
        'Assign and update HOD leadership accounts'
      ],
      proTip: 'Department structures dynamically organize all subordinate class sections and tasks.'
    },
    {
      id: 'admin-industry-approvals',
      title: 'Corporate Recruiter Verification',
      category: 'Administration',
      description: 'Review registering industry HR accounts, verify company credentials, and approve talent search access.',
      targetView: 'industry-approvals',
      icon: <Briefcase className="text-emerald-500" size={20} />,
      keyPoints: [
        'Inspect recruiter company profiles and contact emails',
        'Approve or decline recruiter access to student resumes',
        'Audit recruiter hiring and assessment activities'
      ],
      proTip: 'Approved corporate recruiters gain instant access to candidate search and coding test creation.'
    },
    {
      id: 'admin-users',
      title: 'Global User Administration',
      category: 'Administration',
      description: 'Manage all student, faculty, advisor, and recruiter accounts with instant credential resets and role upgrades.',
      targetView: 'users',
      icon: <Users className="text-sky-500" size={20} />,
      keyPoints: [
        'Search users across all roles and departments',
        '1-click password reset to default register number',
        'Manage student coordinator badges'
      ],
      proTip: 'Filter by role to perform quick maintenance on faculty or advisor accounts.'
    }
  ],

  INDUSTRY: [
    {
      id: 'ind-postings',
      title: 'Campus Job & Internship Postings',
      category: 'Placement & Industry',
      description: 'Create and publish job listings with tailored eligibility criteria, salary/stipend packages, and application deadlines.',
      targetView: 'industry-postings',
      icon: <Briefcase className="text-amber-500" size={20} />,
      keyPoints: [
        'Specify required minimum CGPA, department branches, and skills',
        'Set application deadlines and attach drive guidelines',
        'Receive and review candidate applications directly'
      ],
      proTip: 'Target specific batches (e.g. 2026 Batch) to reach the exact target student cohort.'
    },
    {
      id: 'ind-coding',
      title: 'Custom Technical Coding Assessments',
      category: 'Coding & Skills',
      description: 'Build algorithmic coding challenges with custom test cases, hidden evaluation criteria, and automated scoring.',
      targetView: 'industry-coding-assessments',
      icon: <Terminal className="text-emerald-500" size={20} />,
      keyPoints: [
        'Create questions in C++, Java, Python, and JavaScript',
        'Configure public and private test cases with score weights',
        'Inspect candidate submitted code and execution runtimes'
      ],
      proTip: 'Use private test cases to detect hard-coded edge case solutions.'
    },
    {
      id: 'ind-candidate-pool',
      title: 'Candidate Talent Sourcing & Resumes',
      category: 'Placement & Industry',
      description: 'Filter verified student profiles by LeetCode problem counts, GitHub commits, CGPA, and download PDF resumes.',
      targetView: 'users',
      icon: <Users className="text-sky-500" size={20} />,
      keyPoints: [
        'Real-time ranking of top student coders in the institution',
        'Direct download of verified, department-certified PDF resumes',
        'Direct shortlisting for scheduled interview rounds'
      ],
      proTip: 'Look for students with high Placement Readiness ratings for immediate hiring.'
    }
  ]
};

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------

export default function PortalTutorGuide({
  userRole = 'STUDENT',
  isCoordinator = false,
  userName = 'User',
  currentView,
  onNavigateView,
  isOpen,
  onClose,
  initialMode = 'TOUR'
}: PortalTutorGuideProps) {
  const effectiveRole = (isCoordinator && userRole?.toUpperCase() === 'STUDENT')
    ? 'STUDENT_COORDINATOR'
    : (userRole?.toUpperCase() || 'STUDENT');

  const tourSteps = ROLE_TOUR_STEPS[effectiveRole] || ROLE_TOUR_STEPS.STUDENT;
  const featureCatalog = ROLE_FEATURE_CATALOG[effectiveRole] || ROLE_FEATURE_CATALOG.STUDENT;

  const [activeMode, setActiveMode] = useState<'TOUR' | 'DIRECTORY' | 'WELCOME'>(initialMode);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync mode when reopened
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      setCurrentStepIndex(0);
    }
  }, [isOpen, initialMode]);

  const currentStep = tourSteps[currentStepIndex] || tourSteps[0];

  const handleNextStep = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = tourSteps[nextIndex];
      setCurrentStepIndex(nextIndex);
      if (nextStep.view) {
        onNavigateView(nextStep.view);
      }
    } else {
      // Finished tour
      markTourCompleted();
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStep = tourSteps[prevIndex];
      setCurrentStepIndex(prevIndex);
      if (prevStep.view) {
        onNavigateView(prevStep.view);
      }
    }
  };

  const handleJumpToStep = (index: number) => {
    const step = tourSteps[index];
    setCurrentStepIndex(index);
    if (step.view) {
      onNavigateView(step.view);
    }
  };

  const markTourCompleted = () => {
    try {
      localStorage.setItem(`portal_tour_completed_${effectiveRole.toLowerCase()}`, 'true');
    } catch (e) { }
  };

  const handleLaunchFeatureFromCatalog = (item: FeatureGuideItem) => {
    onNavigateView(item.targetView);
    onClose();
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    featureCatalog.forEach(f => cats.add(f.category));
    return ['ALL', ...Array.from(cats)];
  }, [featureCatalog]);

  const filteredFeatures = useMemo(() => {
    return featureCatalog.filter(item => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keyPoints.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [featureCatalog, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* ------------------------------------------------------------- */}
        {/* MODE: INTERACTIVE STEP-BY-STEP TOUR */}
        {/* ------------------------------------------------------------- */}
        {activeMode === 'TOUR' && (
          <motion.div
            key="modal-tour"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with gradient badge and close button */}
            <div className="p-6 pb-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-zinc-50 via-indigo-50/30 to-purple-50/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                  {currentStep.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Step {currentStepIndex + 1} of {tourSteps.length}
                    </span>
                    <span className="text-xs font-bold text-zinc-500">
                      {effectiveRole.replace(/_/g, ' ')} Portal Tutor
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight mt-0.5">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('DIRECTORY')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="View complete feature catalog"
                >
                  <BookOpen size={14} className="text-zinc-600" />
                  <span className="hidden sm:inline">Feature Catalog</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                  title="Close Tutor"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-3">
                <p className="text-zinc-700 text-sm md:text-base leading-relaxed font-medium">
                  {currentStep.description}
                </p>
              </div>

              {/* Pro Tips / Highlights */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100 rounded-2xl p-4.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-950 font-black text-xs uppercase tracking-wider">
                    <Sparkles size={15} className="text-indigo-600 shrink-0" />
                    <span>Key Highlights & Best Practices</span>
                  </div>
                  <ul className="space-y-2 text-xs md:text-sm text-zinc-700">
                    {currentStep.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step Navigation Dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {tourSteps.map((step, idx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleJumpToStep(idx)}
                    className={`transition-all rounded-full cursor-pointer ${
                      idx === currentStepIndex
                        ? 'w-8 h-2.5 bg-indigo-600 shadow-sm'
                        : 'w-2.5 h-2.5 bg-zinc-200 hover:bg-zinc-400'
                    }`}
                    title={step.title}
                  />
                ))}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="p-4 md:p-6 border-t border-zinc-100 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  markTourCompleted();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
              >
                End / Close Tutor
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft size={16} />
                  <span>Move Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{currentStepIndex === tourSteps.length - 1 ? 'Finish & Close' : 'Move Next'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE: COMPLETE FEATURE DIRECTORY & KNOWLEDGE HUB */}
        {/* ------------------------------------------------------------- */}
        {activeMode === 'DIRECTORY' && (
          <motion.div
            key="modal-directory"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-zinc-50 via-indigo-50/20 to-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                    <span>{effectiveRole.replace(/_/g, ' ')} Feature Guide & Knowledge Hub</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {featureCatalog.length} Features
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-zinc-500">
                    Comprehensive overview of all portal capabilities, shortcuts, and best practices.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('TOUR');
                    setCurrentStepIndex(0);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Start Step-by-Step Tour</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search features or tips..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {filteredFeatures.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 font-bold text-sm">
                  No features found matching "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFeatures.map(item => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-zinc-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 group-hover:bg-indigo-100 text-zinc-800 group-hover:text-indigo-600 flex items-center justify-center transition-colors shrink-0">
                              {item.icon}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-zinc-900 text-sm leading-snug">
                                {item.title}
                              </h4>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                          {item.description}
                        </p>

                        {/* Key Points */}
                        <ul className="space-y-1 text-xs text-zinc-600 pt-1">
                          {item.keyPoints.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                              <span className="leading-tight">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-indigo-700 font-semibold italic flex items-center gap-1">
                          <Info size={13} className="text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[220px]" title={item.proTip}>{item.proTip}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLaunchFeatureFromCatalog(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        >
                          <span>Open</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 font-semibold">
              <span>Need more help? Check with your Department Coordinator or Class Advisor.</span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold transition-all cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
