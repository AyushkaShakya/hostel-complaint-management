import { useStore } from '../../store/StoreContext';
import { visibleComplaints } from '../../store/selectors';
import { Card, PageHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ComplaintTable from '../../components/ComplaintTable';

export default function MyComplaints() {
  const { db, user } = useStore();
  const complaints = visibleComplaints(db, user);
  return (
    <>
      <PageHeader title="My complaints" subtitle={`${complaints.length} complaint${complaints.length === 1 ? '' : 's'} filed`} actions={<Button to="/student/new">Raise complaint</Button>} />
      <Card pad={false} className="card-table">
        <ComplaintTable
          complaints={complaints}
          db={db}
          viewer={user}
          basePath="/student"
          emptyAction={<Button to="/student/new" size="sm">Raise your first complaint</Button>}
        />
      </Card>
    </>
  );
}
