import { blink } from '@/blink/client'
import type { RecordingSession, TestCase, TestStep } from '@/types'

export class TestCaseGenerator {
  private static instance: TestCaseGenerator

  static getInstance(): TestCaseGenerator {
    if (!TestCaseGenerator.instance) {
      TestCaseGenerator.instance = new TestCaseGenerator()
    }
    return TestCaseGenerator.instance
  }

  async generateTestCases(
    session: RecordingSession,
    format: 'pytest' | 'selenium_bdd' | 'gherkin',
    specifications?: string
  ): Promise<TestCase[]> {
    try {
      // Prepare context for AI
      const context = this.prepareSessionContext(session)
      
      // Generate test cases using AI
      const prompt = this.buildPrompt(context, format, specifications)
      
      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4o-mini',
        maxTokens: 2000
      })

      // Parse AI response and create test cases
      const testCases = this.parseAIResponse(text, session.id, format)
      
      // Save test cases to database
      for (const testCase of testCases) {
        await this.saveTestCase(testCase)
      }

      return testCases
    } catch (error) {
      console.error('Error generating test cases:', error)
      throw new Error('Failed to generate test cases')
    }
  }

  private prepareSessionContext(session: RecordingSession): string {
    const interactions = session.interactions.map(interaction => ({
      type: interaction.type,
      element: interaction.element,
      selector: interaction.selector,
      value: interaction.value,
      timestamp: interaction.timestamp
    }))

    const apiCalls = session.apiCalls.map(call => ({
      method: call.method,
      url: call.url,
      status: call.status,
      timestamp: call.timestamp
    }))

    return JSON.stringify({
      url: session.url,
      duration: session.endTime ? 
        new Date(session.endTime).getTime() - new Date(session.startTime).getTime() : 
        null,
      interactions,
      apiCalls
    }, null, 2)
  }

  private buildPrompt(context: string, format: string, specifications?: string): string {
    const basePrompt = `
You are an expert QA automation engineer. Analyze the following user interaction recording and generate comprehensive test cases.

Recording Context:
${context}

${specifications ? `Additional Specifications:\n${specifications}\n` : ''}

Generate test cases in ${format} format. Follow these guidelines:

1. Create meaningful test case names that describe the user flow
2. Include proper setup and teardown steps
3. Add assertions to verify expected outcomes
4. Handle edge cases and error scenarios
5. Use appropriate selectors and wait strategies
6. Include data-driven test scenarios where applicable

For ${format} format:
${this.getFormatGuidelines(format)}

Generate 2-3 comprehensive test cases covering the main user flow and important edge cases.
`

    return basePrompt
  }

  private getFormatGuidelines(format: string): string {
    switch (format) {
      case 'pytest':
        return `
- Use pytest framework with selenium webdriver
- Include proper fixtures for setup/teardown
- Use page object model pattern
- Add proper assertions with meaningful error messages
- Include parametrized tests for data-driven scenarios
`
      case 'selenium_bdd':
        return `
- Use Cucumber/Gherkin syntax with Java/Selenium
- Create feature files with scenarios
- Include step definitions
- Use page object model
- Add proper Given/When/Then structure
`
      case 'gherkin':
        return `
- Pure Gherkin/Cucumber format
- Clear Given/When/Then steps
- Use scenario outlines for data-driven tests
- Include background steps for common setup
- Add tags for test organization
`
      default:
        return ''
    }
  }

  private parseAIResponse(response: string, sessionId: string, format: string): TestCase[] {
    try {
      // Extract test cases from AI response
      const testCases: TestCase[] = []
      
      // Simple parsing - in a real implementation, this would be more sophisticated
      const sections = response.split(/Test Case \d+:|Scenario:|Feature:/).filter(s => s.trim())
      
      sections.forEach((section, index) => {
        if (section.trim()) {
          const lines = section.trim().split('\n')
          const title = lines[0]?.trim() || `Test Case ${index + 1}`
          
          const testCase: TestCase = {
            id: `test_${sessionId}_${Date.now()}_${index}`,
            sessionId,
            title,
            description: this.extractDescription(section),
            steps: this.extractSteps(section),
            format,
            content: section.trim(),
            createdAt: new Date().toISOString()
          }
          
          testCases.push(testCase)
        }
      })

      // If no test cases were parsed, create a default one
      if (testCases.length === 0) {
        testCases.push({
          id: `test_${sessionId}_${Date.now()}`,
          sessionId,
          title: 'Generated Test Case',
          description: 'AI-generated test case based on recorded interactions',
          steps: [],
          format,
          content: response,
          createdAt: new Date().toISOString()
        })
      }

      return testCases
    } catch (error) {
      console.error('Error parsing AI response:', error)
      // Return a fallback test case
      return [{
        id: `test_${sessionId}_${Date.now()}`,
        sessionId,
        title: 'Generated Test Case',
        description: 'AI-generated test case based on recorded interactions',
        steps: [],
        format,
        content: response,
        createdAt: new Date().toISOString()
      }]
    }
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n')
    const descriptionLine = lines.find(line => 
      line.toLowerCase().includes('description') || 
      line.toLowerCase().includes('purpose')
    )
    return descriptionLine?.replace(/description:?/i, '').trim() || 'AI-generated test case'
  }

  private extractSteps(content: string): TestStep[] {
    const steps: TestStep[] = []
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.match(/^\d+\.|\*|-|Given|When|Then|And/)) {
        steps.push({
          id: `step_${index}`,
          action: trimmed,
          element: '',
          expected: ''
        })
      }
    })
    
    return steps
  }

  private async saveTestCase(testCase: TestCase) {
    try {
      // In a real implementation, save to database
      console.log('Test case saved:', testCase.title)
    } catch (error) {
      console.error('Error saving test case:', error)
    }
  }

  async getTestCasesForSession(sessionId: string): Promise<TestCase[]> {
    try {
      // In a real implementation, fetch from database
      return []
    } catch (error) {
      console.error('Error fetching test cases:', error)
      return []
    }
  }

  generateFileContent(testCase: TestCase): string {
    switch (testCase.format) {
      case 'pytest':
        return this.generatePytestContent(testCase)
      case 'selenium_bdd':
        return this.generateSeleniumBDDContent(testCase)
      case 'gherkin':
        return this.generateGherkinContent(testCase)
      default:
        return testCase.content
    }
  }

  private generatePytestContent(testCase: TestCase): string {
    return `
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class Test${testCase.title.replace(/\s+/g, '')}:
    
    @pytest.fixture
    def driver(self):
        driver = webdriver.Chrome()
        driver.implicitly_wait(10)
        yield driver
        driver.quit()
    
    def test_${testCase.title.toLowerCase().replace(/\s+/g, '_')}(self, driver):
        """${testCase.description}"""
        
        ${testCase.content}
        
        # Add your assertions here
        assert driver.title is not None
`
  }

  private generateSeleniumBDDContent(testCase: TestCase): string {
    return `
Feature: ${testCase.title}
  
  Scenario: ${testCase.description}
    ${testCase.content}

# Step Definitions (Java)
public class ${testCase.title.replace(/\s+/g, '')}Steps {
    
    private WebDriver driver;
    
    @Before
    public void setUp() {
        driver = new ChromeDriver();
        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
    }
    
    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
    
    // Add step definitions here
}
`
  }

  private generateGherkinContent(testCase: TestCase): string {
    return `
Feature: ${testCase.title}
  
  Background:
    Given the user is on the application
  
  Scenario: ${testCase.description}
    ${testCase.content}
`
  }
}

export const testCaseGenerator = TestCaseGenerator.getInstance()