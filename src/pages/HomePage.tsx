import { Link } from 'react-router-dom';

/* Thin page composition: import -> render. */

export function HomePage() {
  return (
    <section>
      <h1>FSAA — Feature-Sliced Atomic Architecture (Vite)</h1>
      <p>
        FSD + Atomic Design with the missing decision rules: <em>where does UI go?</em>
      </p>
      <ul>
        <li>
          <Link to="/projects">Projects overview</Link> — feature owns business columns
        </li>
        <li>
          <Link to="/orders">Orders overview</Link> — second feature, same molecules, zero coupling
        </li>
      </ul>
      <p style={{ color: '#64748b' }}>
        Same layers, same ESLint boundaries as the Next.js template — only the pages layer differs.
      </p>
    </section>
  );
}