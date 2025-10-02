import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { sessionsService } from '../../services/sessions';
import { Session } from '../../types';
import { Loader } from '../ui/Loader';
import { matchesSearchTerm } from '../../utils/searchUtils';

interface SessionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (session: Session) => void;
}

export function SessionPicker({ isOpen, onClose, onSelect }: SessionPickerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredSessions(
        sessions.filter((s) =>
          matchesSearchTerm(searchTerm, s.name)
        )
      );
    } else {
      setFilteredSessions(sessions);
    }
  }, [sessions, searchTerm]);

  const fetchSessions = async () => {
    try {
      const data = await sessionsService.getAll();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (session: Session) => {
    onSelect(session);
    onClose();
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-picker-title"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="session-picker-title" className="text-xl font-semibold text-gray-900">
            Select Session
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <Loader />
          ) : filteredSessions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sessions found</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelect(session)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{session.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {session.items.length} {session.items.length === 1 ? 'exercise' : 'exercises'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}