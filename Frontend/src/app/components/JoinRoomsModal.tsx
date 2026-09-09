import { useState } from 'react';
import { X, Users2, ShieldCheck, DoorOpen, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface Room {
  id: string | number;
  name: string;
  description?: string | null;
  members?: number;
  category?: string | null;
  staffVerified?: boolean;
  code?: string | null;
}

interface JoinRoomsModalProps {
  rooms: Room[];
  joinedIds: Set<string | number>;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (room: Room, code?: string) => Promise<void> | void;
}

export function JoinRoomsModal({ rooms, joinedIds, isOpen, onClose, onJoin }: JoinRoomsModalProps) {
  const { t } = useLanguage();
  const [targetRoom, setTargetRoom] = useState<Room | null>(null);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct code join state
  const [directCode, setDirectCode] = useState('');

  if (!isOpen) return null;

  const available = rooms.filter(r => !joinedIds.has(r.id));
  const joined = rooms.filter(r => joinedIds.has(r.id));

  const handleStartJoin = (room: Room) => {
    setTargetRoom(room);
    setPasscode('');
    setErrorMsg('');
  };

  const handleCancelPasscode = () => {
    setTargetRoom(null);
    setPasscode('');
    setErrorMsg('');
  };

  const handleSubmitPasscode = async () => {
    if (!targetRoom) return;
    if (passcode.trim().length !== 6) {
      setErrorMsg(t('roomsModal.err.validKey'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onJoin(targetRoom, passcode.trim());
      setTargetRoom(null);
      setPasscode('');
    } catch (err: any) {
      setErrorMsg(err?.message || t('roomsModal.err.invalidKey'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectCodeSubmit = async () => {
    const code = directCode.trim();
    if (code.length !== 6) {
      setErrorMsg(t('roomsModal.err.enterKey'));
      return;
    }

    // Check if matching room exists in rooms list (this works for staff)
    const foundRoom = rooms.find(r => r.code === code);
    if (foundRoom) {
      handleStartJoin(foundRoom);
      setPasscode(code);
      return;
    }

    // For students, the backend strips the 'code' field for security.
    // We can attempt to join the available rooms with the provided code.
    setIsSubmitting(true);
    setErrorMsg('');
    
    for (const r of available) {
      try {
        await onJoin(r, code);
        setDirectCode('');
        setIsSubmitting(false);
        return; // Success! onJoin handles navigation and closing the modal.
      } catch (err) {
        // Incorrect code for this room, try the next one
      }
    }
    
    setIsSubmitting(false);
    setErrorMsg(t('roomsModal.err.notFound'));
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={onClose} />

      {/* Modal — bottom sheet on mobile, anchored floating card on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col sm:inset-auto sm:bottom-20 sm:right-6 sm:left-auto sm:w-[420px] sm:rounded-2xl sm:max-h-[75vh]">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {targetRoom ? (
              <button
                onClick={handleCancelPasscode}
                className="text-gray-400 hover:text-gray-700 p-1 -ml-1 transition-colors"
                title={t('roomsModal.backHint')}
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <DoorOpen size={20} className="text-[#2D6DB5]" />
            )}
            <h2 className="font-bold text-gray-900 text-base">
              {targetRoom ? t('roomsModal.titleEnter') : t('roomsModal.titleActive')}
            </h2>
            {!targetRoom && available.length > 0 && (
              <span className="bg-[#F5A623] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {available.length} {t('roomsModal.new')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {targetRoom ? (
          /* Step 2: 6-Digit Passcode Prompt */
          <div className="p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="bg-blue-50/70 border border-blue-100/80 rounded-xl p-4 mb-5">
                <span className="text-[11px] font-semibold text-[#2D6DB5] uppercase tracking-wider block mb-1">
                  {t('roomsModal.joiningRoom')}
                </span>
                <h3 className="font-bold text-gray-900 text-base mb-1">{targetRoom.name}</h3>
                {targetRoom.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{targetRoom.description}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-[#E07B2A]" />
                  {t('roomsModal.enterKey')}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {t('roomsModal.askKey')}
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={passcode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPasscode(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center text-2xl font-bold tracking-[0.4em] py-3 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#2D6DB5] focus:ring-4 focus:ring-blue-50 transition-all text-gray-800 placeholder:text-gray-300 placeholder:tracking-normal"
                />

                {errorMsg && (
                  <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs text-center font-medium">
                    {errorMsg}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={handleCancelPasscode}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('roomsModal.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitPasscode}
                disabled={passcode.trim().length !== 6 || isSubmitting}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#2D6DB5] hover:bg-[#235892] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{t('roomsModal.verifying')}</span>
                  </>
                ) : (
                  <span>{t('roomsModal.verifyJoin')}</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Room List with 6-digit key option */
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
            {/* Quick direct join bar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-3">
              <span className="text-[11px] font-semibold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                <KeyRound size={13} className="text-[#2D6DB5]" />
                {t('roomsModal.haveKey')}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={directCode}
                  onChange={(e) => setDirectCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('roomsModal.eg')}
                  className="flex-1 text-xs py-1.5 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D6DB5] tracking-wider text-gray-800"
                />
                <button
                  type="button"
                  onClick={handleDirectCodeSubmit}
                  disabled={directCode.trim().length !== 6}
                  className="bg-[#2D6DB5] hover:bg-[#235892] disabled:bg-gray-300 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t('roomsModal.join')}
                </button>
              </div>
              {errorMsg && (
                <p className="text-[11px] text-rose-500 font-medium mt-1.5">{errorMsg}</p>
              )}
            </div>

            {/* Unjoined rooms */}
            {available.map(room => (
              <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{room.name}</h3>
                    {room.description && (
                      <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{room.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users2 size={12} />
                        {room.members || 0} {t('roomsModal.members')}
                      </span>
                      {room.staffVerified && (
                        <span className="flex items-center gap-1 text-[#2D6DB5]">
                          <ShieldCheck size={12} />
                          {t('roomsModal.staffVerified')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartJoin(room)}
                    className="flex-shrink-0 bg-[#2D6DB5] hover:bg-[#245A94] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound size={12} />
                    {t('roomsModal.joinUpper')}
                  </button>
                </div>
                {room.category && (
                  <span className="inline-block mt-2 bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded">
                    {room.category}
                  </span>
                )}
              </div>
            ))}

            {/* Already joined rooms */}
            {joined.length > 0 && (
              <>
                {available.length > 0 && (
                  <p className="text-xs text-gray-400 font-medium pt-2 pb-0.5">{t('roomsModal.alreadyJoinedTitle')}</p>
                )}
                {joined.map(room => (
                  <div
                    key={room.id}
                    onClick={() => onJoin(room)}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-700 text-sm leading-snug mb-1">{room.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users2 size={12} />
                            {room.members || 0} {t('roomsModal.members')}
                          </span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-lg">
                        {t('roomsModal.joinedMark')}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {rooms.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">{t('roomsModal.noRooms')}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
