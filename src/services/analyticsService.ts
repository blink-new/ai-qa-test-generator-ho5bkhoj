import { blink } from '@/blink/client'
import type { RecordingSession, TestCase, JenkinsRun } from '@/types'

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

export class AnalyticsService {
  private static instance: AnalyticsService

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  async getAnalyticsData(userId: string): Promise<AnalyticsData> {
    try {
      // In a real implementation, fetch data from database
      const [sessions, testCases, jenkinsRuns] = await Promise.all([
        this.getSessionsData(userId),
        this.getTestCasesData(userId),
        this.getJenkinsRunsData(userId)
      ])

      const analytics: AnalyticsData = {
        totalSessions: sessions.length,
        totalTestCases: testCases.length,
        totalJenkinsRuns: jenkinsRuns.length,
        successRate: this.calculateSuccessRate(sessions, jenkinsRuns),
        averageSessionDuration: this.calculateAverageSessionDuration(sessions),
        mostUsedFormats: this.calculateMostUsedFormats(testCases),
        recentActivity: this.generateRecentActivity(sessions, testCases, jenkinsRuns),
        performanceMetrics: this.calculatePerformanceMetrics(sessions, testCases, jenkinsRuns),
        testCaseEffectiveness: this.calculateTestCaseEffectiveness(testCases),
        jenkinsJobAnalytics: this.calculateJenkinsJobAnalytics(jenkinsRuns)
      }

      // Track analytics view
      blink.analytics.log('analytics_viewed', {
        user_id: userId,
        total_sessions: analytics.totalSessions,
        total_test_cases: analytics.totalTestCases
      })

      return analytics
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      throw new Error('Failed to fetch analytics data')
    }
  }

