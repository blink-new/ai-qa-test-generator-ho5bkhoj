import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Square, 
  Monitor, 
  MousePointer, 
  Keyboard, 
  Network,
  Clock,
  Activity
} from 'lucide-react'
import type { RecordingSession as RecordingSessionType } from '@/types'

interface RecordingSessionProps {
  session: RecordingSessionType
  onStop: () => void
  onPause: () => void
  onResume: () => void
}

export function RecordingSession({ session, onStop, onPause, onResume }: RecordingSessionProps) {
  const [duration, setDuration] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState('Initializing...')

  useEffect(() => {
    if (session.status === 'recording' && !isPaused) {
      const interval = setInterval(() => {
        const start = new Date(session.startTime).getTime()
        const now = Date.now()
        setDuration(Math.floor((now - start) / 1000))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [session.status, session.startTime, isPaused])

  // Simulate processing progress
  useEffect(() => {
    if (session.status === 'processing') {
      const steps = [
        { progress: 20, step: 'Analyzing user interactions...' },
        { progress: 40, step: 'Processing API calls...' },
        { progress: 60, step: 'Generating test scenarios...' },
        { progress: 80, step: 'Creating test cases...' },
        { progress: 95, step: 'Finalizing output...' }
      ]

      let currentStepIndex = 0
      const progressInterval = setInterval(() => {
        if (currentStepIndex < steps.length) {
          const currentStep = steps[currentStepIndex]
          setProcessingProgress(currentStep.progress)
          setProcessingStep(currentStep.step)
          currentStepIndex++
        } else {
          clearInterval(progressInterval)
        }
      }, 600) // Update every 600ms

      return () => clearInterval(progressInterval)
    } else {
      setProcessingProgress(0)
      setProcessingStep('Initializing...')
    }
  }, [session.status])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handlePause = () => {
    setIsPaused(true)
    onPause()
  }

  const handleResume = () => {
    setIsPaused(false)
    onResume()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recording': return 'bg-red-500'
      case 'stopped': return 'bg-gray-500'
      case 'processing': return 'bg-yellow-500'
      case 'completed': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Recording Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)} ${
                session.status === 'recording' ? 'animate-pulse' : ''
              }`} />
              <span>Recording Session</span>
              <Badge variant={session.status === 'recording' ? 'destructive' : 'secondary'}>
                {session.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(duration)}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Recording: {session.url}</span>
            </div>
            <div className="flex space-x-2">
              {session.status === 'recording' && !isPaused && (
                <Button onClick={handlePause} variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
              {isPaused && (
                <Button onClick={handleResume} variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              )}
              {session.status !== 'processing' && (
                <Button onClick={onStop} variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-1" />
                  Stop Recording
                </Button>
              )}
              {session.status === 'processing' && (
                <Button disabled variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Processing...
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <MousePointer className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{session.interactions.length}</p>
                <p className="text-sm text-gray-600">User Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Network className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{session.apiCalls.length}</p>
                <p className="text-sm text-gray-600">API Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(duration)}</p>
                <p className="text-sm text-gray-600">Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browser Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="mr-2 h-5 w-5" />
            {session.status === 'processing' ? 'Processing Recording' : 'Browser Session'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
            {session.status === 'processing' ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Processing Recording Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Our AI is analyzing your interactions and generating test cases...
                </p>
                <div className="bg-white rounded-md p-3 border mb-4">
                  <code className="text-sm text-indigo-600">{session.url}</code>
                </div>
                <div className="space-y-3">
                  <Progress value={processingProgress} className="w-64 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">
                    {processingStep}
                  </p>
                  <p className="text-xs text-gray-500">
                    Processing {session.interactions.length} interactions and {session.apiCalls.length} API calls
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Browser Recording Active
                </h3>
                <p className="text-gray-600 mb-4">
                  A Chrome browser window is open and recording your interactions on:
                </p>
                <div className="bg-white rounded-md p-3 border">
                  <code className="text-sm text-indigo-600">{session.url}</code>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Navigate and interact with the website normally. All actions are being captured.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {session.interactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {session.interactions.slice(-5).reverse().map((interaction) => (
                <div key={interaction.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <div className="flex-shrink-0">
                    {interaction.type === 'click' && <MousePointer className="h-4 w-4 text-blue-500" />}
                    {interaction.type === 'input' && <Keyboard className="h-4 w-4 text-green-500" />}
                    {interaction.type === 'navigation' && <Monitor className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} on {interaction.element}
                    </p>
                    {interaction.value && (
                      <p className="text-xs text-gray-500 truncate">Value: {interaction.value}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(interaction.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}