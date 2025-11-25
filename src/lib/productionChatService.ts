/**
 * Production Chat Service - Complete Long-term Solution
 * 
 * Features:
 * - Automatic database optimization
 * - Intelligent caching
 * - Performance monitoring
 * - Error recovery
 * - Migration management
 * - Graceful degradation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatServiceV2 } from './chatServiceV2';
import { DatabaseOptimizer } from './databaseOptimizer';
import { MigrationManager } from './migrationManager';

interface ProductionConfig {
  enableAutoOptimization: boolean;
  enableMigrations: boolean;
  enablePerformanceMonitoring: boolean;
  cacheTTL: number;
  maxRetries: number;
}

export class ProductionChatService {
  private chatService: ChatServiceV2;
  private optimizer: DatabaseOptimizer;
  private migrationManager: MigrationManager;
  private config: ProductionConfig;
  private isInitialized = false;

  constructor(
    supabase: SupabaseClient, 
    getAccount: () => any,
    config?: Partial<ProductionConfig>
  ) {
    this.config = {
      enableAutoOptimization: true,
      enableMigrations: true,
      enablePerformanceMonitoring: true,
      cacheTTL: 30000,
      maxRetries: 3,
      ...config
    };

    this.chatService = new ChatServiceV2(supabase, getAccount, {
      enableOptimizations: true,
      cacheTTL: this.config.cacheTTL,
      maxRetries: this.config.maxRetries,
      performanceMonitoring: this.config.enablePerformanceMonitoring
    });

    this.optimizer = new DatabaseOptimizer(supabase);
    this.migrationManager = new MigrationManager(supabase);
  }

  /**
   * Initialize the service (run once on app start)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 ProductionChatService: Initializing...');

    try {
      // 1. Run migrations if enabled
      if (this.config.enableMigrations) {
        console.log('🔄 ProductionChatService: Running migrations...');
        const { applied, errors } = await this.migrationManager.runMigrations();
        
        if (applied > 0) {
          console.log(`✅ ProductionChatService: Applied ${applied} migrations`);
        }
        
        if (errors.length > 0) {
          console.warn(`⚠️ ProductionChatService: ${errors.length} migration errors:`, errors);
        }
      }

      // 2. Ensure optimizations are applied
      if (this.config.enableAutoOptimization) {
        console.log('🔧 ProductionChatService: Ensuring optimizations...');
        const isOptimized = await this.optimizer.ensureOptimized();
        
        if (isOptimized) {
          console.log('✅ ProductionChatService: Database optimizations active');
        } else {
          console.warn('⚠️ ProductionChatService: Database optimizations not available');
        }
      }

      this.isInitialized = true;
      console.log('🎉 ProductionChatService: Initialization complete');
    } catch (error) {
      console.error('❌ ProductionChatService: Initialization failed:', error);
      // Continue anyway - service will work with fallbacks
    }
  }

  /**
   * Load chats with all optimizations
   */
  async loadChats(): Promise<{ chats: any[]; error: Error | null; performance: any }> {
    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    const result = await this.chatService.loadChats();
    
    // Log performance metrics
    if (this.config.enablePerformanceMonitoring) {
      const metrics = this.chatService.getPerformanceMetrics();
      console.log('📊 ProductionChatService: Performance metrics:', {
        loadTime: `${result.loadTime.toFixed(2)}ms`,
        method: result.method,
        averageLoadTime: `${metrics.averageLoadTime.toFixed(2)}ms`,
        cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        errorRate: `${(metrics.errorRate * 100).toFixed(1)}%`
      });
    }

    return {
      chats: result.chats,
      error: result.error,
      performance: {
        loadTime: result.loadTime,
        method: result.method,
        databaseQueries: result.performance.databaseQueries,
        cacheHits: result.performance.cacheHits,
        retries: result.performance.retries
      }
    };
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    optimizations: boolean;
    migrations: any;
    performance: any;
  }> {
    const optimizerStatus = this.optimizer.getStatus();
    const migrationStatus = await this.migrationManager.getStatus();
    const performanceMetrics = this.chatService.getPerformanceMetrics();

    return {
      initialized: this.isInitialized,
      optimizations: optimizerStatus.isOptimized,
      migrations: migrationStatus,
      performance: performanceMetrics
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.chatService.clearCache();
  }

  /**
   * Force re-optimization
   */
  async reoptimize(): Promise<boolean> {
    this.optimizer.resetStatus();
    return await this.optimizer.ensureOptimized();
  }
}

// Factory function for easy integration
export function createProductionChatService(
  supabase: SupabaseClient,
  getAccount: () => any,
  config?: Partial<ProductionConfig>
): ProductionChatService {
  return new ProductionChatService(supabase, getAccount, config);
}























