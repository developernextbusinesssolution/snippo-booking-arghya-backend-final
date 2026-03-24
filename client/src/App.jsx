import { useEffect, useState } from "react";
import { SVCS, STAFF0, BKGS0 } from "./utils/data";
import { MNS, DS, DAYS, TIMES, STEPS, COLORS, parsePath, buildPath, cal, fmtDur, initials, slugify } from "./utils/helpers";
import { apiRequest, readSession, saveSession, clearSession } from "./utils/api";
import BrandLogo from "./components/Shared/BrandLogo";
import Toasts, { useToast } from "./components/Shared/Toasts";
import Confirm from "./components/Shared/Confirm";
import AuthModal from "./components/Shared/AuthModal";
import Progress from "./components/Shared/Progress";

import BookingForm from "./components/Booking/BookingForm";
import BookingPage from "./pages/BookingPage";
import { PublicHeader, AdminHeader, StaffHeader } from "./components/Layout/Headers";

import HomePage from "./pages/HomePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import StaffAuthPage from "./pages/StaffAuthPage";
import UserDash from "./pages/UserDash";
import AdminDash from "./pages/AdminDash";
import StaffPortal from "./pages/StaffPortal";
import PaymentPage from "./pages/PaymentPage";
import SecurityDash from "./pages/SecurityDash";

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
/*
  HEADER BEHAVIOUR:
  🟢 Public (not logged in):  Logo | Admin | Staff | Login/Register
  🔵 User logged in:          Logo | Dashboard  (Admin & Staff HIDDEN, stay on homepage)
  🟣 Admin logged in:         Dedicated AdminHeader
  🟠 Staff logged in:         Dedicated StaffHeader

  PAGES:
  "home"        → Homepage with booking form (public or user logged in)
  "admin_login" → /admin/login  (separate page, not popup)
  "admin_dash"  → Admin dashboard with AdminHeader
  "staff_auth"  → /staff  (staff login + register page)
  "staff_dash"  → Staff dashboard with StaffHeader
  "user_dash"   → User dashboard (uses PublicHeader in logged-in state)
*/
export default function App(){
  const [page,setPage]                   = useState("home");
  const [user,setUser]                   = useState(null);
  const [admin,setAdmin]                 = useState(null);
  const [staffUser,setStaffUser]         = useState(null);
  const [securityUser,setSecurityUser]   = useState(null);
  const [services,setServices]           = useState(SVCS);
  const [staff,setStaff]                 = useState(STAFF0);
  const [bookings,setBookings]           = useState(BKGS0);
  const [globalBusySlots,setGlobalBusySlots] = useState([]);
  const [pending,setPending]             = useState([]);
  const [adminSec,setAdminSec]           = useState("overview");
  const [staffTab,setStaffTab]           = useState("schedule");
  const [userDashTab,setUserDashTab]     = useState("bookings");
  const [token,setToken]                 = useState(null);
  const [stripeKey,setStripeKey]         = useState(null);
  const [paymentBookingId,setPaymentBookingId]     = useState(null);
  const [booting,setBooting]             = useState(true);
  const [showAuthModal,setShowAuthModal] = useState(false);
  const [selectedServiceSlug,setSelectedServiceSlug] = useState(null);
  const [embedMode]                      = useState(()=>typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("embed")==="1");
  const embedUrl                         = typeof window!=="undefined"?`${window.location.origin}${window.location.pathname}?embed=1`:"?embed=1";

  const navigate=(pg,sub=null)=>{
    if(!embedMode){
      const path=buildPath(pg,sub);
      window.history.pushState({page:pg,sub},'',(window.location.search?path+(path.includes('?')?'&':'?')+window.location.search.slice(1):path));
    }
    setPage(pg);
    if(pg==='book_service')setSelectedServiceSlug(sub);
    if(pg==='payment')setPaymentBookingId(sub);
    if(sub){
      if(pg==='admin_dash')setAdminSec(sub);
      else if(pg==='staff_dash')setStaffTab(sub);
      else if(pg==='user_dash')setUserDashTab(sub);
    }
  };

  const applyPublicData=(data)=>{
    if(data.services)setServices(data.services);
    if(data.staff)setStaff(data.staff);
    if(data.bookings)setBookings(data.bookings);
    if(data.busySlots)setGlobalBusySlots(data.busySlots);
    if(data.pendingStaff)setPending(data.pendingStaff);
  };

  const loadBootstrap=async sessionToken=>{
    const data=await apiRequest("/bootstrap",sessionToken?{token:sessionToken}:{});
    applyPublicData(data);
    if(data.stripePublishableKey)setStripeKey(data.stripePublishableKey);
    return data;
  };

  // Handle browser back/forward navigation
  useEffect(()=>{
    if(embedMode)return;
    const onPop=()=>{
      const {page:pg,sub}=parsePath(window.location.pathname);
      setPage(pg);
      if(pg==='book_service')setSelectedServiceSlug(sub);
      if(pg==='payment')setPaymentBookingId(sub);
      if(sub){
        if(pg==='admin_dash')setAdminSec(sub);
        else if(pg==='staff_dash')setStaffTab(sub);
        else if(pg==='user_dash')setUserDashTab(sub);
      }
    };
    window.addEventListener('popstate',onPop);
    return()=>window.removeEventListener('popstate',onPop);
  },[embedMode]);

  useEffect(()=>{
    let mounted=true;
    const boot=async()=>{
      const session=readSession();
      let activeToken=session?.token||null;
      let me=null;

      if(activeToken){
        try{
          me=await apiRequest("/auth/me",{token:activeToken});
          setToken(activeToken);
        }catch{
          clearSession();
          activeToken=null;
          setToken(null);
        }
      }

      try{
        await loadBootstrap(activeToken);
      }catch{
        applyPublicData({services:SVCS,staff:STAFF0,bookings:BKGS0,busySlots:[],pendingStaff:[]});
      }

      if(!mounted)return;

      // Parse current URL to determine intended section/tab
      const urlState=parsePath(window.location.pathname);

      if(embedMode){
        if(me?.user?.role==="user"){
          setUser(me.user);setAdmin(null);setStaffUser(null);setSecurityUser(null);
        }else{
          if(me){clearSession();setToken(null);}
          setUser(null);setAdmin(null);setStaffUser(null);setSecurityUser(null);
        }

        if(urlState.page==='book_service'&&urlState.sub){
          setSelectedServiceSlug(urlState.sub);
          setPage("book_service");
        }else if(urlState.page==='user_dash'){
          setPage("user_dash");
        }else{
          setPage("home");
        }
      }else if(me?.user?.role==="admin"){
        const sec=urlState.page==='admin_dash'?urlState.sub||'overview':'overview';
        setAdminSec(sec);
        setAdmin(me.user);setUser(null);setStaffUser(null);setSecurityUser(null);
        setPage("admin_dash");
        if(!window.location.pathname.startsWith('/admin/dashboard')){
          window.history.replaceState({page:'admin_dash',sub:sec},``,`/admin/dashboard/${sec}`);
        }
      }else if(me?.user?.role==="staff"){
        const tab=urlState.page==='staff_dash'?urlState.sub||'schedule':'schedule';
        setStaffTab(tab);
        setStaffUser({...me.user,staffRef:me.staffRef,staffData:me.staffData});setUser(null);setAdmin(null);setSecurityUser(null);
        setPage("staff_dash");
        if(!window.location.pathname.startsWith('/staff/dashboard')){
          window.history.replaceState({page:'staff_dash',sub:tab},``,`/staff/dashboard/${tab}`);
        }
      }else if(me?.user?.role==="security"){
        setSecurityUser(me.user);setUser(null);setAdmin(null);setStaffUser(null);
        setPage("security_dash");
        if(!window.location.pathname.startsWith('/security/dashboard')){
          window.history.replaceState({page:'security_dash',sub:null},``,`/security/dashboard`);
        }
      }else if(me?.user?.role==="user"){
        const tab=urlState.page==='user_dash'?urlState.sub||'bookings':'bookings';
        setUserDashTab(tab);
        setUser(me.user);setAdmin(null);setStaffUser(null);setSecurityUser(null);
        // Redirect user to their desired URL page or home
        if(urlState.page==='user_dash'){
          setPage("user_dash");
          if(!window.location.pathname.startsWith('/user/dashboard')){
            window.history.replaceState({page:'user_dash',sub:tab},``,`/user/dashboard/${tab}`);
          }
        }else{
          setPage("home");
          if(window.location.pathname!=='/'&&!window.location.pathname.startsWith('/?')){
            window.history.replaceState({page:'home',sub:null},``,'/')
          }
        }
      }else{
        setUser(null);setAdmin(null);setStaffUser(null);setSecurityUser(null);
        // Honour URL for public pages
        if(urlState.page==='admin_login'){setPage("admin_login");}
        else if(urlState.page==='staff_auth'){setPage("staff_auth");}
        else if(urlState.page==='book_service'&&urlState.sub){
          setSelectedServiceSlug(urlState.sub);
          setPage("book_service");
        }else if(urlState.page==='payment'&&urlState.sub){
          setPaymentBookingId(urlState.sub);
          setPage("payment");
        }else{
          setPage("home");
          if(window.location.pathname!=='/'&&window.location.pathname.startsWith('/admin')||window.location.pathname.startsWith('/staff')||window.location.pathname.startsWith('/user')){
            window.history.replaceState({page:'home',sub:null},``,`/`)
          }
        }
      }

      setBooting(false);
    };

    void boot();
    return()=>{mounted=false;};
  },[embedMode]);

  const refreshData=async sessionToken=>{
    const effectiveToken=sessionToken===undefined?token:sessionToken;
    try{await loadBootstrap(effectiveToken||null);}catch{}
  };

  const setSessionState=async payload=>{
    const session={token:payload.token,user:payload.user};
    saveSession(session);
    setToken(payload.token);

    if(embedMode&&payload.user.role!=="user"){
      clearSession();
      setToken(null);
      setUser(null);setAdmin(null);setStaffUser(null);setSecurityUser(null);navigate("home");
      await refreshData(null);
      setShowAuthModal(false);
      return;
    }

    if(payload.user.role==="admin"){
      setAdmin(payload.user);setUser(null);setStaffUser(null);setSecurityUser(null);navigate("admin_dash","overview");
    }else if(payload.user.role==="staff"){
      setStaffUser({...payload.user,staffRef:payload.staffRef,staffData:payload.staffData});setUser(null);setAdmin(null);setSecurityUser(null);
      navigate("staff_dash","schedule");
    }else if(payload.user.role==="security"){
      setSecurityUser(payload.user);setUser(null);setAdmin(null);setStaffUser(null);navigate("security_dash");
    }else{
      setUser(payload.user);setAdmin(null);setStaffUser(null);setSecurityUser(null);
      if(page!=="book_service" && page!=="payment") navigate("home");
    }

    await refreshData(payload.token);
    setShowAuthModal(false);
  };

  const clearAuthState=async()=>{
    clearSession();
    setToken(null);
    setUser(null);
    setAdmin(null);
    setStaffUser(null);
    setSecurityUser(null);
    setShowAuthModal(false);
    navigate("home");
    await refreshData(null);
  };

  const signOutUser=()=>{void clearAuthState();};
  const signOutAdmin=()=>{void clearAuthState();};
  const signOutStaff=()=>{void clearAuthState();};

  const handleUserAuth=payload=>{
    const targetPage=page;
    void (async()=>{
      await setSessionState(payload);
      if(payload?.user?.role==="user"&&targetPage==="user_dash")navigate("user_dash","bookings");
    })();
  };
  const handleAdminAuth=payload=>{void setSessionState(payload);};
  const handleStaffAuth=payload=>{void setSessionState(payload);};
  const goUserDash=(tab="bookings")=>{setUserDashTab(tab);navigate("user_dash",tab);};

  useEffect(()=>{
    if(embedMode&&page!=="home"&&page!=="user_dash"&&page!=="book_service"){
      navigate("home");
    }
  },[embedMode,page]);

  const createBooking=async payload=>{
    const res=await apiRequest("/bookings",{method:"POST",token,body:payload});
    // res is now { booking, clientSecret, token, user }
    if(res.booking){
      setBookings(p=>[res.booking,...p]);
    }
    return res;
  };

  const openAuth=()=>setShowAuthModal(true);
  const closeAuth=()=>setShowAuthModal(false);

  if(booting){
    return <>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",color:"var(--text)"}}>
        <div className="glass" style={{padding:"18px 22px",fontSize:13}}>Loading application...</div>
      </div>
    </>;
  }

  return <>
    <div style={{position:"relative",minHeight:"100vh",background:"var(--bg)"}}>
      <div className="orb orb1"/><div className="orb orb2"/>
      <div style={{position:"relative",zIndex:1}}>

        {page==="home" && <>
          {!embedMode&&<PublicHeader
            user={user}
            onLoginClick={openAuth}
            onSignOut={signOutUser}
            onGoAdmin={() => navigate("admin_login")}
            onGoStaff={() => navigate("staff_auth")}
            onGoDash={() => goUserDash("bookings")}
            onGoProfile={() => goUserDash("profile")}
            embedMode={embedMode}
          />}
          <HomePage
            user={user}
            onUserAuth={handleUserAuth}
            onGoDash={() => goUserDash("bookings")}
            onNavigateToPayment={(id) => navigate("payment", id)}
            services={services}
            staff={staff}
            bookings={bookings}
            busySlots={globalBusySlots}
            onCreateBooking={createBooking}
            stripeKey={stripeKey}
            token={token}
            onBookService={svc => navigate('book_service', slugify(svc.name))}
            embedMode={embedMode}
            embedHeader={embedMode?<PublicHeader
              user={user}
              onLoginClick={openAuth}
              onSignOut={signOutUser}
              onGoAdmin={() => navigate("admin_login")}
              onGoStaff={() => navigate("staff_auth")}
              onGoDash={() => goUserDash("bookings")}
              onGoProfile={() => goUserDash("profile")}
              embedMode={true}
            />:null}
          />
          {showAuthModal && <AuthModal onClose={closeAuth} onAuth={handleUserAuth}/>}
        </>}

        {(page==="book_service") && <>
          {!embedMode&&<PublicHeader
            user={user}
            onLoginClick={openAuth}
            onSignOut={signOutUser}
            onGoAdmin={() => navigate("admin_login")}
            onGoStaff={() => navigate("staff_auth")}
            onGoDash={() => goUserDash("bookings")}
            onGoProfile={() => goUserDash("profile")}
            embedMode={embedMode}
          />}
          <BookingPage
            serviceSlug={selectedServiceSlug}
            services={services}
            staff={staff}
            bookings={bookings}
            busySlots={globalBusySlots}
            onCreateBooking={createBooking}
            onNavigateToPayment={(id) => navigate("payment", id)}
            onGoDash={() => goUserDash("bookings")}
            onGoHome={() => navigate("home")}
            stripeKey={stripeKey}
            token={token}
            user={user}
            onUserAuth={handleUserAuth}
            onLoginClick={openAuth}
            embedMode={embedMode}
            embedHeader={embedMode?<PublicHeader
              user={user}
              onLoginClick={openAuth}
              onSignOut={signOutUser}
              onGoAdmin={() => navigate("admin_login")}
              onGoStaff={() => navigate("staff_auth")}
              onGoDash={() => goUserDash("bookings")}
              onGoProfile={() => goUserDash("profile")}
              embedMode={true}
            />:null}
          />
          {showAuthModal && <AuthModal onClose={closeAuth} onAuth={handleUserAuth}/>}
        </>}

        {page==="user_dash" && user && <>
          {!embedMode&&<PublicHeader
            user={user}
            onSignOut={signOutUser}
            onGoAdmin={() => navigate("admin_login")}
            onGoStaff={() => navigate("staff_auth")}
            onGoDash={() => goUserDash("bookings")}
            onGoProfile={() => goUserDash("profile")}
            embedMode={embedMode}
          />}
          <UserDash
            user={user}
            onSignOut={signOutUser}
            bookings={bookings}
            setBookings={setBookings}
            services={services}
            staff={staff}
            onGoHome={() => navigate("home")}
            token={token}
            onUserUpdated={setUser}
            initialTab={userDashTab}
            onTabChange={t=>navigate("user_dash",t)}
            embedded={embedMode}
            embedHeader={embedMode?<PublicHeader
              user={user}
              onSignOut={signOutUser}
              onGoAdmin={() => navigate("admin_login")}
              onGoStaff={() => navigate("staff_auth")}
              onGoDash={() => goUserDash("bookings")}
              onGoProfile={() => goUserDash("profile")}
              embedMode={true}
            />:null}
          />
        </>}

        {page==="user_dash" && !user && <>
          {!embedMode&&<PublicHeader user={null} onLoginClick={openAuth} onGoAdmin={()=>navigate("admin_login")} onGoStaff={()=>navigate("staff_auth")} onGoDash={()=>goUserDash("bookings")} embedMode={embedMode}/>}
          {embedMode&&<PublicHeader user={null} onLoginClick={openAuth} onGoAdmin={()=>navigate("admin_login")} onGoStaff={()=>navigate("staff_auth")} onGoDash={()=>goUserDash("bookings")} embedMode={true}/>}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:embedMode?"100vh":"calc(100vh - var(--nh))",gap:14,textAlign:"center",padding:32}}>
            <div style={{fontSize:46}}>LOCK</div>
            <div style={{fontWeight:900,fontSize:22,letterSpacing:"-.03em"}}>Sign in required</div>
            <p style={{color:"var(--muted)",maxWidth:300,lineHeight:1.6}}>Please sign in to view your dashboard</p>
            <div style={{display:"flex",gap:9,flexWrap:"wrap",justifyContent:"center"}}>
              <button className="btn btn-p" onClick={openAuth}>Sign In / Register</button>
              <button className="btn btn-g" onClick={()=>navigate("home")}>{embedMode?"Back to Booking Form":"Back to Homepage"}</button>
            </div>
          </div>
          {showAuthModal && <AuthModal onClose={closeAuth} onAuth={handleUserAuth}/>}
        </>}

        {!embedMode&&page==="admin_login" && <>
          <nav className="nav" style={{zIndex:200}}>
            <div className="nav-logo" style={{cursor:"pointer"}} onClick={()=>navigate("home")}><BrandLogo /></div>
          </nav>
          <AdminLoginPage
            onLogin={handleAdminAuth}
            onBack={() => navigate("home")}
          />
        </>}

        {!embedMode&&page==="admin_dash" && <>
          {admin
            ? <><AdminHeader admin={admin} onSignOut={signOutAdmin}/>
                <AdminDash services={services} setServices={setServices} staff={staff} setStaff={setStaff}
                  bookings={bookings} setBookings={setBookings} pendingStaff={pending} setPendingStaff={setPending}
                  onSignOut={signOutAdmin} token={token} embedUrl={embedUrl}
                  initialSec={adminSec} onSecChange={s=>navigate("admin_dash",s)}/></>
            : <><nav className="nav"><div className="nav-logo" style={{cursor:"pointer"}} onClick={()=>navigate("home")}><BrandLogo /></div></nav>
               <AdminLoginPage onLogin={handleAdminAuth} onBack={()=>navigate("home")}/></>
          }
        </>}

        {!embedMode&&page==="staff_auth" && <>
          <nav className="nav" style={{zIndex:200}}>
            <div className="nav-logo" style={{cursor:"pointer"}} onClick={()=>navigate("home")}><BrandLogo /></div>
          </nav>
          <StaffAuthPage
            onLogin={handleStaffAuth}
            onBack={() => navigate("home")}
          />
        </>}

        {!embedMode&&page==="staff_dash" && <>
          {staffUser
            ? <><StaffHeader staffUser={staffUser} onSignOut={signOutStaff}/>
                <StaffPortal staffUser={staffUser} allStaff={staff} setAllStaff={setStaff}
                  bookings={bookings} services={services} onSignOut={signOutStaff} token={token}
                  initialTab={staffTab} onTabChange={t=>navigate("staff_dash",t)}/></>
            : <><nav className="nav"><div className="nav-logo" style={{cursor:"pointer"}} onClick={()=>navigate("home")}><BrandLogo /></div></nav>
               <StaffAuthPage onLogin={handleStaffAuth} onBack={()=>navigate("home")}/></>
          }
        </>}

        {!embedMode&&page==="security_dash" && <>
          {securityUser
            ? <>
                <nav className="nav" style={{zIndex:200}}><div className="nav-logo" style={{cursor:"pointer"}} onClick={()=>navigate("home")}><BrandLogo /></div></nav>
                <SecurityDash user={securityUser} onSignOut={clearAuthState} token={token} />
              </>
            : <>
                <nav className="nav" style={{zIndex:200}}><div className="nav-logo" style={{cursor:"pointer"}} onClick={()=>navigate("home")}><BrandLogo /></div></nav>
                <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div className="glass" style={{padding:40,textAlign:"center"}}>
                    <h2>Please sign in</h2>
                    <button className="btn btn-p" onClick={openAuth}>Sign In</button>
                  </div>
                </div>
              </>
          }
        </>}

        {page==="payment" && paymentBookingId && (
          <>
            {!embedMode && (
              <PublicHeader 
                user={user} 
                onSignOut={signOutUser} 
                onLoginClick={openAuth} 
                onGoDash={() => goUserDash("bookings")} 
                embedMode={embedMode}
              />
            )}
            <PaymentPage 
              bookingId={paymentBookingId} 
              onGoDash={() => goUserDash("bookings")} 
              onGoHome={() => navigate("home")} 
              stripeKey={stripeKey} 
              token={token}
              onCreateBooking={createBooking}
              services={services}
              staff={staff}
            />
          </>
        )}
      </div>
    </div>
  </>;
}

