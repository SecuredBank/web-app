import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { SecurityMiddleware } from '../utils/securityMiddleware';
import { SessionManager } from '../utils/sessionManager';
import { CSRFProtection } from '../utils/csrfProtection';
import { XSSProtection } from '../utils/xssProtection';
import { encryptData } from '../utils/securityUtils';
import { useA11y } from './A11yContext';
import { useDebounce } from '../hooks/useDebounce';
import { useMonitoring } from '../hooks/useMonitoring';

import { 
  SecurityEvent,
  SecurityEventType,
  SecurityMetric,
  SecurityConfig,
  SecurityHealth 
} from '../types/security';

interface PerformanceConfig {
  tokenCacheTTL: number;
  operationCacheTTL: number;
  batchDelay: number;
  highFrequencyDebounce: number;
  maxBatchSize: number;
  cleanupInterval: number;
  metricsEnabled: boolean;
}

interface SecurityConfig {
  xss: {
    enabled: boolean;
  };
  csrf: {
    enabled: boolean;
    ignoredPaths?: string[];
  };
  session: {
    enabled: boolean;
    renewOnRequest?: boolean;
  };
  cors: {
    enabled: boolean;
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    maxAge?: number;
  };
  rateLimit: {
    enabled: boolean;
    windowMs?: number;
    maxRequests?: number;
  };
  accessibility: {
    enabled: boolean;
    logoutOnInactivity?: boolean;
    inactivityTimeout?: number;
    screenReaderWarnings?: boolean;
    autoRefreshTokens?: boolean;
    sessionAlerts?: boolean;
    keyboardTimeout?: number;
    focusResetOnNavigation?: boolean;
    visualFeedbackDuration?: number;
  };
}

// Context type
interface SecurityContextType {
  // Security state
  isSecureInputFocused: boolean;
  
  // Services
  services: {
    securityMiddleware: SecurityMiddleware;
    sessionManager: SessionManager;
    csrf: CSRFProtection;
    xss: XSSProtection;
  };

  // Security operations
  refreshSecurity: () => Promise<void>;
  getSecurityToken: (type: string, userId: string) => Promise<string | null>;
  processSecurityEvent: (event: SecurityEvent) => void;
  queueSecurityUpdate: (update: () => Promise<void>) => void;

  // Security UI
  toggleSecureInput: (focused: boolean) => void;
  startSecureSession: () => void;
  endSecureSession: () => void;
  pauseInactivityMonitoring: () => void;
  resumeInactivityMonitoring: () => void;

  // Performance monitoring
  performance: {
    metricsEnabled: boolean;
    batchSize: number;
    batchDelay: number;
    cleanupInterval: number;
  };

  // Security monitoring
  monitoring: {
    logSecurityEvent: (event: SecurityEvent) => void;
    getMetrics: () => SecurityMetric[];
    clearMetrics: () => void;
  };
}

// Default configurations
const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  tokenCacheTTL: 3600000, // 1 hour
  operationCacheTTL: 300000, // 5 minutes
  batchDelay: 1000, // 1 second
  highFrequencyDebounce: 100,
  maxBatchSize: 100,
  cleanupInterval: 300000, // 5 minutes
  metricsEnabled: true,
};

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  xss: {
    enabled: true,
  },
  csrf: {
    enabled: true,
    ignoredPaths: ['/api/login', '/api/register'],
  },
  session: {
    enabled: true,
    renewOnRequest: true,
  },
  cors: {
    enabled: true,
    allowedOrigins: [window.location.origin],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 7200,
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
  accessibility: {
    enabled: true,
    logoutOnInactivity: true,
    inactivityTimeout: 300000, // 5 minutes
    screenReaderWarnings: true,
    autoRefreshTokens: true,
    sessionAlerts: true,
    keyboardTimeout: 30000, // 30 seconds
    focusResetOnNavigation: true,
    visualFeedbackDuration: 2000, // 2 seconds
  },
};

