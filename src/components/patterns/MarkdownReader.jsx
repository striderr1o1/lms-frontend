import ReactMarkdown from 'react-markdown';

// Do not add rehype-raw. Lesson markdown must not execute HTML.
export default function MarkdownReader({ markdown }) {
  return (
    <div className="markdown-reader">
      <ReactMarkdown>{markdown || ''}</ReactMarkdown>
    </div>
  );
}
