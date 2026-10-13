import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ROLES } from './config/constants';
import RoleGuard from './components/layout/RoleGuard';
import AppShell from './components/layout/AppShell';

import Landing from './pages/public/Landing';
import Portals from './pages/public/Portals';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import NotFound from './pages/public/NotFound';

import StudentDashboard from './pages/student/StudentDashboard';
import NewComplaint from './pages/student/NewComplaint';
import MyComplaints from './pages/student/MyComplaints';
import StudentFines from './pages/student/StudentFines';
import Inbox from './pages/student/Inbox';
import Profile from './pages/student/Profile';

import ComplaintDetail from './pages/shared/ComplaintDetail';

import StaffDashboard from './pages/staff/StaffDashboard';
import ComplaintsList from './pages/staff/ComplaintsList';
import FinesManagement from './pages/staff/FinesManagement';
import WardenPerformance from './pages/staff/WardenPerformance';
import Analytics from './pages/staff/Analytics';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const guarded = (role) => (
  <RoleGuard role={role}>
    <AppShell />
  </RoleGuard>
);

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/portals" element={<Portals />} />
        <Route path="/login/:rolePath" element={<Login />} />
        <Route path="/signup/:rolePath" element={<Signup />} />

        <Route path={`/${ROLES.student.path}`} element={guarded('student')}>
          <Route index element={<StudentDashboard />} />
          <Route path="new" element={<NewComplaint />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="fines" element={<StudentFines />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path={`/${ROLES.warden.path}`} element={guarded('warden')}>
          <Route index element={<StaffDashboard />} />
          <Route path="complaints" element={<ComplaintsList />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="fines" element={<FinesManagement />} />
        </Route>

        {['chief', 'dean'].map((role) => (
          <Route key={role} path={`/${ROLES[role].path}`} element={guarded(role)}>
            <Route index element={<StaffDashboard />} />
            <Route path="complaints" element={<ComplaintsList />} />
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            <Route path="fines" element={<FinesManagement />} />
            <Route path="performance" element={<WardenPerformance />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}