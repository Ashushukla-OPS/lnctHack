import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

const CountdownTimer = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!targetDate) return;
    
    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      const now = new Date();
      const diff = differenceInSeconds(target, now);
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (timeLeft <= 0) {
    return <span className="text-danger font-medium">Expired</span>;
  }

  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex space-x-2 text-sm font-mono text-text-primary">
      {days > 0 && <span>{days}d</span>}
      <span>{hours.toString().padStart(2, '0')}h</span>
      <span>{minutes.toString().padStart(2, '0')}m</span>
      <span>{seconds.toString().padStart(2, '0')}s</span>
    </div>
  );
};

export default CountdownTimer;
