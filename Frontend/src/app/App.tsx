import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import { DoorOpen, ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuestionCard } from './components/QuestionCard';
import { HotQuestions } from './components/HotQuestions';
import { StaffPage } from './pages/StaffPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { ManageNotificationsPage } from './pages/ManageNotificationsPage';
import { RoomPage } from './pages/RoomPage';
import { AuthPage } from './pages/AuthPage';
import { JoinRoomsModal, Room } from './components/JoinRoomsModal';
import { apiFetch, getAuthToken, getCurrentUser, removeAuthToken } from './api';

function HomePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string | number>>(new Set());
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

    const savedIds = JSON.parse(localStorage.getItem('joinedRooms') || '[]');
    setJoinedRoomIds(new Set(savedIds));
  }, []);

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
      setIsRoomModalOpen(false);
      navigate(`/rooms/${room.id}`);
    } catch (err: any) {
      console.error("Failed to join room:", err);
      throw err;
    }
  };

  return (
    <div className="size-full flex flex-col bg-gray-50">
      <Header
        onGoToStaff={() => navigate('/staff')}
        onGoToSignIn={() => navigate('/signin')}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
      />

      {/* Scripture banner */}
      <div className="w-full bg-[#1a4f8a] text-center px-4 py-2">
        <p className="text-white/80 text-xs italic tracking-wide">
          ምክርን ስማ፥ ተግሣጽንም ተቀበል በፍጻሜህ ጠቢብ ትሆን ዘንድ። &nbsp;
          <span className="not-italic font-medium text-white/60">መጽሐፈ ምሳሌ 19 ፥ 20</span>
        </p>
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Center Content - Question Cards */}
          <div className="flex-1 min-w-0">
            {questions
              ?.filter((q) => {
                const isApproved = q.status === "APPROVED" || q.status === "ANSWERED";
                if (!isApproved) return false;
                if (activeCategory === 'All') return true;
                return q.category?.toLowerCase() === activeCategory.toLowerCase();
              })
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
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#2D6DB5] hover:bg-[#245A94] text-white font-bold px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
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

function ProtectedStaffRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  const user = getCurrentUser();
  if (!user || !['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-100 text-[#E07B2A] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Staff Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            The staff moderation dashboard is exclusively available to authenticated and approved staff chaplains and administrators. Your current account does not have staff permissions.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                removeAuthToken();
                navigate('/signin');
              }}
              className="w-full bg-[#2D6DB5] hover:bg-[#245A94] text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={16} />
              <span>Sign In with Staff Account</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedSuperAdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  const user = getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-100 text-[#E07B2A] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Super Admin Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            This dashboard is exclusively available to Super Administrators.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                removeAuthToken();
                navigate('/signin');
              }}
              className="w-full bg-[#2D6DB5] hover:bg-[#245A94] text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={16} />
              <span>Sign In with Super Admin Account</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<AuthPage mode="login" />} />
      <Route path="/login" element={<Navigate to="/signin" replace />} />
      <Route path="/singin" element={<Navigate to="/signin" replace />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
      <Route
        path="/staff"
        element={
          <ProtectedStaffRoute>
            <StaffPage
              onBack={() => navigate('/')}
              onGoToRoom={(room) => room?.id && navigate(`/rooms/${room.id}`)}
            />
          </ProtectedStaffRoute>
        }
      />
      <Route
        path="/superadmin"
        element={
          <ProtectedSuperAdminRoute>
            <SuperAdminPage onBack={() => navigate('/')} />
          </ProtectedSuperAdminRoute>
        }
      />
      <Route
        path="/superadmin/notifications"
        element={
          <ProtectedSuperAdminRoute>
            <ManageNotificationsPage onBack={() => navigate('/superadmin')} />
          </ProtectedSuperAdminRoute>
        }
      />
      <Route path="/rooms/:roomId" element={<RoomPage onBack={() => navigate('/')} />} />
      <Route path="/room/:roomId" element={<RoomPage onBack={() => navigate('/')} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}