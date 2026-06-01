const { useState, useEffect, createContext, useContext, useRef } = React;
const { Package, User, LogIn, LogOut, Clock, Camera, CheckCircle, XCircle, QrCode, AlertTriangle, Users, Box, BarChart3, ArrowRightLeft } = lucide;

// --- MOCK DATABASE / STATE MANAGEMENT ---
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('wh_users')) || [
    { staffId: 'TL01', name: 'Budi (TL)', role: 'TL', div: 'Warehouse A', password: '123' },
    { staffId: 'SEC01', name: 'Agus (Sec)', role: 'Security', password: '123' },
    { staffId: 'SPV01', name: 'Siti (SPV)', role: 'Supervisor', password: '123' }
  ]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Attendance: { staffId, inTime, outTime, date }
  const [attendance, setAttendance] = useState(() => JSON.parse(localStorage.getItem('wh_att')) || []);
  
  // Breaks: { id, staffId, startTime, duration, status: 'assigned'|'active'|'finished', scannedBy: null }
  const [breaks, setBreaks] = useState(() => JSON.parse(localStorage.getItem('wh_breaks')) || []);
  
  // SEUIC Requests: { id, staffId, seuicId, status: 'requested'|'borrowed'|'returned', conditionBorrow, conditionReturn, secOnDuty }
  const [seuic, setSeuic] = useState(() => JSON.parse(localStorage.getItem('wh_seuic')) || []);

  useEffect(() => { localStorage.setItem('wh_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('wh_att', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('wh_breaks', JSON.stringify(breaks)); }, [breaks]);
  useEffect(() => { localStorage.setItem('wh_seuic', JSON.stringify(seuic)); }, [seuic]);

  return (
    <AppContext.Provider value={{
      users, setUsers, currentUser, setCurrentUser,
      attendance, setAttendance, breaks, setBreaks, seuic, setSeuic
    }}>
      {children}
    </AppContext.Provider>
  );
};

// --- AUTH & ROUTING ---
const App = () => {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
};

const MainRouter = () => {
  const { currentUser } = useContext(AppContext);
  const [view, setView] = useState('login'); // login, register, dashboard

  useEffect(() => {
    if (currentUser) setView('dashboard');
    else setView('login');
  }, [currentUser]);

  if (view === 'login') return <Login setView={setView} />;
  if (view === 'register') return <Register setView={setView} />;
  if (view === 'dashboard') {
    if (currentUser.role === 'Karyawan') return <EmployeeDashboard />;
    if (currentUser.role === 'TL') return <TLDashboard />;
    if (currentUser.role === 'Security') return <SecurityDashboard />;
    if (currentUser.role === 'Supervisor') return <SupervisorDashboard />;
  }
  return null;
};

const Login = ({ setView }) => {
  const { users, setCurrentUser } = useContext(AppContext);
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const u = users.find(x => x.staffId === id && (x.password === pass || !x.password)); // simplified
    if (u) setCurrentUser(u);
    else alert('Invalid Staff ID or Password (use 123 for default roles)');
  };

  return (
    <div className="container" style={{justifyContent: 'center'}}>
      <div className="glass-card text-center">
        <Package size={48} color="var(--primary)" className="mb-4" />
        <h2 className="mb-4">Warehouse PWA</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group text-left">
            <label className="form-label">Staff ID</label>
            <input className="form-control" value={id} onChange={e=>setId(e.target.value)} required />
          </div>
          <div className="form-group text-left">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary mt-4">
            <LogIn size={20} /> Login
          </button>
        </form>
        <p className="mt-4" style={{fontSize: '0.875rem'}}>
          Belum punya akun? <a href="#" onClick={(e)=>{e.preventDefault(); setView('register');}}>Daftar Karyawan Baru</a>
        </p>
      </div>
    </div>
  );
};

const Register = ({ setView }) => {
  const { users, setUsers } = useContext(AppContext);
  const [form, setForm] = useState({ name: '', staffId: '', div: '', password: '' });
  
  const handleReg = (e) => {
    e.preventDefault();
    if (users.find(u => u.staffId === form.staffId)) return alert('Staff ID sudah terdaftar');
    setUsers([...users, { ...form, role: 'Karyawan', ktpPhoto: 'simulated-photo-url' }]);
    alert('Registrasi Berhasil! Silakan Login');
    setView('login');
  };

  return (
    <div className="container" style={{justifyContent: 'center'}}>
      <div className="glass-card">
        <h2 className="mb-4 text-center">Registrasi Karyawan</h2>
        <form onSubmit={handleReg}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input className="form-control" required onChange={e=>setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Staff ID</label>
            <input className="form-control" required onChange={e=>setForm({...form, staffId: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Divisi</label>
            <input className="form-control" required onChange={e=>setForm({...form, div: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" required onChange={e=>setForm({...form, password: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Foto KTP (Simulasi)</label>
            <input className="form-control" type="file" accept="image/*" />
          </div>
          <button type="submit" className="btn btn-primary mt-4">Daftar</button>
          <button type="button" className="btn btn-outline mt-4" onClick={()=>setView('login')}>Batal</button>
        </form>
      </div>
    </div>
  );
};

// --- EMPLOYEE DASHBOARD ---
const EmployeeDashboard = () => {
  const { currentUser, attendance, setAttendance, breaks, setBreaks, seuic, setSeuic, setCurrentUser } = useContext(AppContext);
  const [view, setView] = useState('home'); // home, seuic
  
  // Attendance logic
  const today = new Date().toISOString().split('T')[0];
  const myAtt = attendance.find(a => a.staffId === currentUser.staffId && a.date === today);
  
  const handleClockIn = () => {
    setAttendance([...attendance, { staffId: currentUser.staffId, date: today, inTime: new Date().toISOString(), outTime: null }]);
  };
  const handleClockOut = () => {
    setAttendance(attendance.map(a => a === myAtt ? { ...a, outTime: new Date().toISOString() } : a));
  };

  // Break logic
  const myBreak = breaks.find(b => b.staffId === currentUser.staffId && (b.status === 'assigned' || b.status === 'active'));
  
  // SEUIC logic
  const mySeuic = seuic.find(s => s.staffId === currentUser.staffId && (s.status === 'requested' || s.status === 'borrowed'));
  const [seuicId, setSeuicId] = useState('');

  const reqSeuic = () => {
    if (!seuicId) return;
    setSeuic([...seuic, { id: Date.now(), staffId: currentUser.staffId, seuicId, status: 'requested', conditionBorrow: null }]);
    setSeuicId('');
  };

  if (myBreak) return <ExitPass breakData={myBreak} user={currentUser} />;

  return (
    <div className="container">
      <div className="header">
        <div className="flex justify-between items-center px-2">
          <div>
            <h3 style={{margin: 0}}>Halo, {currentUser.name}</h3>
            <span className="badge badge-primary">{currentUser.role} - {currentUser.div}</span>
          </div>
          <button className="btn btn-outline" style={{width:'auto', padding:'0.5rem'}} onClick={()=>setCurrentUser(null)}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="content-area">
        {view === 'home' ? (
          <>
            <div className="glass-card text-center">
              <h3 className="mb-4">Absensi Hari Ini</h3>
              {!myAtt ? (
                <button className="btn btn-primary" onClick={handleClockIn}><Clock size={20}/> Tiba di Warehouse</button>
              ) : !myAtt.outTime ? (
                <div>
                  <p className="mb-4">Masuk: {new Date(myAtt.inTime).toLocaleTimeString()}</p>
                  <button className="btn btn-danger" onClick={handleClockOut}><Clock size={20}/> Pulang</button>
                </div>
              ) : (
                <div>
                  <p>Masuk: {new Date(myAtt.inTime).toLocaleTimeString()}</p>
                  <p>Pulang: {new Date(myAtt.outTime).toLocaleTimeString()}</p>
                  <span className="badge badge-success mt-4">Absensi Selesai</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass-card">
            <h3 className="mb-4 flex items-center gap-2"><ArrowRightLeft size={20}/> Peminjaman SEUIC</h3>
            {mySeuic ? (
              <div className="text-center">
                <p>Status: <span className="badge badge-warning">{mySeuic.status.toUpperCase()}</span></p>
                <p className="mt-2">SEUIC ID: {mySeuic.seuicId}</p>
                <p className="mt-4 text-sm">Harap ke pos Security untuk validasi/pengembalian.</p>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Nomor Asset SEUIC</label>
                  <input className="form-control" value={seuicId} onChange={e=>setSeuicId(e.target.value)} placeholder="Contoh: S-001" />
                </div>
                <button className="btn btn-primary mt-4" onClick={reqSeuic}>Request Pinjam</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className={`nav-item ${view==='home'?'active':''}`} onClick={()=>setView('home')}>
          <User size={24} /> Absensi
        </div>
        <div className={`nav-item ${view==='seuic'?'active':''}`} onClick={()=>setView('seuic')}>
          <Box size={24} /> Alat (SEUIC)
        </div>
      </div>
    </div>
  );
};

// --- EXIT PASS COMPONENT (Employee Side) ---
const ExitPass = ({ breakData, user }) => {
  const [timeLeft, setTimeLeft] = useState(65 * 60); // 1h 5m in seconds
  
  useEffect(() => {
    if (breakData.status !== 'active') return;
    
    // Calculate actual time left based on startTime
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - breakData.startTime) / 1000);
      const remaining = (65 * 60) - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        // Haptic feedback at exactly 60 minutes passed (5 mins left)
        if (remaining === 300) {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [breakData]);

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  const isScanned = breakData.status === 'active';

  return (
    <div className={`exit-pass ${isScanned ? 'success' : 'active'}`}>
      <h2>{isScanned ? 'BREAK DIMULAI' : 'EXIT PASS'}</h2>
      <div className="exit-pass-timer">{formatTime(timeLeft)}</div>
      
      {!isScanned && (
        <div className="exit-pass-barcode">
          <QrCode size={120} color="#000" />
          {/* Simulated Barcode Text */}
          <div className="text-center text-black font-bold mt-2">{user.staffId}</div>
        </div>
      )}
      
      <div className="glass-card mt-4" style={{color:'black', background:'rgba(255,255,255,0.9)'}}>
        <p><strong>Nama:</strong> {user.name}</p>
        <p><strong>Divisi:</strong> {user.div}</p>
      </div>
      
      <p className="mt-4 font-bold">
        {isScanned ? 'Selamat Beristirahat. Silakan kembali sebelum waktu habis.' : 'Tunjukkan layar ini pada Security untuk di-scan.'}
      </p>
    </div>
  );
};

// --- TEAM LEADER DASHBOARD ---
const TLDashboard = () => {
  const { users, attendance, breaks, setBreaks, setCurrentUser } = useContext(AppContext);
  const team = users.filter(u => u.role === 'Karyawan');
  const today = new Date().toISOString().split('T')[0];

  const assignBreak = (staffId) => {
    const exists = breaks.find(b => b.staffId === staffId && b.status !== 'finished');
    if (exists) return alert('Karyawan sedang/akan istirahat.');
    setBreaks([...breaks, { id: Date.now(), staffId, status: 'assigned' }]);
  };

  const stopBreak = (id) => {
    setBreaks(breaks.map(b => b.id === id ? { ...b, status: 'finished' } : b));
  };

  return (
    <div className="container">
      <div className="header">
        <div className="flex justify-between items-center px-2">
          <h2 style={{color: 'var(--primary-dark)'}}>TL Dashboard</h2>
          <button className="btn btn-outline" style={{width:'auto', padding:'0.5rem'}} onClick={()=>setCurrentUser(null)}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
      
      <div className="glass-card">
        <h3 className="mb-4">Anggota Tim & Absensi</h3>
        {team.map(emp => {
          const att = attendance.find(a => a.staffId === emp.staffId && a.date === today);
          const brk = breaks.find(b => b.staffId === emp.staffId && b.status !== 'finished');
          
          return (
            <div key={emp.staffId} className="flex justify-between items-center mb-4" style={{borderBottom:'1px solid var(--glass-border)', paddingBottom:'0.5rem'}}>
              <div>
                <div className="font-bold">{emp.name}</div>
                <div className="text-sm">In: {att ? new Date(att.inTime).toLocaleTimeString() : '-'}</div>
              </div>
              <div>
                {!brk ? (
                  <button className="btn btn-primary" style={{padding:'0.25rem 0.5rem', fontSize:'0.75rem', width:'auto'}} onClick={()=>assignBreak(emp.staffId)}>
                    Assign Break
                  </button>
                ) : brk.status === 'assigned' ? (
                  <span className="badge badge-warning">Menunggu Scan Sec</span>
                ) : (
                  <button className="btn btn-danger" style={{padding:'0.25rem 0.5rem', fontSize:'0.75rem', width:'auto'}} onClick={()=>stopBreak(brk.id)}>
                    Selesai Break
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- SECURITY DASHBOARD ---
const SecurityDashboard = () => {
  const { breaks, setBreaks, seuic, setSeuic, users, currentUser, setCurrentUser } = useContext(AppContext);
  const [view, setView] = useState('scan');
  
  const scanSuccess = (staffId) => {
    const brk = breaks.find(b => b.staffId === staffId && b.status === 'assigned');
    if (brk) {
      setBreaks(breaks.map(b => b.id === brk.id ? { ...b, status: 'active', startTime: Date.now() } : b));
      alert('Berhasil scan exit pass!');
    } else {
      alert('Tanda keluar tidak valid atau sudah aktif.');
    }
  };

  const handleApproveSeuic = (id, condition, note) => {
    setSeuic(seuic.map(s => s.id === id ? { 
      ...s, status: 'borrowed', conditionBorrow: condition, noteBorrow: note, secOnDuty: currentUser.name 
    } : s));
  };
  
  const handleReturnSeuic = (id, condition) => {
    setSeuic(seuic.map(s => s.id === id ? {
      ...s, status: 'returned', conditionReturn: condition, secOnDutyReturn: currentUser.name
    } : s));
  };

  return (
    <div className="container">
      <div className="header">
        <div className="flex justify-between items-center px-2">
          <h2 style={{color: 'var(--primary-dark)'}}>Security Dashboard</h2>
          <button className="btn btn-outline" style={{width:'auto', padding:'0.5rem'}} onClick={()=>setCurrentUser(null)}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
      
      <div className="content-area">
        {view === 'scan' ? (
          <div className="glass-card text-center">
            <h3 className="mb-4">Scanner Barcode</h3>
            <div className="scanner-container mb-4" style={{minHeight:'250px', display:'flex', alignItems:'center', justifyContent:'center', background:'#e2e8f0'}}>
              <Camera size={48} color="#94a3b8" />
              <p className="text-sm absolute" style={{bottom:'1rem', color:'#64748b'}}>Camera Feed (Simulasi)</p>
            </div>
            
            {/* Simulation of scanning a user */}
            <h4 className="mt-4 mb-2">Simulasi Scan Manual</h4>
            <div className="flex gap-2 flex-wrap justify-center">
              {breaks.filter(b=>b.status==='assigned').map(b => (
                <button key={b.id} className="btn btn-success" style={{width:'auto'}} onClick={()=>scanSuccess(b.staffId)}>
                  Scan {b.staffId}
                </button>
              ))}
              {breaks.filter(b=>b.status==='assigned').length === 0 && <p>Tidak ada exit pass tertunda.</p>}
            </div>
          </div>
        ) : (
          <div className="glass-card">
            <h3 className="mb-4">Antrean SEUIC</h3>
            {seuic.filter(s=>s.status !== 'returned').map(s => {
              const emp = users.find(u=>u.staffId === s.staffId);
              return (
                <div key={s.id} className="mb-4 p-3 bg-white" style={{borderRadius:'8px', border:'1px solid #cbd5e1'}}>
                  <p><strong>Peminjam:</strong> {emp?.name} ({s.staffId})</p>
                  <p><strong>Alat:</strong> {s.seuicId}</p>
                  <p><strong>Status:</strong> <span className="badge badge-warning">{s.status}</span></p>
                  
                  {s.status === 'requested' && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-sm mb-2 text-danger"><AlertTriangle size={14}/> Validasi wajah dengan KTP dan foto kondisi alat.</p>
                      <button className="btn btn-outline mb-2" style={{width:'auto', fontSize:'0.75rem'}}><Camera size={14}/> Ambil Foto Alat</button>
                      <div className="flex gap-2 mt-2">
                        <button className="btn btn-success" style={{width:'auto', flex:1}} onClick={()=>handleApproveSeuic(s.id, 'Bagus', '')}>Setujui (Bagus)</button>
                        <button className="btn btn-danger" style={{width:'auto', flex:1}} onClick={()=>{
                          const note = prompt("Catatan Kerusakan:");
                          if(note) handleApproveSeuic(s.id, 'Rusak', note);
                        }}>Setujui (Rusak)</button>
                      </div>
                    </div>
                  )}
                  
                  {s.status === 'borrowed' && (
                    <div className="mt-3 border-t pt-3">
                      <button className="btn btn-outline mb-2" style={{width:'auto', fontSize:'0.75rem'}}><Camera size={14}/> Foto Bukti Kembali</button>
                      <button className="btn btn-primary mt-2" onClick={()=>handleReturnSeuic(s.id, 'Bagus')}>Terima Pengembalian</button>
                    </div>
                  )}
                </div>
              )
            })}
            {seuic.filter(s=>s.status !== 'returned').length === 0 && <p>Tidak ada antrean SEUIC.</p>}
          </div>
        )}
      </div>
      
      <div className="bottom-nav">
        <div className={`nav-item ${view==='scan'?'active':''}`} onClick={()=>setView('scan')}>
          <QrCode size={24} /> Scanner
        </div>
        <div className={`nav-item ${view==='seuic'?'active':''}`} onClick={()=>setView('seuic')}>
          <Box size={24} /> SEUIC Auth
        </div>
      </div>
    </div>
  );
};

// --- SUPERVISOR DASHBOARD ---
const SupervisorDashboard = () => {
  const { attendance, breaks, seuic, users, setCurrentUser } = useContext(AppContext);
  const today = new Date().toISOString().split('T')[0];
  
  const todayAtt = attendance.filter(a => a.date === today);
  const activeBreaks = breaks.filter(b => b.status === 'active').length;
  const borrowedSeuic = seuic.filter(s => s.status === 'borrowed').length;
  const returnedSeuic = seuic.filter(s => s.status === 'returned').length;

  return (
    <div className="container">
      <div className="header">
        <div className="flex justify-between items-center px-2">
          <h2 style={{color: 'var(--primary-dark)'}}>Supervisor Panel</h2>
          <button className="btn btn-outline" style={{width:'auto', padding:'0.5rem'}} onClick={()=>setCurrentUser(null)}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
      
      <div className="glass-card flex gap-4 text-center">
        <div style={{flex:1}}>
          <Users size={32} color="var(--primary)" className="mx-auto" />
          <h3 className="mt-2">{todayAtt.length}</h3>
          <p className="text-sm">Hadir Hari Ini</p>
        </div>
        <div style={{flex:1}}>
          <Clock size={32} color="var(--warning)" className="mx-auto" />
          <h3 className="mt-2">{activeBreaks}</h3>
          <p className="text-sm">Sedang Break</p>
        </div>
      </div>
      
      <div className="glass-card">
        <h3 className="mb-4 flex items-center gap-2"><BarChart3 size={20}/> Status Inventaris SEUIC</h3>
        <div className="flex justify-between mb-2">
          <span>Sedang Dipinjam:</span>
          <span className="font-bold text-danger">{borrowedSeuic}</span>
        </div>
        <div className="flex justify-between">
          <span>Sudah Dikembalikan:</span>
          <span className="font-bold text-success">{returnedSeuic}</span>
        </div>
      </div>
      
      <div className="glass-card">
        <h3 className="mb-4">Log Absensi (Hari Ini)</h3>
        {todayAtt.map(a => {
          const u = users.find(x => x.staffId === a.staffId);
          return (
            <div key={a.staffId} className="flex justify-between border-b pb-2 mb-2 text-sm">
              <span>{u?.name}</span>
              <span>{new Date(a.inTime).toLocaleTimeString()} - {a.outTime ? new Date(a.outTime).toLocaleTimeString() : '...'}</span>
            </div>
          )
        })}
        {todayAtt.length === 0 && <p className="text-sm">Belum ada absensi hari ini.</p>}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
