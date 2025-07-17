import type { TestCase } from '@/types'

export class FileDownloadService {
  private static instance: FileDownloadService

  static getInstance(): FileDownloadService {
    if (!FileDownloadService.instance) {
      FileDownloadService.instance = new FileDownloadService()
    }
    return FileDownloadService.instance
  }

  downloadTestCase(testCase: TestCase) {
    const content = this.generateFileContent(testCase)
    const filename = this.generateFilename(testCase)
    const mimeType = this.getMimeType(testCase.format)

    this.downloadFile(content, filename, mimeType)
  }

  downloadMultipleTestCases(testCases: TestCase[], format: string) {
    if (testCases.length === 1) {
      this.downloadTestCase(testCases[0])
      return
    }

    // Create a zip file with multiple test cases
    const zipContent = this.createZipContent(testCases, format)
    const filename = `test-cases-${Date.now()}.zip`
    
    this.downloadFile(zipContent, filename, 'application/zip')
  }

  private generateFileContent(testCase: TestCase): string {
    switch (testCase.format) {
      case 'pytest':
        return this.generatePytestFile(testCase)
      case 'selenium_bdd':
        return this.generateSeleniumBDDFiles(testCase)
      case 'gherkin':
        return this.generateGherkinFile(testCase)
      default:
        return testCase.content
    }
  }

  private generatePytestFile(testCase: TestCase): string {
    const className = this.toPascalCase(testCase.title)
    const methodName = this.toSnakeCase(testCase.title)
    
    return `"""
${testCase.title}
${testCase.description}

Generated on: ${new Date().toISOString()}
"""

import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options


class Test${className}:
    """Test class for ${testCase.title}"""
    
    @pytest.fixture(scope="function")
    def driver(self):
        """Setup and teardown for WebDriver"""
        options = Options()
        options.add_argument("--headless")  # Remove for debugging
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        driver = webdriver.Chrome(options=options)
        driver.implicitly_wait(10)
        driver.maximize_window()
        
        yield driver
        
        driver.quit()
    
    def test_${methodName}(self, driver):
        """
        ${testCase.description}
        """
        try:
            ${this.generatePytestSteps(testCase)}
            
        except Exception as e:
            pytest.fail(f"Test failed with error: {str(e)}")
    
    def wait_for_element(self, driver, by, value, timeout=10):
        """Helper method to wait for element"""
        return WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
    
    def wait_and_click(self, driver, by, value, timeout=10):
        """Helper method to wait and click element"""
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        element.click()
        return element
    
    def wait_and_send_keys(self, driver, by, value, text, timeout=10):
        """Helper method to wait and send keys to element"""
        element = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
        element.clear()
        element.send_keys(text)
        return element


if __name__ == "__main__":
    pytest.main([__file__])
`
  }

  private generateSeleniumBDDFiles(testCase: TestCase): string {
    const featureName = this.toPascalCase(testCase.title)
    
    return `# Feature File: ${testCase.title.toLowerCase().replace(/\s+/g, '_')}.feature

Feature: ${testCase.title}
  As a user
  I want to ${testCase.description}
  So that I can verify the application functionality

  Background:
    Given the browser is open
    And I navigate to the application

  Scenario: ${testCase.title}
    ${this.generateGherkinSteps(testCase)}

# Step Definitions (Java)
# File: ${featureName}Steps.java

package stepDefinitions;

import io.cucumber.java.en.*;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.junit.Assert;
import java.time.Duration;

public class ${featureName}Steps {
    
    private WebDriver driver;
    private WebDriverWait wait;
    
    @Before
    public void setUp() {
        System.setProperty("webdriver.chrome.driver", "path/to/chromedriver");
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().window().maximize();
    }
    
    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
    
    ${this.generateJavaStepDefinitions(testCase)}
}

# Page Object Model
# File: ${featureName}Page.java

package pageObjects;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class ${featureName}Page {
    
    private WebDriver driver;
    
    public ${featureName}Page(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }
    
    // Add page elements and methods here
    
}
`
  }

