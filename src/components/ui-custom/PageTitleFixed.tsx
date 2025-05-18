
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  url: string;
}

interface PageTitleProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}

const PageTitleFixed: React.FC<PageTitleProps> = ({ title, breadcrumbs, children }) => {
  return (
    <div className="mb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-2 text-sm text-muted-foreground">
          {breadcrumbs.map((item, index) => {
            if (index === 0) {
              return (
                <Link key={index} to={item.url} className="hover:text-primary hover:underline">
                  {item.label}
                </Link>
              );
            }
            
            return (
              <div key={index} className="flex items-center">
                <ChevronRight className="mx-1 h-4 w-4" />
                {index === breadcrumbs.length - 1 ? (
                  <span>{item.label}</span>
                ) : (
                  <Link to={item.url} className="hover:text-primary hover:underline">
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </div>
  );
};

export default PageTitleFixed;
