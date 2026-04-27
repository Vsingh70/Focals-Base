import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <>
      <Sidebar />
      <main className="main-content">{children}</main>
    </>
  );
}
