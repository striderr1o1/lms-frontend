import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { asCourseList, getFeaturedCourses, getPublicStats, readStat } from '../api/public.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { homePath } from '../auth/session.js';
import CompassMark from '../components/brand/CompassMark.jsx';
import Starfield from '../components/brand/Starfield.jsx';
import Reveal from '../components/motion/Reveal.jsx';
import CourseCover from '../components/patterns/CourseCover.jsx';
import Button from '../components/primitives/Button.jsx';
import CountUp from '../components/primitives/CountUp.jsx';
import Tabs from '../components/primitives/Tabs.jsx';

const HERO_WORDS = ['Learn', 'with', 'direction.'];
const MOCKS = [
  { id: 'landing-a', name: 'Python' },
  { id: 'landing-b', name: 'Databases' },
  { id: 'landing-c', name: 'Design' },
];

const FEATURES = [
  {
    value: 'students',
    label: 'Students',
    cards: [
      { title: 'Only your courses', body: 'You see the courses an admin assigned. There is no open catalog to wander.' },
      { title: 'Lessons in order', body: 'Open a course, pick a lesson, and watch the video beside the notes.' },
      { title: 'Come back later', body: 'The last course you opened is waiting on your home page.' },
    ],
  },
  {
    value: 'teachers',
    label: 'Teachers',
    cards: [
      { title: 'Assigned courses', body: 'Open the courses an admin gave you. You do not create or rename them.' },
      { title: 'Lesson editor', body: 'Write notes, paste a YouTube link, or upload a video.' },
      { title: 'Student list', body: 'See who is assigned. Adding and removing people stays with the admin.' },
    ],
  },
  {
    value: 'admins',
    label: 'Admins',
    cards: [
      { title: 'Create courses', body: 'Name a course, choose the teacher, assign students, and set a cover.' },
      { title: 'People', body: 'Look up teachers and students, and approve new admin accounts.' },
      { title: 'Careful deletes', body: 'Deactivate with a short confirm. Delete only after you type the course name.' },
    ],
  },
];

const STEPS = [
  { title: 'Get assigned', body: 'An admin places a student in a course and a teacher on it.' },
  { title: 'Learn', body: 'Open a lesson, watch the video, and read the notes.' },
  { title: 'Return', body: 'Assigned courses stay on the list until an admin changes them.' },
];

