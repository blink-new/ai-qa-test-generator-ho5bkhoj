import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { RecordingModal } from '@/components/recording/RecordingModal'
import { RecordingSession } from '@/components/recording/RecordingSession'
import { JenkinsConfiguration } from '@/components/jenkins/JenkinsConfig'
import { 
  Play, 
  FileText, 
  Settings, 
  History,
  Monitor,
  TestTube,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  BarChart3,
  Wrench
} from 'lucide-react'
import { blink } from '@/blink/client'
import { recordingService } from '@/services/recordingService'
import { testCaseGenerator } from '@/services/testCaseGenerator'
import { fileDownloadService } from '@/services/fileDownloadService'
import { analyticsService } from '@/services/analyticsService'
import type { RecordingSession as RecordingSessionType, TestCase, AnalyticsData } from '@/types'

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [currentSession, setCurrentSession] = useState<RecordingSessionType | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecordingSessionType[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [showTestCaseModal, setShowTestCaseModal] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'pytest' | 'selenium_bdd' | 'gherkin'>('pytest')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadRecentSessions = useCallback(async () => {
    if (!user) return
    
    try {
      const sessions = await recordingService.getRecentSessions(user.id)
      setRecentSessions(sessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }, [user])

  const loadAnalytics = useCallback(async () => {
    if (!user) return
    
    try {
      const analyticsData = await analyticsService.getAnalyticsData(user.id)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }, [user])

  useEffect(() => {
    // Load data when user changes
    if (user) {
      loadRecentSessions()
      loadAnalytics()
    }
  }, [user, loadRecentSessions, loadAnalytics])

  const handleStartRecording = async (url: string) => {
    try {
      const session = await recordingService.startRecording(url, user.id)
      setCurrentSession(session)
      
      // Monitor session updates
      const interval = setInterval(() => {
        const currentSession = recordingService.getCurrentSession()
        if (currentSession) {
          setCurrentSession(currentSession)
        }
      }, 1000)
      
      // Clean up interval when session ends
      setTimeout(() => clearInterval(interval), 300000) // 5 minutes max
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const handleStopRecording = async () => {
    try {
      const completedSession = await recordingService.stopRecording()
      if (completedSession) {
        setCurrentSession(completedSession)
        
        // Generate test cases automatically with timeout
        const processingTimeout = setTimeout(async () => {
          try {
            const generatedTestCases = await testCaseGenerator.generateTestCases(
              completedSession,
              selectedFormat
            )
            setTestCases(generatedTestCases)
            
            // Mark session as completed
            await recordingService.completeSession(completedSession.id)
            setCurrentSession(null)
            loadRecentSessions()
            loadAnalytics()
          } catch (error) {
            console.error('Error generating test cases:', error)
            // Still mark as completed even if test case generation fails
            await recordingService.completeSession(completedSession.id)
            setCurrentSession(null)
          }
        }, 3000)

        // Fallback timeout to prevent infinite processing
        setTimeout(async () => {
          if (currentSession?.status === 'processing') {
            console.warn('Processing timeout reached, marking session as completed')
            await recordingService.completeSession(completedSession.id)
            setCurrentSession(null)
            loadRecentSessions()
          }
        }, 15000) // 15 second timeout
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }

  const handlePauseRecording = async () => {
    try {
      await recordingService.pauseRecording()
      const currentSession = recordingService.getCurrentSession()
      if (currentSession) {
        setCurrentSession(currentSession)
      }
    } catch (error) {
      console.error('Error pausing recording:', error)
    }
  }

  const handleResumeRecording = async () => {
    try {
      await recordingService.resumeRecording()
      const currentSession = recordingService.getCurrentSession()
      if (currentSession) {
        setCurrentSession(currentSession)
      }
    } catch (error) {
      console.error('Error resuming recording:', error)
    }
  }

  const handleDownloadTestCase = (testCase: TestCase) => {
    fileDownloadService.downloadTestCase(testCase)
  }

  const handleDownloadAllTestCases = () => {
    if (testCases.length > 0) {
      fileDownloadService.downloadMultipleTestCases(testCases, selectedFormat)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recording': return <Activity className="h-4 w-4 text-red-500" />
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {currentSession ? (
              <RecordingSession
                session={currentSession}
                onStop={handleStopRecording}
                onPause={handlePauseRecording}
                onResume={handleResumeRecording}
              />
            ) : (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {user.email}!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Start recording user interactions to generate automated test cases with AI
                  </p>
                  
                  <Button
                    onClick={() => setShowRecordingModal(true)}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start New Recording
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Monitor className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{analytics?.totalSessions || recentSessions.length}</p>
                          <p className="text-sm text-gray-600">Total Sessions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <TestTube className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{analytics?.totalTestCases || testCases.length}</p>
                          <p className="text-sm text-gray-600">Test Cases</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{analytics?.successRate || 0}%</p>
                          <p className="text-sm text-gray-600">Success Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Wrench className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="text-2xl font-bold">{analytics?.totalJenkinsRuns || 0}</p>
                          <p className="text-sm text-gray-600">Jenkins Runs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Test Cases Section */}
                {testCases.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TestTube className="mr-2 h-5 w-5" />
                          Generated Test Cases
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value as any)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="pytest">Pytest</option>
                            <option value="selenium_bdd">Selenium BDD</option>
                            <option value="gherkin">Gherkin</option>
                          </select>
                          <Button onClick={handleDownloadAllTestCases} size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download All
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {testCases.map((testCase) => (
                          <div key={testCase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{testCase.title}</h4>
                              <p className="text-sm text-gray-600">{testCase.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline">{testCase.format}</Badge>
                                <Badge variant="secondary">{testCase.steps.length} steps</Badge>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDownloadTestCase(testCase)}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Analytics Section */}
                {analytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5" />
                        Analytics Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{analytics.averageSessionDuration}s</p>
                          <p className="text-sm text-gray-600">Avg Session Duration</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{analytics.performanceMetrics.systemUptime}%</p>
                          <p className="text-sm text-gray-600">System Uptime</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{analytics.testCaseEffectiveness.averageStepsPerTest}</p>
                          <p className="text-sm text-gray-600">Avg Steps per Test</p>
                        </div>
                      </div>
                      
                      {analytics.mostUsedFormats.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Most Used Formats</h4>
                          <div className="flex space-x-2">
                            {analytics.mostUsedFormats.map((format) => (
                              <Badge key={format.format} variant="outline">
                                {format.format}: {format.count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Jenkins Integration */}
                <JenkinsConfiguration userId={user.id} />

                {/* Recent Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Recent Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentSessions.length > 0 ? (
                      <div className="space-y-3">
                        {recentSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(session.status)}
                              <div>
                                <p className="font-medium text-gray-900">{session.url}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(session.startTime).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                                {session.status}
                              </Badge>
                              {session.testCases && session.testCases.length > 0 && (
                                <Badge variant="outline">
                                  {session.testCases.length} test cases
                                </Badge>
                              )}
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start your first recording session to generate test cases
                        </p>
                        <Button
                          onClick={() => setShowRecordingModal(true)}
                          variant="outline"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Recording
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l bg-white">
          <ChatInterface sessionId={currentSession?.id} />
        </div>
      </div>

      <RecordingModal
        open={showRecordingModal}
        onOpenChange={setShowRecordingModal}
        onStartRecording={handleStartRecording}
      />
    </div>
  )
}