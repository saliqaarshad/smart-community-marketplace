import { Link, useSearchParams } from 'react-router-dom';
import { Home, Laptop, Shirt, GraduationCap, Wrench, Settings, HelpCircle } from 'lucide-react';

const categories = [
  { label: 'Home', icon: Home, value: '' },
  { label: 'Electronics', icon: Laptop, value: 'Electronics' },
  { label: 'Fashion', icon: Shirt, value: 'Fashion' },
  { label: 'Tutoring', icon: GraduationCap, value: 'Tutoring' },
  { label: 'Services', icon: Wrench, value: 'Services' },
];

const Sidebar = () => {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 py-8 pr-6">
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Categories</p>
        <p className="text-xs text-muted mb-4">Browse by department</p>

        <nav className="flex flex-col gap-1">
          {categories.map(({ label, icon: Icon, value }) => {
            const isActive = activeCategory === value && (value !== '' || !searchParams.get('category'));
            return (
              <Link
                key={label}
                to={value ? `/products?category=${encodeURIComponent(value)}` : '/products'}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-text hover:bg-bg'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border border-border rounded-xl p-2">
        <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-bg transition">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Link to="/help" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-bg transition">
          <HelpCircle className="w-4 h-4" />
          Help
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;