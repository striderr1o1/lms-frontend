import { useState } from 'react';
import CourseCover from '../components/patterns/CourseCover.jsx';
import Avatar from '../components/primitives/Avatar.jsx';
import Badge from '../components/primitives/Badge.jsx';
import Button from '../components/primitives/Button.jsx';
import Card from '../components/primitives/Card.jsx';
import Combobox from '../components/primitives/Combobox.jsx';
import ConfirmDialog from '../components/primitives/ConfirmDialog.jsx';
import Dialog from '../components/primitives/Dialog.jsx';
import EmptyState from '../components/primitives/EmptyState.jsx';
import Input from '../components/primitives/Input.jsx';
import PasswordInput from '../components/primitives/PasswordInput.jsx';
import Skeleton from '../components/primitives/Skeleton.jsx';
import StatCard from '../components/primitives/StatCard.jsx';
import Tabs from '../components/primitives/Tabs.jsx';
import ThemeToggle from '../components/primitives/ThemeToggle.jsx';
import { useToast } from '../components/primitives/Toast.jsx';

const PEOPLE = [
  { value: 'a', label: 'ada' },
  { value: 'b', label: 'blair' },
];

export default function DesignPage() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [picked, setPicked] = useState([]);
  const [tab, setTab] = useState('one');
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="shell-main design-page">
      <header className="page-header">
        <h1 className="page-title">Design system</h1>
        <p className="page-context">Dev gallery. Use the theme toggle to check light and dark.</p>
        <ThemeToggle />
      </header>
      <section className="page-section stack">
        <h2 className="section-title">Buttons</h2>
        <div className="card-actions">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
        <Input label="Name" placeholder="Course name" />
        <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="card-actions">
          <Badge tone="active">Active</Badge>
          <Badge tone="inactive">Inactive</Badge>
          <Badge tone="pending">Pending</Badge>
          <Badge tone="enrolled">Enrolled</Badge>
        </div>
        <Card>
          <div className="card-teacher">
            <Avatar name="Northstar" />
            <span>Avatar initials</span>
          </div>
        </Card>
        <Tabs
          label="Sample tabs"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'one', label: 'One', content: <p>First panel</p> },
            { value: 'two', label: 'Two', content: <p>Second panel</p> },
          ]}
        />
        <Combobox label="People" multiple options={PEOPLE} value={picked} onChange={setPicked} />
        <div className="card-actions">
          <Button variant="secondary" onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>Open confirm</Button>
          <Button variant="secondary" onClick={() => toast({ message: 'Saved' })}>Toast</Button>
        </div>
        <div className="kpi-row">
          <StatCard label="Courses" value={12} />
          <Skeleton />
          <EmptyState title="Nothing here yet." />
        </div>
        <CourseCover course={{ id: 'design-cover', name: 'Studio' }} size="card" />
      </section>
      <Dialog open={dialog} title="Dialog" onClose={() => setDialog(false)}>
        <p className="dialog-copy">A sample dialog.</p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setDialog(false)}>Close</Button>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirm}
        title="Type the name"
        description="This is a sample confirm."
        matchText="Studio"
        confirmLabel="Delete"
        tone="danger"
        onClose={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
      />
    </div>
  );
}
