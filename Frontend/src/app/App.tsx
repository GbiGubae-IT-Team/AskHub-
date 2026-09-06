import { useState, useEffect } from 'react';
import { DoorOpen } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuestionCard } from './components/QuestionCard';
import { HotQuestions } from './components/HotQuestions';
import { StaffPage, StaffRoom } from './pages/StaffPage';
import { RoomPage } from './pages/RoomPage';
import { JoinRoomsModal, Room } from './components/JoinRoomsModal';
import { apiFetch } from './api';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'staff' | 'room'>('home');
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string | number>>(new Set());
  const [activeRoom, setActiveRoom] = useState<Room | StaffRoom | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  const loadRooms = () => {
    apiFetch("/rooms")
      .then(res => setRooms(res?.data?.items || []))
      .catch(console.error);
  };

  const loadQuestions = () => {
    apiFetch("/questions?roomId=null")
      .then(res => setQuestions(res?.data?.items || []))
      .catch(console.error);
  };

  useEffect(() => {
    loadRooms();
    loadQuestions();

    // Initialize joined rooms from local storage
    const savedIds = JSON.parse(localStorage.getItem('joinedRooms') || '[]');
    setJoinedRoomIds(new Set(savedIds));
  }, []);

  const hasUnjoinedRooms = rooms.some(r => !joinedRoomIds.has(r.id));

  const handleJoinRoom = async (room: Room, code?: string) => {
    try {
      if (!joinedRoomIds.has(room.id)) {
        await apiFetch(`/rooms/${room.id}/join`, {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        const newJoined = new Set(joinedRoomIds).add(room.id);
        setJoinedRoomIds(newJoined);
        localStorage.setItem('joinedRooms', JSON.stringify(Array.from(newJoined)));
      }
      setActiveRoom(room);
      setIsRoomModalOpen(false);
      setCurrentPage('room');
    } catch (err: any) {
      console.error("Failed to join room:", err);
      throw err;
    }
  };

  if (currentPage === 'staff') {
    return (
      <StaffPage
        onBack={() => {
          setCurrentPage('home');
          loadRooms();
          loadQuestions();
        }}
        onGoToRoom={(room) => {
          if (room) setActiveRoom(room);
          setCurrentPage('room');
        }}
      />
    );
  }

  if (currentPage === 'room') {
    return (
      <RoomPage
        onBack={() => {
          setCurrentPage('home');
          loadRooms();
          loadQuestions();
        }}
        activeRoom={activeRoom}
      />
    );
  }

  return (
    <div className="size-full flex flex-col bg-gray-50">
      <Header onGoToStaff={() => setCurrentPage('staff')} onGoToRoom={() => setCurrentPage('room')} />

      {/* Scripture banner */}
      <div className="w-full bg-[#1a4f8a] text-center px-4 py-2">
        <p className="text-white/80 text-xs italic tracking-wide">
          ምክርን ስማ፥ ተግሣጽንም ተቀበል በፍጻሜህ ጠቢብ ትሆን ዘንድ። &nbsp;
          <span className="not-italic font-medium text-white/60">መጽሐፈ ምሳሌ 19 ፥ 20</span>
        </p>
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Center Content - Question Cards */}
          <div className="flex-1 min-w-0">
            {questions
              ?.filter((q) => q.status === "APPROVED" || q.status === "ANSWERED")
              .map((question) => (
                <QuestionCard
                  key={question.id}
                  category={question.category}
                  title={question.title}
                  preview={question.content}
                  status={question.status}
                  isAnswered={question.status === "ANSWERED"}
                  answers={question.answers}
                />
              ))}
          </div>

          {/* Right Sidebar - Hot Questions */}
          <HotQuestions />
        </div>
      </main>

      {/* Floating Join Rooms button */}
      {rooms.length > 0 && (
        <button
          onClick={() => setIsRoomModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#2D6DB5] hover:bg-[#245A94] text-white font-bold px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <DoorOpen size={18} />
          <span className="text-sm">Join Rooms</span>
          {rooms.filter(r => !joinedRoomIds.has(r.id)).length > 0 && (
            <span className="bg-[#F5A623] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {rooms.filter(r => !joinedRoomIds.has(r.id)).length}
            </span>
          )}
        </button>
      )}

      {/* Join Rooms Modal */}
      <JoinRoomsModal
        rooms={rooms}
        joinedIds={joinedRoomIds}
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onJoin={handleJoinRoom}
      />
    </div>
  );
}