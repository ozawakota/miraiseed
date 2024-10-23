import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface CodeBlockProps {
  language: string
  code: string
}

export default function CodeBlock({ language, code }: CodeBlockProps = { language: 'javascript', code: '// Your code here' }) {
  return (
    <div className="rounded-md overflow-hidden">
      <SyntaxHighlighter 
        language={language} 
        style={dracula}
        customStyle={{
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}