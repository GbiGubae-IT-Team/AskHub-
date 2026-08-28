import { X, Users2, ShieldCheck, DoorOpen } from 'lucide-react';

export interface Room {
  id: number;
  name: string;
  description: string;
  members: number;
  category: string;
  staffVerified: boolean;
}

interface JoinRoomsModalProps {
  rooms: Room[];
  joinedIds: Set<number>;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (room: Room) => void;
}

export function JoinRoomsModal({ rooms, joinedIds, isOpen, onClose, onJoin }: JoinRoomsModalProps) {
  const available = rooms.filter(r => !joinedIds.has(r.id));
  const joined = rooms.filter(r => joinedIds.has(r.id));

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal — bottom sheet on mobile, anchored floating card on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col sm:inset-auto sm:bottom-24 sm:right-6 sm:left-auto sm:w-96 sm:rounded-2xl sm:max-h-[70vh]">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <DoorOpen size={18} className="text-[#2D6DB5]" />
            <h2 className="font-bold text-gray-900">Active Rooms</h2>
            {available.length > 0 && (
              <span className="bg-[#F5A623] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {available.length} new
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Room list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">

          {/* Unjoined rooms */}
          {available.map(room => (
            <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{room.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{room.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users2 size={12} />
                      {room.members} members
                    </span>
                    {room.staffVerified && (
                      <span className="flex items-center gap-1 text-[#2D6DB5]">
                        <ShieldCheck size={12} />
                        Staff verified
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onJoin(room)}
                  className="flex-shrink-0 bg-[#2D6DB5] hover:bg-[#245A94] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  JOIN
                </button>
              </div>
              <span className="inline-block mt-2 bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded">
                {room.category}
              </span>
            </div>
          ))}

          {/* Already joined rooms */}
          {joined.length > 0 && (
            <>
              {available.length > 0 && (
                <p className="text-xs text-gray-400 font-medium pt-1">Already joined</p>
              )}
              {joined.map(room => (
                <div
                  key={room.id}
                  onClick={() => onJoin(room)}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-600 text-sm leading-snug mb-1">{room.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users2 size={12} />
                          {room.members} members
                        </span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-lg">
                      Joined ✓
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {rooms.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No active rooms at the moment.</p>
          )}
        </div>
      </div>
    </>
  );
}
