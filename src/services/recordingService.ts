import { blink } from '@/blink/client'
import type { RecordingSession, Interaction, ApiCall } from '@/types'

export class RecordingService {
  private static instance: RecordingService
  private currentSession: RecordingSession | null = null
  private recordingWindow: Window | null = null
  private isRecording = false

  static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService()
    }
    return RecordingService.instance
  }

  async startRecording(url: string, userId: string): Promise<RecordingSession> {
    if (this.isRecording) {
      throw new Error('Recording already in progress')
    }

    const sessionId = `session_${Date.now()}`
    
    this.currentSession = {
      id: sessionId,
      userId,
      url,
      status: 'recording',
      startTime: new Date().toISOString(),
      interactions: [],
      apiCalls: []
    }

    // Save session to database
    await this.saveSessionToDatabase(this.currentSession)

    // Open browser window for recording
    this.openRecordingWindow(url)
    
    this.isRecording = true
    return this.currentSession
  }

  private openRecordingWindow(url: string) {
    // In a real implementation, this would open a controlled Chrome instance
    // For now, we'll simulate with a popup window
    const features = 'width=1200,height=800,scrollbars=yes,resizable=yes'
    this.recordingWindow = window.open(url, 'recording_window', features)
    
    if (this.recordingWindow) {
      // Inject recording script
      this.injectRecordingScript()
      
      // Monitor window for interactions
      this.monitorWindow()
    }
  }

  private injectRecordingScript() {
    if (!this.recordingWindow) return

    // Wait for window to load
    this.recordingWindow.addEventListener('load', () => {
      const script = this.recordingWindow!.document.createElement('script')
      script.textContent = `
        (function() {
          let interactionCount = 0;
          
          // Track clicks
          document.addEventListener('click', function(e) {
            const interaction = {
              id: 'interaction_' + (++interactionCount),
              type: 'click',
              element: e.target.tagName.toLowerCase(),
              selector: getSelector(e.target),
              timestamp: new Date().toISOString(),
              value: e.target.textContent?.substring(0, 100) || ''
            };
            
            // Send to parent window
            window.parent.postMessage({
              type: 'INTERACTION_RECORDED',
              data: interaction
            }, '*');
          });
          
          // Track input changes
          document.addEventListener('input', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
              const interaction = {
                id: 'interaction_' + (++interactionCount),
                type: 'input',
                element: e.target.tagName.toLowerCase(),
                selector: getSelector(e.target),
                timestamp: new Date().toISOString(),
                value: e.target.value
              };
              
              window.parent.postMessage({
                type: 'INTERACTION_RECORDED',
                data: interaction
              }, '*');
            }
          });
          
          // Track navigation
          let currentUrl = window.location.href;
          setInterval(function() {
            if (window.location.href !== currentUrl) {
              currentUrl = window.location.href;
              const interaction = {
                id: 'interaction_' + (++interactionCount),
                type: 'navigation',
                element: 'page',
                selector: 'body',
                timestamp: new Date().toISOString(),
                value: currentUrl
              };
              
              window.parent.postMessage({
                type: 'INTERACTION_RECORDED',
                data: interaction
              }, '*');
            }
          }, 1000);
          
          // Helper function to generate CSS selector
          function getSelector(element) {
            if (element.id) return '#' + element.id;
            if (element.className) return '.' + element.className.split(' ')[0];
            
            let path = [];
            while (element.parentNode) {
              let selector = element.tagName.toLowerCase();
              if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
              } else if (element.className) {
                selector += '.' + element.className.split(' ')[0];
              }
              path.unshift(selector);
              element = element.parentNode;
            }
            return path.join(' > ');
          }
          
          // Intercept API calls
          const originalFetch = window.fetch;
          window.fetch = function(...args) {
            const startTime = Date.now();
            return originalFetch.apply(this, args).then(response => {
              const apiCall = {
                id: 'api_' + Date.now(),
                method: args[1]?.method || 'GET',
                url: args[0].toString(),
                headers: args[1]?.headers || {},
                body: args[1]?.body || null,
                status: response.status,
                timestamp: new Date().toISOString()
              };
              
              window.parent.postMessage({
                type: 'API_CALL_RECORDED',
                data: apiCall
              }, '*');
              
              return response;
            });
          };
          
          // Intercept XMLHttpRequest
          const originalXHR = window.XMLHttpRequest;
          window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            let method, url;
            
            xhr.open = function(m, u) {
              method = m;
              url = u;
              return originalOpen.apply(this, arguments);
            };
            
            xhr.send = function() {
              const startTime = Date.now();
              
              xhr.addEventListener('loadend', function() {
                const apiCall = {
                  id: 'api_' + Date.now(),
                  method: method,
                  url: url,
                  headers: {},
                  body: arguments[0] || null,
                  status: xhr.status,
                  timestamp: new Date().toISOString()
                };
                
                window.parent.postMessage({
                  type: 'API_CALL_RECORDED',
                  data: apiCall
                }, '*');
              });
              
              return originalSend.apply(this, arguments);
            };
            
            return xhr;
          };
        })();
      `
      
      this.recordingWindow!.document.head.appendChild(script)
    })
  }

  private monitorWindow() {
    // Listen for messages from recording window
    window.addEventListener('message', (event) => {
      if (!this.currentSession || !this.isRecording) return

      if (event.data.type === 'INTERACTION_RECORDED') {
        this.recordInteraction(event.data.data)
      } else if (event.data.type === 'API_CALL_RECORDED') {
        this.recordApiCall(event.data.data)
      }
    })

    // Check if window is closed
    const checkWindow = setInterval(() => {
      if (this.recordingWindow?.closed) {
        clearInterval(checkWindow)
        this.stopRecording()
      }
    }, 1000)
  }

  private async recordInteraction(interaction: Interaction) {
    if (!this.currentSession) return

    this.currentSession.interactions.push(interaction)
    
    // Save to database
    try {
      // In a real implementation, save to database
      console.log('Interaction recorded:', interaction)
    } catch (error) {
      console.error('Error saving interaction:', error)
    }
  }

  private async recordApiCall(apiCall: ApiCall) {
    if (!this.currentSession) return

    this.currentSession.apiCalls.push(apiCall)
    
    // Save to database
    try {
      // In a real implementation, save to database
      console.log('API call recorded:', apiCall)
    } catch (error) {
      console.error('Error saving API call:', error)
    }
  }

  async stopRecording(): Promise<RecordingSession | null> {
    if (!this.isRecording || !this.currentSession) return null

    this.isRecording = false
    this.currentSession.status = 'processing'
    this.currentSession.endTime = new Date().toISOString()

    // Close recording window
    if (this.recordingWindow && !this.recordingWindow.closed) {
      this.recordingWindow.close()
    }
    this.recordingWindow = null

    // Update session in database
    await this.saveSessionToDatabase(this.currentSession)

    const session = this.currentSession
    return session
  }

  async completeSession(sessionId: string): Promise<void> {
    if (this.currentSession && this.currentSession.id === sessionId) {
      this.currentSession.status = 'completed'
      await this.saveSessionToDatabase(this.currentSession)
      this.currentSession = null
    }
  }

  async pauseRecording() {
    if (this.currentSession) {
      this.currentSession.status = 'stopped'
      this.isRecording = false
    }
  }

  async resumeRecording() {
    if (this.currentSession) {
      this.currentSession.status = 'recording'
      this.isRecording = true
    }
  }

  getCurrentSession(): RecordingSession | null {
    return this.currentSession
  }

  private async saveSessionToDatabase(session: RecordingSession) {
    try {
      // In a real implementation, save to database using blink.db
      console.log('Session saved:', session)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  async getRecentSessions(userId: string): Promise<RecordingSession[]> {
    try {
      // In a real implementation, fetch from database
      // For now, return mock data
      return [
        {
          id: '1',
          userId,
          url: 'https://amazon.in',
          status: 'completed',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() - 3000000).toISOString(),
          interactions: [
            {
              id: '1',
              type: 'click',
              element: 'button',
              selector: '#search-button',
              timestamp: new Date().toISOString()
            }
          ],
          apiCalls: [
            {
              id: '1',
              method: 'GET',
              url: 'https://amazon.in/api/search',
              headers: {},
              status: 200,
              timestamp: new Date().toISOString()
            }
          ]
        }
      ]
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return []
    }
  }
}

export const recordingService = RecordingService.getInstance()