  private async getSessionsData(userId: string): Promise<RecordingSession[]> {
    // Mock data - in real implementation, fetch from database
    return [
      {
        id: '1',
        userId,
        url: 'https://amazon.in',
        status: 'completed',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3000000).toISOString(),
        interactions: Array(15).fill(null).map((_, i) => ({
          id: `int_${i}`,
          type: 'click',
          element: 'button',
          selector: `#btn_${i}`,
          timestamp: new Date().toISOString()
        })),
        apiCalls: Array(5).fill(null).map((_, i) => ({
          id: `api_${i}`,
          method: 'GET',
          url: `https://api.example.com/endpoint${i}`,
          headers: {},
          status: 200,
          timestamp: new Date().toISOString()
        }))
      },
      {
        id: '2',
        userId,
        url: 'https://google.com',
        status: 'completed',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        endTime: new Date(Date.now() - 6600000).toISOString(),
        interactions: Array(8).fill(null).map((_, i) => ({
          id: `int_${i}`,
          type: 'input',
          element: 'input',
          selector: `#input_${i}`,
          timestamp: new Date().toISOString()
        })),
        apiCalls: []
      }
    ]
  }

  private async getTestCasesData(userId: string): Promise<TestCase[]> {
    // Mock data - in real implementation, fetch from database
    return [
      {
        id: '1',
        sessionId: '1',
        title: 'Product Search Test',
        description: 'Test product search functionality',
        steps: Array(5).fill(null).map((_, i) => ({
          id: `step_${i}`,
          action: `Step ${i + 1}`,
          element: 'element',
          expected: 'expected result'
        })),
        format: 'pytest',
        content: 'test content',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        sessionId: '1',
        title: 'Checkout Process Test',
        description: 'Test checkout functionality',
        steps: Array(8).fill(null).map((_, i) => ({
          id: `step_${i}`,
          action: `Step ${i + 1}`,
          element: 'element',
          expected: 'expected result'
        })),
        format: 'selenium_bdd',
        content: 'test content',
        createdAt: new Date().toISOString()
      }
    ]
  }

  private async getJenkinsRunsData(userId: string): Promise<JenkinsRun[]> {
    // Mock data - in real implementation, fetch from database
    return [
      {
        id: '1',
        userId,
        jobName: 'qa-automation-tests',
        buildNumber: 42,
        status: 'success',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3000000).toISOString(),
        htmlReport: '<html>Report</html>',
        suggestions: ['Suggestion 1', 'Suggestion 2']
      },
      {
        id: '2',
        userId,
        jobName: 'regression-tests',
        buildNumber: 38,
        status: 'failed',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        endTime: new Date(Date.now() - 6600000).toISOString()
      }
    ]
  }

  private calculateSuccessRate(sessions: RecordingSession[], jenkinsRuns: JenkinsRun[]): number {
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const successfulRuns = jenkinsRuns.filter(r => r.status === 'success').length
    const totalItems = sessions.length + jenkinsRuns.length
    
    if (totalItems === 0) return 0
    return Math.round(((completedSessions + successfulRuns) / totalItems) * 100)
  }

  private calculateAverageSessionDuration(sessions: RecordingSession[]): number {
    const completedSessions = sessions.filter(s => s.endTime)
    if (completedSessions.length === 0) return 0

    const totalDuration = completedSessions.reduce((sum, session) => {
      const start = new Date(session.startTime).getTime()
      const end = new Date(session.endTime!).getTime()
      return sum + (end - start)
    }, 0)

    return Math.round(totalDuration / completedSessions.length / 1000) // Convert to seconds
  }

  private calculateMostUsedFormats(testCases: TestCase[]): { format: string; count: number }[] {
    const formatCounts = testCases.reduce((acc, testCase) => {
      acc[testCase.format] = (acc[testCase.format] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(formatCounts)
      .map(([format, count]) => ({ format, count }))
      .sort((a, b) => b.count - a.count)
  }

  private generateRecentActivity(
    sessions: RecordingSession[],
    testCases: TestCase[],
    jenkinsRuns: JenkinsRun[]
  ): ActivityItem[] {
    const activities: ActivityItem[] = []

    // Add session activities
    sessions.forEach(session => {
      activities.push({
        id: session.id,
        type: 'session',
        title: `Recording session on ${new URL(session.url).hostname}`,
        timestamp: session.startTime,
        status: session.status,
        url: session.url
      })
    })

    // Add test case activities
    testCases.forEach(testCase => {
      activities.push({
        id: testCase.id,
        type: 'test_case',
        title: `Generated test case: ${testCase.title}`,
        timestamp: testCase.createdAt,
        status: 'completed'
      })
    })

    // Add Jenkins run activities
    jenkinsRuns.forEach(run => {
      activities.push({
        id: run.id,
        type: 'jenkins_run',
        title: `Jenkins job: ${run.jobName} #${run.buildNumber}`,
        timestamp: run.startTime,
        status: run.status
      })
    })

    // Sort by timestamp (most recent first) and return top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  private calculatePerformanceMetrics(
    sessions: RecordingSession[],
    testCases: TestCase[],
    jenkinsRuns: JenkinsRun[]
  ): PerformanceMetrics {
    const averageRecordingTime = this.calculateAverageSessionDuration(sessions)
    
    // Mock calculations for other metrics
    const averageTestGenerationTime = 45 // seconds
    const averageJenkinsRunTime = jenkinsRuns.length > 0 ? 
      jenkinsRuns.reduce((sum, run) => {
        if (!run.endTime) return sum
        const duration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime()
        return sum + duration
      }, 0) / jenkinsRuns.filter(r => r.endTime).length / 1000 : 0

    return {
      averageRecordingTime,
      averageTestGenerationTime,
      averageJenkinsRunTime: Math.round(averageJenkinsRunTime),
      systemUptime: 99.8, // percentage
      errorRate: 2.1 // percentage
    }
  }

  private calculateTestCaseEffectiveness(testCases: TestCase[]): TestCaseEffectiveness {
    const formatCounts = testCases.reduce((acc, testCase) => {
      acc[testCase.format] = (acc[testCase.format] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const formatDistribution = Object.entries(formatCounts).map(([format, count]) => ({
      format,
      percentage: Math.round((count / testCases.length) * 100)
    }))

    const averageStepsPerTest = testCases.length > 0 ?
      testCases.reduce((sum, testCase) => sum + testCase.steps.length, 0) / testCases.length : 0

    return {
      totalGenerated: testCases.length,
      totalDownloaded: Math.floor(testCases.length * 0.7), // Mock 70% download rate
      formatDistribution,
      averageStepsPerTest: Math.round(averageStepsPerTest),
      complexityScore: Math.round(averageStepsPerTest * 10) // Simple complexity calculation
    }
  }

  private calculateJenkinsJobAnalytics(jenkinsRuns: JenkinsRun[]): JenkinsJobAnalytics {
    const jobCounts = jenkinsRuns.reduce((acc, run) => {
      acc[run.jobName] = (acc[run.jobName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostActiveJobs = Object.entries(jobCounts)
      .map(([jobName, runs]) => ({ jobName, runs }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5)

    const successfulRuns = jenkinsRuns.filter(r => r.status === 'success').length
    const failedRuns = jenkinsRuns.filter(r => r.status === 'failed').length

    const averageBuildTime = jenkinsRuns.length > 0 ?
      jenkinsRuns.reduce((sum, run) => {
        if (!run.endTime) return sum
        const duration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime()
        return sum + duration
      }, 0) / jenkinsRuns.filter(r => r.endTime).length / 1000 : 0

    // Mock failure reasons
    const failureReasons = [
      { reason: 'Test timeout', count: Math.floor(failedRuns * 0.4) },
      { reason: 'Element not found', count: Math.floor(failedRuns * 0.3) },
      { reason: 'Assertion failed', count: Math.floor(failedRuns * 0.2) },
      { reason: 'Network error', count: Math.floor(failedRuns * 0.1) }
    ].filter(r => r.count > 0)

    return {
      totalJobs: new Set(jenkinsRuns.map(r => r.jobName)).size,
      successfulRuns,
      failedRuns,
      averageBuildTime: Math.round(averageBuildTime),
      mostActiveJobs,
      failureReasons
    }
  }

  async generateAnalyticsReport(userId: string): Promise<string> {
    try {
      const analytics = await this.getAnalyticsData(userId)
      
      const { text } = await blink.ai.generateText({
        prompt: `
Generate a comprehensive QA analytics report based on the following data:

${JSON.stringify(analytics, null, 2)}

Please provide:
1. Executive Summary
2. Key Performance Indicators
3. Test Case Analysis
4. Jenkins Integration Insights
5. Recommendations for Improvement
6. Trends and Patterns

Format the report in a professional, easy-to-read manner with clear sections and bullet points.
        `,
        model: 'gpt-4o-mini',
        maxTokens: 1500
      })

      // Track report generation
      blink.analytics.log('analytics_report_generated', {
        user_id: userId,
        report_length: text.length
      })

      return text
    } catch (error) {
      console.error('Error generating analytics report:', error)
      throw new Error('Failed to generate analytics report')
    }
  }

  async exportAnalyticsData(userId: string, format: 'json' | 'csv'): Promise<string> {
    try {
      const analytics = await this.getAnalyticsData(userId)
      
      if (format === 'json') {
        return JSON.stringify(analytics, null, 2)
      } else {
        return this.convertToCSV(analytics)
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error)
      throw new Error('Failed to export analytics data')
    }
  }

  private convertToCSV(analytics: AnalyticsData): string {
    const csvRows = [
      'Metric,Value',
      `Total Sessions,${analytics.totalSessions}`,
      `Total Test Cases,${analytics.totalTestCases}`,
      `Total Jenkins Runs,${analytics.totalJenkinsRuns}`,
      `Success Rate,${analytics.successRate}%`,
      `Average Session Duration,${analytics.averageSessionDuration}s`,
      `Average Recording Time,${analytics.performanceMetrics.averageRecordingTime}s`,
      `Average Test Generation Time,${analytics.performanceMetrics.averageTestGenerationTime}s`,
      `System Uptime,${analytics.performanceMetrics.systemUptime}%`,
      `Error Rate,${analytics.performanceMetrics.errorRate}%`
    ]

    return csvRows.join('\n')
  }
}

export const analyticsService = AnalyticsService.getInstance()