import PublicHeader from '../../components/layout/PublicHeader';
import { EmptyState } from '../../components/ui/States';
import Button from '../../components/ui/Button';

export default function NotFound() {
  return (
    <div className="public">
      <PublicHeader />
      <main className="container narrow" style={{ paddingBlock: '4rem' }}>
        <EmptyState icon="search" title="This page does not exist" action={<Button to="/">Go to the home page</Button>}>
          Check the address, or start again from the home page.
        </EmptyState>
      </main>
    </div>
  );
}
