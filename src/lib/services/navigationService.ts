/**
 * NavigationService - Smart navigation service
 * 
 * This service handles navigation using Next.js router when available,
 * falling back to window.location for edge cases (like after component unmount).
 * 
 * Architecture: Service Layer Pattern (like WeChat, Facebook, Instagram)
 * 
 * Key Principle: Use client-side navigation (router) to avoid full page reloads.
 * Full page reloads cause hydration issues with Next.js static export.
 */

export class NavigationService {
  private static instance: NavigationService;
  private router: any = null; // Next.js router instance (set via setRouter)

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Set the Next.js router instance
   * Call this from components that have access to useRouter()
   * 
   * @param router - Next.js router from useRouter() hook
   */
  setRouter(router: any): void {
    this.router = router;
    console.log('🧭 NavigationService: Router instance set');
  }

  /**
   * Navigate to a path
   * 
   * Strategy (like WeChat/Facebook):
   * 1. Try Next.js router navigation (client-side, no reload) - PREFERRED
   * 2. Fallback to window.location (full reload) - only if router unavailable
   * 
   * @param path - Path to navigate to (e.g., '/explore')
   * @param options - Navigation options
   */
  navigate(path: string, options?: { replace?: boolean; useRouter?: boolean }): void {
    if (typeof window === 'undefined') {
      console.warn('⚠️ NavigationService: Cannot navigate on server');
      return;
    }

    console.log(`🧭 NavigationService: Navigating to ${path}`, {
      hasRouter: !!this.router,
      useRouter: options?.useRouter ?? true,
      replace: options?.replace ?? false
    });

    // Prefer router navigation (client-side, no reload) - like WeChat/Facebook
    // This avoids hydration issues with static export
    if ((options?.useRouter !== false) && this.router) {
      try {
        if (options?.replace) {
          this.router.replace(path);
        } else {
          this.router.push(path);
        }
        console.log('✅ NavigationService: Navigation via router (client-side)');
        return;
      } catch (error) {
        console.warn('⚠️ NavigationService: Router navigation failed, falling back to window.location', error);
      }
    }

    // Fallback: window.location (full page reload)
    // Only used if router is unavailable or explicitly disabled
    console.log('🔄 NavigationService: Using window.location (full reload fallback)');
    if (options?.replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  }

  /**
   * Navigate to explore page (common use case)
   * Uses router navigation by default to avoid hydration issues
   */
  navigateToExplore(useRouter: boolean = true): void {
    this.navigate('/explore', { replace: true, useRouter });
  }

  /**
   * Navigate to home page
   */
  navigateToHome(useRouter: boolean = true): void {
    this.navigate('/', { replace: true, useRouter });
  }

  /**
   * Navigate to login/sign-up page
   */
  navigateToLogin(useRouter: boolean = true): void {
    this.navigate('/', { replace: true, useRouter });
  }

  /**
   * Navigate to signing-out page
   * This page handles the complete sign-out process and then redirects to explore
   */
  navigateToSigningOut(useRouter: boolean = true): void {
    this.navigate('/signing-out', { replace: true, useRouter });
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();

