import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Globe, Play } from 'lucide-react'

interface RecordingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartRecording: (url: string) => void
}

export function RecordingModal({ open, onOpenChange, onStartRecording }: RecordingModalProps) {
  const [url, setUrl] = useState('')
  const [isValidUrl, setIsValidUrl] = useState(false)

  const validateUrl = (input: string) => {
    try {
      new URL(input.startsWith('http') ? input : `https://${input}`)
      setIsValidUrl(true)
    } catch {
      setIsValidUrl(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUrl(value)
    validateUrl(value)
  }

  const handleStartRecording = () => {
    if (isValidUrl) {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      onStartRecording(fullUrl)
      onOpenChange(false)
      setUrl('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidUrl) {
      handleStartRecording()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5 text-indigo-600" />
            Start Recording Session
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              value={url}
              onChange={handleUrlChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter URL (e.g., amazon.in, google.com)"
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Enter the website URL you want to record interactions on
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A new Chrome browser window will open</li>
              <li>• Navigate and interact with the website normally</li>
              <li>• All clicks, inputs, and API calls will be recorded</li>
              <li>• AI will analyze your actions to generate test cases</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartRecording}
              disabled={!isValidUrl}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}