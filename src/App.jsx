import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import {
  CalendarDays, Clock, Download, FileText, Filter, MapPin, MessageSquareText,
  PackageCheck, Plus, Search, Ship, Trash2, UserRound, Users, Wrench, AlertTriangle
} from "lucide-react";
import "./style.css";

const STORAGE_KEY = "kct_schedule_events_v1";

const sampleEvents = [
  { id: 1, type: "AS", title: "동해해경 레이더 점검", customer: "동해지방해양경찰청", location: "동해항", owner: "최경호", start: "2026-04-27T09:00", end: "2026-04-27T17:00", priority: "긴급", memo: "예비 전원모듈, 점검장비 지참" },
  { id: 2, type: "입찰", title: "울진 소형강우레이더 제안서 마감", customer: "공공기관", location: "나라장터", owner: "최경호", start: "2026-05-03T14:00", end: "2026-05-03T15:00", priority: "긴급", memo: "가격서, 기술제안서, 적격심사 자료 최종 확인" },
  { id: 3, type: "납품", title: "NMEA BUFFER 시운전", customer: "조선소", location: "부산", owner: "박희택", start: "2026-04-29T10:00", end: "2026-04-29T16:00", priority: "보통", memo: "RS-422 출력, NMEA0183 문장 확인" },
  { id: 4, type: "회의", title: "4종 전기기적 형식승인 준비 회의", customer: "내부", location: "KCT 사무실", owner: "최경식", start: "2026-04-28T11:00", end: "2026-04-28T12:00", priority: "보통", memo: "시험기관 제출 서류 및 납품 전 승인 일정 확인" },
];

const typeIcons = { AS: Wrench, 입찰: FileText, 납품: PackageCheck, 회의: Users, 재고: Ship };
const owners = ["전체", "최경호", "최경식", "박희택", "이병환", "박재성"];
const types = ["전체", "AS", "입찰", "납품", "회의", "재고"];

function loadEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : sampleEvents;
  } catch {
    return sampleEvents;
  }
}
function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}
function dateKey(value) { return value.slice(0, 10); }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function formatDateTime(value) {
  return new Date(value).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(new Date(year, month, d));
  return days;
}

function Badge({ type }) {
  const Icon = typeIcons[type] || CalendarDays;
  return <span className={`badge badge-${type}`}><Icon size={14} /> {type}</span>;
}

function StatCard({ title, value, icon: Icon }) {
  return <div className="card stat"><div><p>{title}</p><b>{value}</b></div><span><Icon size={24}/></span></div>;
}

function EventCard({ event, onDelete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card event-card">
      <div className="event-head">
        <div>
          <div className="badges">
            <Badge type={event.type} />
            {event.priority === "긴급" && <span className="urgent"><AlertTriangle size={14}/> 긴급</span>}
          </div>
          <h3>{event.title}</h3>
          <p>{event.customer}</p>
        </div>
        <button className="icon-btn" onClick={() => onDelete(event.id)}><Trash2 size={18}/></button>
      </div>
      <div className="event-grid">
        <span><Clock size={16}/>{formatDateTime(event.start)} ~ {formatDateTime(event.end)}</span>
        <span><UserRound size={16}/>{event.owner}</span>
        <span><MapPin size={16}/>{event.location}</span>
        <span><MessageSquareText size={16}/>{event.memo || "메모 없음"}</span>
      </div>
    </motion.div>
  );
}