  private generateGherkinFile(testCase: TestCase): string {
    return `Feature: ${testCase.title}
  ${testCase.description}

  Background:
    Given the user is on the application
    And the system is ready for testing

  Scenario: ${testCase.title}
    ${this.generateGherkinSteps(testCase)}

  Scenario Outline: ${testCase.title} with different data
    ${this.generateGherkinSteps(testCase)}
    
    Examples:
      | data1 | data2 | expected |
      | test1 | val1  | result1  |
      | test2 | val2  | result2  |

  @smoke @regression
  Scenario: ${testCase.title} - Error Handling
    Given the user is on the application
    When an error occurs during the process
    Then the system should handle the error gracefully
    And display appropriate error messages
`
  }

  private generatePytestSteps(testCase: TestCase): string {
    // Convert test case content to pytest steps
    const steps = testCase.steps.map(step => {
      return `            # ${step.action}
            time.sleep(0.5)  # Small delay for stability`
    }).join('\n')

    return `# Navigate to the application
            driver.get("${this.extractUrlFromContent(testCase.content)}")
            
            # Wait for page to load
            self.wait_for_element(driver, By.TAG_NAME, "body")
            
            ${steps}
            
            # Add assertions
            assert driver.title is not None, "Page title should not be None"
            print("Test completed successfully")`
  }

  private generateGherkinSteps(testCase: TestCase): string {
    const steps = testCase.steps.map(step => {
      if (step.action.toLowerCase().includes('click')) {
        return `    When I click on "${step.element}"`
      } else if (step.action.toLowerCase().includes('input') || step.action.toLowerCase().includes('type')) {
        return `    When I enter "${step.value || 'test data'}" in "${step.element}"`
      } else if (step.action.toLowerCase().includes('navigate')) {
        return `    Given I navigate to "${step.value || 'the page'}"`
      } else {
        return `    And I ${step.action.toLowerCase()}`
      }
    }).join('\n')

    return `Given I am on the application page
    ${steps}
    Then I should see the expected results
    And the page should be displayed correctly`
  }

  private generateJavaStepDefinitions(testCase: TestCase): string {
    return `
    @Given("the browser is open")
    public void the_browser_is_open() {
        // Browser setup is handled in @Before
        Assert.assertNotNull("Driver should be initialized", driver);
    }
    
    @Given("I navigate to the application")
    public void i_navigate_to_the_application() {
        driver.get("${this.extractUrlFromContent(testCase.content)}");
    }
    
    @When("I click on {string}")
    public void i_click_on(String element) {
        // Implementation for clicking elements
        // Use page object methods here
    }
    
    @When("I enter {string} in {string}")
    public void i_enter_in(String text, String element) {
        // Implementation for entering text
        // Use page object methods here
    }
    
    @Then("I should see the expected results")
    public void i_should_see_the_expected_results() {
        // Add assertions here
        Assert.assertTrue("Expected results should be visible", true);
    }
`
  }

  private createZipContent(testCases: TestCase[], format: string): string {
    // In a real implementation, this would create an actual ZIP file
    // For now, return a concatenated content
    let zipContent = `# Test Cases Package - ${format.toUpperCase()}\n`
    zipContent += `# Generated on: ${new Date().toISOString()}\n\n`
    
    testCases.forEach((testCase, index) => {
      zipContent += `# ========== Test Case ${index + 1}: ${testCase.title} ==========\n`
      zipContent += this.generateFileContent(testCase)
      zipContent += '\n\n'
    })
    
    return zipContent
  }

  private generateFilename(testCase: TestCase): string {
    const baseName = testCase.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    
    switch (testCase.format) {
      case 'pytest':
        return `test_${baseName}.py`
      case 'selenium_bdd':
        return `${baseName}.feature`
      case 'gherkin':
        return `${baseName}.feature`
      default:
        return `${baseName}.txt`
    }
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'pytest':
        return 'text/x-python'
      case 'selenium_bdd':
      case 'gherkin':
        return 'text/plain'
      default:
        return 'text/plain'
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toUpperCase() : word.toUpperCase()
    }).replace(/\s+/g, '')
  }

  private toSnakeCase(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }

  private extractUrlFromContent(content: string): string {
    const urlMatch = content.match(/https?:\/\/[^\s]+/)
    return urlMatch ? urlMatch[0] : 'https://example.com'
  }
}

export const fileDownloadService = FileDownloadService.getInstance()