const FAQS = [
  {
    q: 'Can students enroll themselves?',
    a: 'No. An admin assigns each student to a course. If nothing is assigned, the course list says so.',
  },
  {
    q: 'Can teachers create courses?',
    a: 'No. Teachers open assigned courses, read the student list, and edit lessons.',
  },
  {
    q: 'How do I sign in?',
    a: 'Use the email, password, and role for the account. The sign-in field is email, not a username.',
  },
  {
    q: 'What if a course has no lessons yet?',
    a: 'The card shows a disabled “No lessons yet” chip instead of Continue.',
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <h3>
        <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
          {question}
        </button>
      </h3>
      <div className={open ? 'faq-panel is-open' : 'faq-panel'}>
        <div className="faq-panel-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { profile, ready } = useAuth();
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [showFeatured, setShowFeatured] = useState(false);
  const [roleTab, setRoleTab] = useState('students');
  const year = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;
    getPublicStats()
      .then((data) => {
        if (cancelled) return;
        const next = {
          courses: readStat(data, 'courses'),
          lessons: readStat(data, 'lessons'),
          learners: readStat(data, 'learners'),
        };
        if (next.courses + next.lessons + next.learners > 0) setStats(next);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    getFeaturedCourses()
      .then((data) => {
        if (cancelled) return;
        const list = asCourseList(data).filter((course) => course && course.id && course.name);
        setFeatured(list);
        setShowFeatured(list.length > 0);
      })
      .catch(() => {
        if (!cancelled) setShowFeatured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="landing surface-night">
      <header className="landing-nav">
        <Link className="brand" to="/">
          <CompassMark />
          <span>Northstar</span>
        </Link>
        <nav className="landing-anchors" aria-label="Page">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#courses">Courses</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-nav-actions">
          {!ready ? null : profile ? (
            <Button to={homePath(profile.role)}>Go to dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" to="/login">Sign in</Button>
              <Button to="/signup">Get started</Button>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <Starfield />
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
        <div className="landing-hero-copy">
          <h1 className="landing-headline">
            {HERO_WORDS.map((word, index) => (
              <span key={word} style={{ '--i': index }}>{word} </span>
            ))}
          </h1>
          <p>A quiet place for assigned courses, lessons, and the people who teach them.</p>
          <div className="landing-cta-row">
            {!ready ? null : profile ? (
              <Button to={homePath(profile.role)}>Go to dashboard</Button>
            ) : (
              <Button to="/signup">Get started</Button>
            )}
            <a className="button button-secondary" href="#courses">Explore courses</a>
          </div>
        </div>
        <div className="hero-stage" aria-hidden="true">
          <div className="compass-ring" />
          {MOCKS.map((course) => (
            <article className="hero-float-card" key={course.id}>
              <CourseCover course={course} size="card" />
              <h2>{course.name}</h2>
            </article>
          ))}
        </div>
      </section>

      {stats ? (
        <Reveal className="trust-strip" as="section" aria-label="School totals">
          {[
            ['Courses', stats.courses],
            ['Lessons', stats.lessons],
            ['Learners', stats.learners],
          ].map(([label, value]) => (
            <div key={label}>
              <strong className="tabular"><CountUp value={value} /></strong>
              <span>{label}</span>
            </div>
          ))}
        </Reveal>
      ) : null}

      <Reveal className="landing-section" id="features">
        <h2>Built for each role</h2>
        <Tabs
          label="Features by role"
          value={roleTab}
          onChange={setRoleTab}
          tabs={FEATURES.map((feature) => ({
            value: feature.value,
            label: feature.label,
            content: (
              <div className="feature-grid">
                {feature.cards.map((card) => (
                  <article className="feature-card" key={card.title}>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            ),
          }))}
        />
      </Reveal>

      <Reveal className="landing-section" id="how">
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="step-index tabular">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      {showFeatured ? (
        <Reveal className="landing-section" id="courses">
          <h2>Featured courses</h2>
          <div className="featured-row">
            {featured.map((course) => (
              <Link className="featured-card" key={course.id} to="/login">
                <CourseCover course={course} size="card" />
                <h3>{course.name}</h3>
                <p>{course.teacher_display_name || 'Teacher'} · {course.lesson_count ?? 0} lessons</p>
              </Link>
            ))}
          </div>
        </Reveal>
      ) : <div id="courses" />}

      <Reveal className="landing-section">
        <h2>What people might say</h2>
        <aside className="placeholder-note">
          <strong>Placeholder</strong>
          <p>TODO: replace with real feedback. These lines are sample copy for the demo. They are not quotes from real people.</p>
        </aside>
        <div className="quote-grid">
          <blockquote>
            <p>Sample line: the course list only shows what was assigned to me.</p>
            <footer>Placeholder — not a real person</footer>
          </blockquote>
          <blockquote>
            <p>Sample line: I open a lesson, press play, and read the notes beside it.</p>
            <footer>Placeholder — not a real person</footer>
          </blockquote>
        </div>
      </Reveal>

      <Reveal className="landing-section" id="faq">
        <h2>FAQ</h2>
        {FAQS.map((item) => <FaqItem key={item.q} question={item.q} answer={item.a} />)}
      </Reveal>

      <section className="cta-band">
        <h2>Ready when you are.</h2>
        <Button to={profile && ready ? homePath(profile.role) : '/signup'}>
          {profile ? 'Go to dashboard' : 'Create your account'}
        </Button>
      </section>

      <footer className="landing-footer">
        <Link className="brand" to="/">
          <CompassMark />
          <span>Northstar</span>
        </Link>
        <nav aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <Link to="/login">Sign in</Link>
          <Link to="/signup">Sign up</Link>
        </nav>
        <p>© {year} Northstar</p>
      </footer>
    </div>
  );
}
