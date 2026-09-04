// Device detection utility to restrict test attendance to Laptop or Desktop only

export const checkIsMobileOrTablet = (): { isMobile: boolean; reason?: string } => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isMobile: false };
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // 1. Mobile & Tablet User Agent patterns
  const mobileUARegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|Windows Phone/i;
  const isMobileUA = mobileUARegex.test(userAgent);

  // 2. Screen Dimensions (Laptops & Desktops standard >= 1024px width)
  const isSmallScreen = window.innerWidth < 1024 || (window.screen && window.screen.width < 1024);

  // 3. Touch device with compact viewport
  const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 1) && window.innerWidth < 1024;

  if (isMobileUA) {
    return {
      isMobile: true,
      reason: 'Mobile or tablet browser detected via User Agent.'
    };
  }

  if (isTouchDevice || isSmallScreen) {
    return {
      isMobile: true,
      reason: 'Screen resolution below standard Desktop/Laptop resolution (minimum 1024px width required).'
    };
  }

  return { isMobile: false };
};

export const isLaptopOrDesktop = (): boolean => {
  return !checkIsMobileOrTablet().isMobile;
};
