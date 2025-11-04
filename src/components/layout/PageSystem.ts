/**
 * Connect Page Design System
 * 
 * Reusable components for creating consistent page layouts across web and mobile.
 * Based on the Saved page design with compact blur system.
 * 
 * MOBILE USAGE:
 * - ALWAYS wrap in <MobilePage> for full-screen pages
 * - Then add <PageHeader> and <PageContent>
 * 
 * WEB USAGE (modals):
 * - Use existing modal wrapper (rounded-3xl, 680x620)
 * - Then add <PageHeader> and <PageContent>
 */

export { default as MobilePage } from './MobilePage';
export type { MobilePageProps } from './MobilePage';

export { default as PageHeader } from './PageHeader';
export type { PageHeaderProps, ActionButton } from './PageHeader';

export { default as PageContent } from './PageContent';
export type { PageContentProps } from './PageContent';

