import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Settings, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle,
  Activity,
  ExternalLink
} from 'lucide-react'
import { jenkinsService, type JenkinsConfig } from '@/services/jenkinsService'
import { blink } from '@/blink/client'
import type { JenkinsRun } from '@/types'

interface JenkinsConfigProps {
  userId: string
}

export function JenkinsConfiguration({ userId }: JenkinsConfigProps) {
  const [config, setConfig] = useState<JenkinsConfig | null>(null)
  const [runs, setRuns] = useState<JenkinsRun[]>([])
  const [jobs, setJobs] = useState<string[]>([])
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [formData, setFormData] = useState({
    jenkinsUrl: '',
    username: '',
    apiToken: ''
  })
  const [selectedJob, setSelectedJob] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadJenkinsConfig()
    loadJenkinsRuns()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadJenkinsConfig = async () => {
    try {
      const jenkinsConfig = await jenkinsService.getJenkinsConfig(userId)
      setConfig(jenkinsConfig)
      
      if (jenkinsConfig) {
        const jobList = await jenkinsService.getJobList(jenkinsConfig)
        setJobs(jobList)
      }
    } catch (error) {
      console.error('Error loading Jenkins config:', error)
    }
  }

  const loadJenkinsRuns = async () => {
    try {
      const jenkinsRuns = await jenkinsService.getJenkinsRuns(userId)
      setRuns(jenkinsRuns)
    } catch (error) {
      console.error('Error loading Jenkins runs:', error)
    }
  }

  const handleSaveConfig = async () => {
    if (!formData.jenkinsUrl || !formData.username || !formData.apiToken) {
      return
    }

    setLoading(true)
    try {
      const savedConfig = await jenkinsService.saveJenkinsConfig({
        userId,
        ...formData
      })
      
      setConfig(savedConfig)
      setShowConfigModal(false)
      
      // Load jobs after saving config
      const jobList = await jenkinsService.getJobList(savedConfig)
      setJobs(jobList)
      
      // Track configuration
      blink.analytics.log('jenkins_configured', {
        user_id: userId,
        jenkins_url: formData.jenkinsUrl
      })
    } catch (error) {
      console.error('Error saving Jenkins config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerJob = async () => {
    if (!config || !selectedJob) return

    setLoading(true)
    try {
      const run = await jenkinsService.triggerJenkinsJob(config, selectedJob)
      setRuns(prev => [run, ...prev])
      
      // Track job trigger
      blink.analytics.log('jenkins_job_triggered', {
        user_id: userId,
        job_name: selectedJob,
        build_number: run.buildNumber
      })
    } catch (error) {
      console.error('Error triggering Jenkins job:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Jenkins Integration
            </div>
            <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  {config ? 'Update Config' : 'Configure'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Jenkins Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jenkinsUrl">Jenkins URL</Label>
                    <Input
                      id="jenkinsUrl"
                      value={formData.jenkinsUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, jenkinsUrl: e.target.value }))}
                      placeholder="https://jenkins.example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="jenkins-user"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiToken">API Token</Label>
                    <Input
                      id="apiToken"
                      type="password"
                      value={formData.apiToken}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiToken: e.target.value }))}
                      placeholder="API token from Jenkins"
                    />
                  </div>
                  <Button onClick={handleSaveConfig} disabled={loading} className="w-full">
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">
                  Connected to {config.jenkinsUrl}
                </span>
              </div>
              
              {jobs.length > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                  >
                    <option value="">Select a job to run</option>
                    {jobs.map(job => (
                      <option key={job} value={job}>{job}</option>
                    ))}
                  </select>
                  <Button
                    onClick={handleTriggerJob}
                    disabled={!selectedJob || loading}
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Run Job
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Jenkins Not Configured
              </h3>
              <p className="text-gray-600 mb-4">
                Configure your Jenkins connection to monitor test runs
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Runs */}
      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Jenkins Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {run.jobName} #{run.buildNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        Started: {new Date(run.startTime).toLocaleString()}
                      </p>
                      {run.endTime && (
                        <p className="text-sm text-gray-500">
                          Duration: {Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000)}s
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(run.status)}>
                      {run.status.toUpperCase()}
                    </Badge>
                    
                    {run.htmlReport && (
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Report
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {runs.some(run => run.suggestions && run.suggestions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {runs
                .filter(run => run.suggestions && run.suggestions.length > 0)
                .slice(0, 1) // Show suggestions for the most recent run
                .map((run) => (
                  <div key={run.id}>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Suggestions for {run.jobName} #{run.buildNumber}
                    </h4>
                    <ul className="space-y-2">
                      {run.suggestions!.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}