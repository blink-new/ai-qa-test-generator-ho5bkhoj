export interface User {
  id: string
  email: string
  displayName?: string
  createdAt: string
}

export interface RecordingSession {
  id: string
  userId: string
  url: string
  status: 'recording' | 'stopped' | 'processing' | 'completed'
  startTime: string
  endTime?: string
  interactions: Interaction[]
  apiCalls: ApiCall[]
  testCases?: TestCase[]
}

export interface Interaction {
  id: string
  type: 'click' | 'input' | 'scroll' | 'navigation' | 'hover'
  element: string
  selector: string
  value?: string
  timestamp: string
  screenshot?: string
}

export interface ApiCall {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  response?: any
  status: number
  timestamp: string
}

export interface TestCase {
  id: string
  sessionId: string
  title: string
  description: string
  steps: TestStep[]
  format: 'pytest' | 'selenium_bdd' | 'gherkin'
  content: string
  createdAt: string
}

export interface TestStep {
  id: string
  action: string
  element: string
  value?: string
  expected?: string
}

export interface JenkinsRun {
  id: string
  userId: string
  jobName: string
  buildNumber: number
  status: 'running' | 'success' | 'failed' | 'aborted'
  startTime: string
  endTime?: string
  htmlReport?: string
  suggestions?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sessionId?: string
}

export interface AnalyticsData {
  totalSessions: number
  totalTestCases: number
  totalJenkinsRuns: number
  successRate: number
  averageSessionDuration: number
  mostUsedFormats: { format: string; count: number }[]
  recentActivity: ActivityItem[]
  performanceMetrics: PerformanceMetrics
  testCaseEffectiveness: TestCaseEffectiveness
  jenkinsJobAnalytics: JenkinsJobAnalytics
}

export interface ActivityItem {
  id: string
  type: 'session' | 'test_case' | 'jenkins_run'
  title: string
  timestamp: string
  status: string
  url?: string
}

export interface PerformanceMetrics {
  averageRecordingTime: number
  averageTestGenerationTime: number
  averageJenkinsRunTime: number
  systemUptime: number
  errorRate: number
}

export interface TestCaseEffectiveness {
  totalGenerated: number
  totalDownloaded: number
  formatDistribution: { format: string; percentage: number }[]
  averageStepsPerTest: number
  complexityScore: number
}

export interface JenkinsJobAnalytics {
  totalJobs: number
  successfulRuns: number
  failedRuns: number
  averageBuildTime: number
  mostActiveJobs: { jobName: string; runs: number }[]
  failureReasons: { reason: string; count: number }[]
}