// Create context
const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// Provider Props
interface SecurityProviderProps {
  children: React.ReactNode;
  performanceConfig?: Partial<PerformanceConfig>;
  securityConfig?: Partial<SecurityConfig>;
}

// Provider Component
export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  performanceConfig: userPerformanceConfig,
  securityConfig: userSecurityConfig,
}): React.ReactElement => {
  // Component state
  const [isSecureInputFocused, setIsSecureInputFocused] = useState(false);
  const inactivityPaused = useRef(false);
  const pendingUpdates = useRef<Set<() => Promise<void>>>(new Set());
  const batchTimeout = useRef<number>();
  const inactivityTimer = useRef<number>();

  // Get accessibility context
  const a11y = useA11y();

  // Merge configs with defaults
  const performanceConfig = useMemo(
    () => ({
      ...DEFAULT_PERFORMANCE_CONFIG,
      ...userPerformanceConfig,
    }),
    [userPerformanceConfig]
  );

  const securityConfig = useMemo(
    () => ({
      ...DEFAULT_SECURITY_CONFIG,
      ...userSecurityConfig,
    }),
    [userSecurityConfig]
  );

  // Initialize security services
  const services = useMemo(() => {
    const middleware = new SecurityMiddleware(securityConfig);
    const session = new SessionManager();
    const csrf = new CSRFProtection();
    const xss = new XSSProtection();

    return {
      securityMiddleware: middleware,
      sessionManager: session,
      csrf,
      xss,
    };
  }, [securityConfig]);

  // Initialize monitoring
  const monitoring = useMonitoring({
    componentName: 'SecurityContext',
    memoryInterval: performanceConfig.cleanupInterval,
    securityThreshold: performanceConfig.tokenCacheTTL,
    enableMemoryMetrics: performanceConfig.metricsEnabled,
    securityBatchSize: performanceConfig.maxBatchSize,
    securityBatchDelay: performanceConfig.batchDelay,
  });

  // Security event processing
  const processSecurityEvent = useCallback((event: SecurityEvent) => {
    monitoring.logSecurityEvent(event);

    switch (event.type) {
      case 'SESSION_EXPIRED':
        services.sessionManager.endSession();
        break;
      case 'SECURITY_VIOLATION':
        services.securityMiddleware.handleViolation(event.data);
        break;
      case 'ACCESS_DENIED':
        services.csrf.refreshToken();
        break;
      default:
        break;
    }
  }, [services, monitoring]);

  // Batch processing
  const processBatchedUpdates = useCallback(async () => {
    const updates = Array.from(pendingUpdates.current);
    pendingUpdates.current.clear();

    try {
      await Promise.all(updates.map((update) => update()));
      monitoring.logSuccess('BATCH_UPDATE');
    } catch (error) {
      monitoring.logError('BATCH_UPDATE_FAILED', error);
    }
  }, [monitoring]);

  const debouncedBatchUpdate = useDebounce(
    processBatchedUpdates,
    performanceConfig.batchDelay
  );

  const queueSecurityUpdate = useCallback(
    (update: () => Promise<void>) => {
      pendingUpdates.current.add(update);
      debouncedBatchUpdate();
    },
    [debouncedBatchUpdate]
  );

  // Token management
  const getSecurityToken = useCallback(async (type: string, userId: string): Promise<string | null> => {
    try {
      switch (type) {
        case 'csrf':
          return services.csrf.generateToken(userId);
        case 'session':
          const fingerprint = localStorage.getItem('device_fingerprint');
          if (fingerprint) {
            const session = services.sessionManager.createSession(userId, fingerprint);
            return session.id;
          }
          return null;
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to generate ${type} token:`, error);
      return null;
    }
  }, [services]);

  // Security operations
  const refreshSecurity = useCallback(async () => {
    try {
      await services.sessionManager.refresh();
      await services.csrf.refreshToken();
    } catch (error) {
      console.error('Security refresh failed:', error);
      processSecurityEvent({
        type: 'SECURITY_VIOLATION',
        timestamp: Date.now(),
        data: { error },
      });
    }
  }, [services, processSecurityEvent]);

  const toggleSecureInput = useCallback((focused: boolean) => {
    setIsSecureInputFocused(focused);
    inactivityPaused.current = focused;
  }, []);

  const startSecureSession = useCallback(() => {
    setIsSecureInputFocused(true);
    if (securityConfig.accessibility.autoRefreshTokens) {
      void refreshSecurity();
    }
  }, [securityConfig.accessibility.autoRefreshTokens, refreshSecurity]);

  const endSecureSession = useCallback(() => {
    setIsSecureInputFocused(false);
  }, []);

  // Inactivity management
  const handleSecurityTimeout = useCallback(() => {
    if (!securityConfig.accessibility.logoutOnInactivity || inactivityPaused.current) {
      return;
    }

    processSecurityEvent({
      type: 'SESSION_EXPIRED',
      timestamp: Date.now(),
    });
  }, [securityConfig.accessibility.logoutOnInactivity, processSecurityEvent]);

  const pauseInactivityMonitoring = useCallback(() => {
    inactivityPaused.current = true;
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current);
    }
  }, []);

  const resumeInactivityMonitoring = useCallback(() => {
    inactivityPaused.current = false;
    if (securityConfig.accessibility.logoutOnInactivity) {
      inactivityTimer.current = window.setTimeout(
        handleSecurityTimeout,
        securityConfig.accessibility.inactivityTimeout
      );
    }
  }, [securityConfig.accessibility, handleSecurityTimeout]);

  // Inactivity monitoring setup
  useEffect(() => {
    if (!securityConfig.accessibility.logoutOnInactivity || inactivityPaused.current) {
      return;
    }

    const resetTimer = () => {
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
      }
      inactivityTimer.current = window.setTimeout(
        handleSecurityTimeout,
        securityConfig.accessibility.inactivityTimeout
      );
    };

    // Set up event listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    // Initial timer
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
      }
    };
  }, [securityConfig.accessibility, handleSecurityTimeout]);

  // Security maintenance cleanup
  useEffect(() => {
    const cleanup = () => {
      if (batchTimeout.current) {
        window.clearTimeout(batchTimeout.current);
      }
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
      }
      void processBatchedUpdates();
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [processBatchedUpdates]);

  // Context value
  const contextValue = useMemo(
    () => ({
      isSecureInputFocused,
      services,
      refreshSecurity,
      getSecurityToken,
      processSecurityEvent,
      queueSecurityUpdate,
      toggleSecureInput,
      startSecureSession,
      endSecureSession,
      pauseInactivityMonitoring,
      resumeInactivityMonitoring,
      performance: {
        metricsEnabled: performanceConfig.metricsEnabled,
        batchSize: performanceConfig.maxBatchSize,
        batchDelay: performanceConfig.batchDelay,
        cleanupInterval: performanceConfig.cleanupInterval,
      },
      monitoring: {
        logSecurityEvent: monitoring.logSecurityEvent,
        getMetrics: monitoring.getMetrics,
        clearMetrics: monitoring.clearMetrics,
      },
    }),
    [
      isSecureInputFocused,
      services,
      refreshSecurity,
      getSecurityToken,
      processSecurityEvent,
      queueSecurityUpdate,
      toggleSecureInput,
      startSecureSession,
      endSecureSession,
      pauseInactivityMonitoring,
      resumeInactivityMonitoring,
      performanceConfig,
      monitoring,
    ]
  );

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// Custom hook for using the security context
export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// Export the context and types
export type { SecurityConfig, PerformanceConfig, SecurityEvent, SecurityEventType, SecurityMetric };
export { SecurityContext };
