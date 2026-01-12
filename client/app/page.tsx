'use client';

import { useState, useRef } from 'react';
import type { Mood, PostMode } from './types';
import { useSocket } from './hooks/useSocket';
import { moodLabelMap, nicknames, avatarEmojis } from './utils/constants';
import { formatTimeAgo, getNicknameFromUserId } from './utils/helpers';

export default function Home() {
  const { topics, setTopics, userId, isLoading, isConnected, error, emit } = useSocket();
  const [newTopicInput, setNewTopicInput] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [selectedMood, setSelectedMood] = useState<Mood>('neutral');
  const [activeMoodFilter, setActiveMoodFilter] = useState<Mood | 'all'>('all');
  const [selectedMode, setSelectedMode] = useState<PostMode>('vent');
  
  const chatContainerRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Actions
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicInput.trim() || !userId) return;
    emit('create_topic', { content: newTopicInput, mood: selectedMood, mode: selectedMode, userId });
    setNewTopicInput('');
    setSelectedMood('neutral');
    setSelectedMode('vent');
  };

  const handleVote = (topicId: string, type: 'agree' | 'disagree') => {
    if (navigator.vibrate) navigator.vibrate(50);
    emit('vote_topic', { topicId, type, userId });
  };

  const handleComment = (e: React.FormEvent, topicId: string) => {
    e.preventDefault();
    const text = commentInputs[topicId];
    if (!text?.trim()) return;
    emit('comment_topic', { topicId, text, userId });
    setCommentInputs(prev => ({ ...prev, [topicId]: '' }));
    
    setTimeout(() => {
      const container = chatContainerRef.current[topicId];
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  };

  const handleDeleteTopic = (topicId: string, ownerId: string) => {
    if (!userId || userId !== ownerId) return;
    const confirmDelete = window.confirm('คุณต้องการลบโพสต์นี้จริง ๆ ไหม?');
    if (!confirmDelete) return;
    emit('delete_topic', { topicId, userId });
    setTopics(prev => prev.filter(t => t._id !== topicId));
  };

  const handleReportTopic = (topicId: string) => {
    if (!userId) return;
    const confirmReport = window.confirm('รายงานโพสต์นี้ว่าไม่เหมาะสมใช่ไหม?');
    if (!confirmReport) return;
    emit('report_topic', { topicId, userId });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-gray-100 p-4 md:p-8 font-sans relative overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] -z-20"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse"></div>

      {/* Header */}
      <div className="max-w-2xl mx-auto mb-12 text-center relative z-10 pt-8">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 mb-2 tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
          VENT<span className="text-cyan-400">SPACE</span>
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto rounded-full mb-4"></div>
        <p className="text-gray-400 font-mono text-sm tracking-widest uppercase opacity-70">
          Anonymous Protocol v2.0 • Encryption Level: Maximum
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className="text-xs text-gray-500 font-mono">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="max-w-2xl mx-auto mb-6 relative z-10">
        <div className="bg-yellow-900/20 border border-yellow-500/40 text-yellow-100 px-4 py-3 rounded-xl text-xs font-mono text-left space-y-1">
          <p className="uppercase tracking-wide text-[11px] text-yellow-300">community guidelines</p>
          <p>- ห้ามโพสต์ข้อมูลส่วนตัว (ชื่อจริง, เบอร์โทร, ที่อยู่, โซเชียลของผู้อื่น)</p>
          <p>- งดการกลั่นแกล้ง, การเหยียด หรือคำพูดที่ทำร้ายผู้อื่น</p>
          <p>- นี่ไม่ใช่บริการฉุกเฉิน หากมีภาวะเสี่ยง โปรดติดต่อหน่วยงานช่วยเหลือใกล้คุณ</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-4 relative z-10">
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Create Post Input */}
      <div className="max-w-2xl mx-auto mb-16 relative z-10 group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
        <div className="relative bg-[#0a0a0f] rounded-2xl p-1">
          <div className="bg-[#121218] rounded-xl p-6">
            <form onSubmit={handleCreateTopic}>
              <textarea
                className="w-full bg-transparent text-gray-100 placeholder-gray-600 text-lg outline-none resize-none mb-4 min-h-[80px]"
                placeholder="ระบายความในใจของคุณที่นี่..."
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                maxLength={500}
              />
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-500 font-mono">
                  {newTopicInput.length}/500
                </span>
              </div>

              {/* Mood Selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                {([
                  { key: 'sad', label: '😢 เหงา', color: 'bg-blue-900/40 text-blue-300 border-blue-500/40' },
                  { key: 'angry', label: '😡 หงุดหงิด', color: 'bg-red-900/40 text-red-300 border-red-500/40' },
                  { key: 'stressed', label: '😰 เครียด', color: 'bg-purple-900/40 text-purple-300 border-purple-500/40' },
                  { key: 'happy', label: '😊 ดีใจ', color: 'bg-green-900/40 text-green-300 border-green-500/40' },
                  { key: 'confused', label: '🤔 สับสน', color: 'bg-yellow-900/40 text-yellow-200 border-yellow-500/40' },
                  { key: 'neutral', label: '🌌 ปกติ', color: 'bg-gray-900/40 text-gray-300 border-gray-500/40' },
                ] as { key: Mood; label: string; color: string }[]).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedMood(m.key)}
                    className={`px-3 py-1 rounded-full border text-xs font-mono transition-all ${
                      selectedMood === m.key
                        ? `${m.color} shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-105`
                        : 'bg-[#14141a] text-gray-500 border-gray-700 hover:border-cyan-500/60 hover:text-cyan-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Mode Selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedMode('vent')}
                  className={`px-3 py-1 rounded-full border text-xs font-mono transition-all flex items-center gap-2 ${
                    selectedMode === 'vent'
                      ? 'bg-gray-100 text-black border-gray-300 shadow-[0_0_12px_rgba(148,163,184,0.5)]'
                      : 'bg-[#14141a] text-gray-500 border-gray-700 hover:border-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>🌌</span>
                  <span>แค่ระบาย</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('advice')}
                  className={`px-3 py-1 rounded-full border text-xs font-mono transition-all flex items-center gap-2 ${
                    selectedMode === 'advice'
                      ? 'bg-cyan-500/90 text-black border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]'
                      : 'bg-[#14141a] text-gray-500 border-gray-700 hover:border-cyan-400 hover:text-cyan-200'
                  }`}
                >
                  <span>🧭</span>
                  <span>อยากได้คำแนะนำ</span>
                </button>
              </div>

              <div className="flex justify-between items-center border-t border-gray-800 pt-4">
                <span className="text-xs text-gray-500 font-mono">ID: {userId.slice(0, 8)}...</span>
                <button
                  type="submit"
                  disabled={!newTopicInput.trim()}
                  className="bg-gray-100 hover:bg-white text-black font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  TRANSMIT
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mood Filter */}
      <div className="max-w-2xl mx-auto mb-6 flex flex-wrap gap-2 justify-start">
        {(['all', 'sad', 'angry', 'stressed', 'happy', 'confused', 'neutral'] as (Mood | 'all')[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setActiveMoodFilter(m)}
            className={`px-3 py-1 rounded-full border text-xs font-mono transition-all ${
              activeMoodFilter === m
                ? 'bg-cyan-900/40 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                : 'bg-[#0b0b10] text-gray-500 border-gray-700 hover:border-cyan-500/60 hover:text-cyan-300'
            }`}
          >
            {m === 'all' ? 'ทั้งหมด' : m}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="max-w-2xl mx-auto space-y-8 pb-20">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
            <p className="text-gray-500 font-mono text-sm">Loading encrypted signals...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && topics.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-50">🌌</div>
            <p className="text-gray-500 font-mono text-lg mb-2">No signals detected yet...</p>
            <p className="text-gray-600 text-sm">Be the first to share your thoughts</p>
          </div>
        )}

        {topics
          .filter((topic) => !topic.deleted)
          .filter((topic) => (activeMoodFilter === 'all' ? true : topic.mood === activeMoodFilter))
          .map((topic) => {
          // Check Voting Status
          const myVote = topic.votes.find(v => v.userId === userId)?.type;

          return (
            <div key={topic._id} className="bg-[#0e0e12] border border-gray-800/50 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors duration-300 shadow-xl">
              
              {/* Card Content */}
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-mono text-gray-500">
                      {formatTimeAgo(topic.createdAt)}
                    </p>
                    {topic.userId === userId && (
                      <p className="text-[10px] font-mono text-cyan-500 mt-1">
                        YOU
                      </p>
                    )}
                    {topic.userId !== userId && (
                      <p className="text-[10px] font-mono text-gray-500 mt-1">
                        {(() => {
                          const { name } = getNicknameFromUserId(topic.userId, nicknames, avatarEmojis);
                          return `@${name}`;
                        })()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded-full text-[10px] font-mono tracking-wide border bg-[#101018] text-gray-300 border-gray-700"
                    >
                      {moodLabelMap[topic.mood]}
                    </span>
                    {topic.reportCount > 0 && (
                      <span className="text-[10px] font-mono text-red-400 bg-red-900/20 border border-red-500/40 px-2 py-0.5 rounded-full">
                        {topic.reportCount} reports
                      </span>
                    )}
                    {topic.userId === userId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(topic._id, topic.userId)}
                        className="text-[11px] font-mono text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/40 hover:border-red-400/80 bg-red-900/10 hover:bg-red-900/20 transition-colors"
                      >
                        DELETE
                      </button>
                    )}
                    {topic.userId !== userId && (
                      <button
                        type="button"
                        onClick={() => handleReportTopic(topic._id)}
                        className="text-[11px] font-mono text-gray-500 hover:text-orange-300 px-2 py-1 rounded border border-gray-700 hover:border-orange-400 bg-[#111118] hover:bg-[#1c1c24] transition-colors"
                      >
                        REPORT
                      </button>
                    )}
                  </div>
                </div>

                {/* Mode Badge & Vote / Comment Summary */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    {topic.mode === 'vent' ? (
                      <span className="px-2 py-1 rounded-full border border-gray-600 bg-[#0b0b10] text-gray-300 flex items-center gap-1">
                        <span>🌌</span>
                        <span>JUST VENTING</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full border border-cyan-400 bg-cyan-500/10 text-cyan-200 flex items-center gap-1">
                        <span>🧭</span>
                        <span>ASKING FOR ADVICE</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 flex items-center gap-3">
                    <span>👍 {topic.agreeCount}</span>
                    <span>👎 {topic.disagreeCount}</span>
                    <span>💬 {topic.comments.length}</span>
                  </div>
                </div>

                {/* Report warning (soft) + Content */}
                {topic.reportCount >= 3 && (
                  <div className="bg-red-900/10 border border-red-500/40 rounded-lg p-3 mb-3 text-[11px] text-red-200 font-mono">
                    โพสต์นี้มีรายงานหลายครั้งว่าอาจไม่เหมาะสม โปรดใช้วิจารณญาณในการอ่าน
                  </div>
                )}

                <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-6 break-words">
                  {topic.content}
                </p>
                
                {/* Vote Controls */}
                <div className="flex gap-3">
                  {/* Agree Button */}
                  <button
                    onClick={() => handleVote(topic._id, 'agree')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border ${
                      myVote === 'agree'
                        ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                        : 'bg-[#181820] border-transparent text-gray-500 hover:bg-[#20202a] hover:text-cyan-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="font-bold text-lg">{topic.agreeCount}</span>
                  </button>

                  {/* Disagree Button */}
                  <button
                    onClick={() => handleVote(topic._id, 'disagree')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border ${
                      myVote === 'disagree'
                        ? 'bg-red-900/30 border-red-500 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.2)]'
                        : 'bg-[#181820] border-transparent text-gray-500 hover:bg-[#20202a] hover:text-red-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="font-bold text-lg">{topic.disagreeCount}</span>
                  </button>
                </div>
              </div>

              {/* Comments Area */}
              <div className="bg-[#050508] border-t border-gray-800 p-4">
                <div 
                  ref={el => { chatContainerRef.current[topic._id] = el; }}
                  className="max-h-[200px] overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-2"
                >
                  {topic.comments.length === 0 && (
                    <div className="text-center py-4 text-gray-700 text-sm">No signals detected yet...</div>
                  )}
                  {topic.comments.map((comment, idx) => {
                    const isMe = comment.userId === userId;
                    const { name, emoji } = getNicknameFromUserId(comment.userId, nicknames, avatarEmojis);
                    return (
                      <div key={idx} className="flex gap-3 text-sm group animate-fade-in-up">
                        <div className="w-1 h-auto bg-gray-800 rounded-full group-hover:bg-cyan-500 transition-colors"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                              <span>{emoji}</span>
                              <span>{isMe ? 'YOU' : name}</span>
                            </span>
                            <span className="text-[10px] text-gray-700 font-mono">
                              {formatTimeAgo(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form 
                  onSubmit={(e) => handleComment(e, topic._id)}
                  className="relative"
                >
                  <input
                    type="text"
                    className="w-full bg-[#121218] text-gray-300 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 transition-all placeholder-gray-700"
                    placeholder="Reply to encrypted message..."
                    value={commentInputs[topic._id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [topic._id]: e.target.value }))}
                    maxLength={300}
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white transition-colors"
                  >
                    Submit
                  </button>
                </form>
              </div>

            </div>
          );
        })}
      </div>

    </main>
  );
}