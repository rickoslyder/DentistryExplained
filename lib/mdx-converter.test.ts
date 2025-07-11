import { convertMdxToHtml, convertHtmlToMdx, validateMdx } from './mdx-html-converter'

// Test cases for MDX to HTML conversion
const mdxToHtmlTests = [
  {
    name: 'Basic markdown',
    input: '# Hello\n\nThis is **bold** and *italic*.',
    shouldContain: ['<h1>Hello</h1>', '<strong>bold</strong>', '<em>italic</em>']
  },
  {
    name: 'MDX component',
    input: '<Alert type="info">Test alert</Alert>',
    shouldContain: ['mdx-alert', 'Test alert']
  },
  {
    name: 'Frontmatter',
    input: '---\ntitle: Test\n---\n\n# Content',
    shouldContain: ['<code class="language-yaml">', 'title: Test']
  },
  {
    name: 'Nested components',
    input: '<Alert type="warning"><FAQ question="Test?">Answer</FAQ></Alert>',
    shouldContain: ['mdx-alert', 'mdx-faq']
  },
  {
    name: 'Empty input',
    input: '',
    expected: ''
  }
]

// Test cases for HTML to MDX conversion
const htmlToMdxTests = [
  {
    name: 'Basic HTML',
    input: '<h1>Hello</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>',
    shouldContain: ['# Hello', '**bold**', '*italic*']
  },
  {
    name: 'MDX component from custom element',
    input: '<mdx-alert data-component-type="Alert">Test</mdx-alert>',
    shouldContain: ['<Alert', 'Test', '</Alert>']
  },
  {
    name: 'Frontmatter code block',
    input: '<pre><code class="language-yaml">---\ntitle: Test\n---</code></pre>',
    shouldContain: ['---', 'title: Test', '---']
  }
]

// Test cases for MDX validation
const validationTests = [
  {
    name: 'Valid MDX',
    input: '# Title\n\n<Alert type="info">Valid</Alert>',
    expectedValid: true
  },
  {
    name: 'Unclosed component',
    input: '<Alert type="error">Unclosed',
    expectedValid: false
  },
  {
    name: 'Mismatched tags',
    input: '<Alert>Content</FAQ>',
    expectedValid: false
  }
]

// Run tests
async function runTests() {
  console.log('🧪 Running MDX Converter Tests...\n')

  // Test MDX to HTML
  console.log('📝 MDX to HTML Conversion Tests:')
  for (const test of mdxToHtmlTests) {
    try {
      const result = await convertMdxToHtml(test.input)
      
      if (test.expected !== undefined) {
        if (result === test.expected) {
          console.log(`✅ ${test.name}: PASSED`)
        } else {
          console.log(`❌ ${test.name}: FAILED - Expected "${test.expected}", got "${result}"`)
        }
      } else if (test.shouldContain) {
        const passed = test.shouldContain.every(str => result.includes(str))
        if (passed) {
          console.log(`✅ ${test.name}: PASSED`)
        } else {
          console.log(`❌ ${test.name}: FAILED - Missing expected content`)
          console.log(`   Result: ${result.substring(0, 100)}...`)
        }
      }
    } catch (error: any) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`)
    }
  }

  // Test HTML to MDX
  console.log('\n📝 HTML to MDX Conversion Tests:')
  for (const test of htmlToMdxTests) {
    try {
      const result = await convertHtmlToMdx(test.input)
      
      if (test.shouldContain) {
        const passed = test.shouldContain.every(str => result.includes(str))
        if (passed) {
          console.log(`✅ ${test.name}: PASSED`)
        } else {
          console.log(`❌ ${test.name}: FAILED - Missing expected content`)
          console.log(`   Result: ${result}`)
        }
      }
    } catch (error: any) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`)
    }
  }

  // Test validation
  console.log('\n📝 MDX Validation Tests:')
  for (const test of validationTests) {
    try {
      const result = await validateMdx(test.input)
      
      if (result.isValid === test.expectedValid) {
        console.log(`✅ ${test.name}: PASSED`)
      } else {
        console.log(`❌ ${test.name}: FAILED - Expected valid=${test.expectedValid}, got valid=${result.isValid}`)
        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.join(', ')}`)
        }
      }
    } catch (error: any) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`)
    }
  }

  console.log('\n✨ Tests completed!')
}

// Export for use in other test files
export { runTests, mdxToHtmlTests, htmlToMdxTests, validationTests }