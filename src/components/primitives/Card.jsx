export default function Card({ className = '', children, as: Tag = 'article' }) {
  return <Tag className={['card', className].filter(Boolean).join(' ')}>{children}</Tag>;
}
