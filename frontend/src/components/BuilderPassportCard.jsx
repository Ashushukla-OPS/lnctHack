import { UserCircleIcon, StarIcon } from '@heroicons/react/24/solid';
import Badge from './Badge';

const BuilderPassportCard = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-full border border-border object-cover"
          />
        ) : (
          <UserCircleIcon className="w-16 h-16 text-text-muted" />
        )}
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-text-primary">{user.name}</h3>
          <p className="text-text-muted text-sm">{user.email}</p>
          
          {user.bio && (
            <p className="mt-2 text-sm text-text-primary/80 line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {user.topLanguages?.map((lang, idx) => (
          <Badge key={idx} variant="primary">
            {lang}
          </Badge>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div className="flex flex-col">
          <span className="text-xs text-text-muted uppercase tracking-wider">GitHub</span>
          <span className="text-sm font-medium text-text-primary">
            {user.githubId ? 'Connected' : 'Not linked'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-text-muted uppercase tracking-wider">Score</span>
          <div className="flex items-center gap-1 text-sm font-medium text-warning">
            <StarIcon className="w-4 h-4" />
            <span>{user.score?.totalScore || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderPassportCard;