function App() {
  const now = new Date();
  const [events, setEventsState] = useState(loadEvents);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [form, setForm] = useState({
    type: "AS", title: "", customer: "", location: "", owner: "최경호",
    start: `${todayKey()}T09:00`, end: `${todayKey()}T10:00`, priority: "보통", memo: ""
  });

  const setEvents = (next) => {
    const value = typeof next === "function" ? next(events) : next;
    setEventsState(value);
    saveEvents(value);
  };

  const filteredEvents = useMemo(() => events
    .filter(e => ownerFilter === "전체" || e.owner === ownerFilter)
    .filter(e => typeFilter === "전체" || e.type === typeFilter)
    .filter(e => `${e.type} ${e.title} ${e.customer} ${e.location} ${e.owner} ${e.memo}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(a.start) - new Date(b.start)), [events, ownerFilter, typeFilter, query]);

  const selectedEvents = filteredEvents.filter(e => dateKey(e.start) === selectedDate);
  const urgentEvents = filteredEvents.filter(e => e.priority === "긴급");
  const monthDays = getMonthDays(viewDate.getFullYear(), viewDate.getMonth());

  const addEvent = () => {
    if (!form.title.trim()) return alert("일정 제목을 입력하세요.");
    const newEvents = [...events, { ...form, id: Date.now() }];
    setEvents(newEvents);
    setSelectedDate(dateKey(form.start));
    setForm({ ...form, title: "", customer: "", location: "", memo: "" });
  };

  const deleteEvent = (id) => {
    if (confirm("이 일정을 삭제할까요?")) setEvents(events.filter(e => e.id !== id));
  };

  const exportCsv = () => {
    const rows = [["구분","제목","기관/거래처","장소","담당자","시작","종료","중요도","메모"],
      ...filteredEvents.map(e => [e.type,e.title,e.customer,e.location,e.owner,e.start,e.end,e.priority,e.memo])];
    const csv = rows.map(r => r.map(c => `"${String(c).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "KCT_업무일정.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const monthTitle = `${viewDate.getFullYear()}년 ${viewDate.getMonth()+1}월`;
  const moveMonth = (diff) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + diff, 1));

  return (
    <div className="app">
      <header className="hero">
        <div>
          <span className="pill"><CalendarDays size={16}/> KCT CO., Ltd · 업무일정 공유</span>
          <h1>KCT 업무일정 관리</h1>
          <p>AS 현장 일정, 입찰 마감, 납품·시운전, 재고 확인, 내부 회의를 한 화면에서 관리합니다.</p>
        </div>
        <button className="white-btn" onClick={exportCsv}><Download size={18}/> CSV 저장</button>
      </header>

      <section className="stats">
        <StatCard title="오늘 일정" value={filteredEvents.filter(e => dateKey(e.start) === todayKey()).length} icon={Clock}/>
        <StatCard title="전체 일정" value={filteredEvents.length} icon={CalendarDays}/>
        <StatCard title="긴급 일정" value={urgentEvents.length} icon={AlertTriangle}/>
        <StatCard title="입찰 일정" value={filteredEvents.filter(e => e.type === "입찰").length} icon={FileText}/>
      </section>

      <main className="layout">
        <section className="left">
          <div className="card filters">
            <div className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="일정, 선박명, 장소, 담당자 검색"/></div>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>{types.map(t => <option key={t}>{t}</option>)}</select>
            <select value={ownerFilter} onChange={e=>setOwnerFilter(e.target.value)}>{owners.map(o => <option key={o}>{o}</option>)}</select>
          </div>

          <div className="card calendar">
            <div className="calendar-head">
              <h2>{monthTitle} 캘린더</h2>
              <div><button onClick={()=>moveMonth(-1)}>이전</button><button onClick={()=>moveMonth(1)}>다음</button></div>
            </div>
            <div className="week">{["일","월","화","수","목","금","토"].map(d => <b key={d}>{d}</b>)}</div>
            <div className="days">
              {monthDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="day empty"/>;
                const key = day.toISOString().slice(0,10);
                const dayEvents = filteredEvents.filter(e => dateKey(e.start) === key);
                return (
                  <button key={key} onClick={()=>setSelectedDate(key)} className={`day ${selectedDate === key ? "selected" : ""}`}>
                    <b>{day.getDate()}</b>
                    {dayEvents.slice(0,2).map(e => <span key={e.id} className={`mini mini-${e.type}`}>{e.title}</span>)}
                    {dayEvents.length > 2 && <em>+{dayEvents.length-2}건</em>}
                  </button>
                )
              })}
            </div>
          </div>

          <h2 className="section-title">선택일 일정 · {selectedDate}</h2>
          {selectedEvents.length ? selectedEvents.map(e => <EventCard key={e.id} event={e} onDelete={deleteEvent}/>) : <div className="card empty-msg">선택한 날짜에 등록된 일정이 없습니다.</div>}
        </section>

        <aside className="right">
          <div className="card form-card">
            <h2><Plus size={20}/> 일정 등록</h2>
            <div className="form-grid two">
              <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>{types.filter(t=>t!=="전체").map(t=><option key={t}>{t}</option>)}</select>
              <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}><option>보통</option><option>긴급</option></select>
            </div>
            <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="일정 제목"/>
            <input value={form.customer} onChange={e=>setForm({...form, customer:e.target.value})} placeholder="기관/거래처"/>
            <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder="장소"/>
            <select value={form.owner} onChange={e=>setForm({...form, owner:e.target.value})}>{owners.filter(o=>o!=="전체").map(o=><option key={o}>{o}</option>)}</select>
            <label>시작</label><input type="datetime-local" value={form.start} onChange={e=>setForm({...form, start:e.target.value})}/>
            <label>종료</label><input type="datetime-local" value={form.end} onChange={e=>setForm({...form, end:e.target.value})}/>
            <textarea value={form.memo} onChange={e=>setForm({...form, memo:e.target.value})} placeholder="메모" rows="3"/>
            <button className="main-btn" onClick={addEvent}><Plus size={18}/> 등록하기</button>
          </div>

          <div className="card">
            <h2>긴급 일정</h2>
            {urgentEvents.length ? urgentEvents.map(e => <div className="urgent-box" key={e.id}><b>{e.title}</b><p>{formatDateTime(e.start)} · {e.owner}</p></div>) : <p className="muted">긴급 일정 없음</p>}
          </div>

          <div className="card">
            <h2>단톡방 입력 예시</h2>
            <p className="chat">[AS] 4/27 09:00 동해항 레이더 점검 담당 최경호 긴급</p>
            <p className="chat">[입찰] 5/3 14:00 울진 강우레이더 제안서 마감</p>
            <p className="chat">[납품] 4/29 10:00 NMEA BUFFER 시운전 담당 박희택</p>
            <small>다음 단계에서 단톡방 메시지 자동분류 기능을 붙일 수 있습니다.</small>
          </div>
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
