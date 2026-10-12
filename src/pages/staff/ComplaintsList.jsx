import { useStore } from '../../store/StoreContext';
import { visibleComplaints } from '../../store/selectors';
import { Card, PageHeader } from '../../components/ui/Card';
import ComplaintTable from '../../components/ComplaintTable';
import { Alert } from '../../components/ui/States';
import { ROLES } from '../../config/constants';

const SUBTITLE = {
  warden: (u) => `Routine complaints from Block ${u.block}. Complaints about you are never shown here.`,
  chief: () => 'Every block, plus complaints against Wardens and non-hidden ragging cases.',
  dean: () => 'Every complaint in the hostel, including all ragging and harassment cases.',
};

export default function ComplaintsList() {
  const { db, user } = useStore();
  const complaints = visibleComplaints(db, user);
  return (
    <>
      <PageHeader title={user.role === 'warden' ? 'Block complaints' : 'All complaints'} subtitle={SUBTITLE[user.role](user)} />
      <Alert tone="private">Students appear by nickname only.</Alert>
      <Card pad={false} className="card-table">
        <ComplaintTable
          complaints={complaints}
          db={db}
          viewer={user}
          basePath={`/${ROLES[user.role].path}`}
          showStudent
          showRouteTabs={user.role !== 'warden'}
        />
      </Card>
    </>
  );
}
