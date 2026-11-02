import ReactMarkdown from 'react-markdown';

// Do not add rehype-raw. Lesson markdown must not execute HTML.
export default function MarkdownBody({ markdown }) {
  return (
    <div className="markdown">
      <ReactMarkdown>{markdown || ''}</ReactMarkdown>
    </div>
  );
}
