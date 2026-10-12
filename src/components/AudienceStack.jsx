import Icon from './ui/Icon';

// Shows exactly who can read a complaint, and who cannot.
export default function AudienceStack({ audience, hidden = [] }) {
  return (
    <div className="audience">
      <ul className="audience-pills">
        {audience.map((a, i) => (
          <li key={a} className={`audience-pill shade-${Math.min(i, 2)}`}>
            <Icon name="check" size={15} /> {a}
          </li>
        ))}
        {hidden.map((a) => (
          <li key={a} className="audience-pill is-hidden">
            <Icon name="eyeOff" size={15} /> {a}
          </li>
        ))}
      </ul>
    </div>
  );
}
