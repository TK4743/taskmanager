# Feature Toggles & Recovery Guide

This document explains how to hide or restore features on the sidebar dashboard without modifying or deleting the underlying feature logic, APIs, or database models.

---

## 📌 Feature Flags Configuration

All sidebar feature visibilities are centrally managed in [`src/config.ts`](./src/config.ts):

```typescript
export const FEATURE_FLAGS = {
  // Toggle UI visibility of features on the sidebar dashboard
  // Set to `false` to hide temporarily, set to `true` to bring back anytime!
  placementRating: false,    // Placement Rating (PlacementReadinessView)
  opportunities: false,      // Opportunities (StudentOpportunitiesView)
  codingTests: false,        // Coding Tests (StudentCodingAssessmentView)
  skillGapAi: false,         // Skill Gap AI (SkillGapAnalyzerView)
  liveTeachingHub: true,     // Live Teaching Hub (LiveTeachingHubView)
  skillAssessment: true,     // Skill Assessment (SkillAssessmentView)
  facultyHub: true,          // Faculty Hub (FacultyIndustryHubView)
  skillHeatmap: true,        // Skill Heatmap (InstitutionalSkillHeatmapView)
};
```

---

## 🔄 How to Restore / Recover Any Feature

To bring any hidden feature back to the sidebar dashboard:

1. Open [`src/config.ts`](./src/config.ts).
2. Find the feature flag you want to enable.
3. Change its value from `false` to `true`:
   ```typescript
   // Example: Restoring Opportunities and Coding Tests
   opportunities: true,
   codingTests: true,
   ```
4. Save the file. The changes will immediately reflect in both local development and production builds.

---

## 📋 Feature Reference Table

| Feature Name | Flag Name in `src/config.ts` | Default State | Component File | Associated Roles |
| :--- | :--- | :--- | :--- | :--- |
| **Placement Rating** | `placementRating` | `false` (Hidden) | [`src/PlacementReadinessView.tsx`](./src/PlacementReadinessView.tsx) | Student, Faculty, HOD, Admin |
| **Opportunities** | `opportunities` | `false` (Hidden) | [`src/StudentOpportunitiesView.tsx`](./src/StudentOpportunitiesView.tsx) | Student |
| **Coding Tests** | `codingTests` | `false` (Hidden) | [`src/StudentCodingAssessmentView.tsx`](./src/StudentCodingAssessmentView.tsx) | Student |
| **Skill Gap AI** | `skillGapAi` | `false` (Hidden) | [`src/SkillGapAnalyzerView.tsx`](./src/SkillGapAnalyzerView.tsx) | Student |
| **Live Teaching Hub** | `liveTeachingHub` | `true` (Visible) | [`src/LiveTeachingHubView.tsx`](./src/LiveTeachingHubView.tsx) | All Roles |
| **Skill Assessment** | `skillAssessment` | `true` (Visible) | [`src/SkillAssessmentView.tsx`](./src/SkillAssessmentView.tsx) | Student |
| **Faculty Hub** | `facultyHub` | `true` (Visible) | [`src/FacultyIndustryHubView.tsx`](./src/FacultyIndustryHubView.tsx) | Faculty, HOD, Industry |
| **Skill Heatmap** | `skillHeatmap` | `true` (Visible) | [`src/InstitutionalSkillHeatmapView.tsx`](./src/InstitutionalSkillHeatmapView.tsx) | Faculty, HOD, Admin |

---

## 🛡️ Data & API Safety Guarantee
- Hiding a feature via `FEATURE_FLAGS` **only toggles the navigation UI** on the client side.
- All backend routes in [`server.ts`](./server.ts), database schemas in [`db.ts`](./db.ts), and view components in `src/` remain completely intact.
- When re-enabled, user data, test scores, resumes, and opportunity postings will appear exactly as they were before.
