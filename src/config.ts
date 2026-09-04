export const ENV = Object.freeze({
    API_URL: import.meta.env.VITE_API_URL || "/api",
    GOAT_CE_URL: import.meta.env.VITE_GOAT_CE_URL || "https://goatcode-editor.onrender.com",
    IS_PRODUCTION: true,
    AUTH_TOKEN_STORAGE_KEY: "vsbec_auth_token",
    AUTH_HEADER_NAME: "Authorization",
    AUTH_SCHEME: "Bearer",
    CONTENT_TYPE: "application/json"
});

export const API_URL = ENV.API_URL.replace(/\/api\/?$/, '');
export const GOAT_CE_URL = ENV.GOAT_CE_URL;

export const FEATURE_FLAGS = {
  // Toggle UI visibility of features on the sidebar dashboard
  // Set to `false` to hide temporarily, set to `true` to bring back anytime!
  placementRating: false,
  opportunities: false,
  codingTests: false,
  skillGapAi: false,
  liveTeachingHub: true,
  skillAssessment: true,
  facultyHub: true,
  skillHeatmap: true,
};
