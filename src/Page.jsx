import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation, Link } from "react-router-dom";

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
};

export default function Page() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  // Check if we're on a PurchaseOrderForm route (create/edit/view)
  const isPurchaseOrderForm = location.pathname.includes('/procurement/purchase-order/') && 
                             (location.pathname.includes('/create') || 
                              location.pathname.includes('/edit/') || 
                              location.pathname.includes('/view/'));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {!isPurchaseOrderForm && (
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const name = toTitleCase(value.replace(/-/g, ' '));

                    return (
                      <React.Fragment key={to}>
                        <BreadcrumbItem className="hidden md:block">
                          {last ? (
                            <BreadcrumbPage>{name}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={to}>{name}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!last && <BreadcrumbSeparator className="hidden md:block" />}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
        )}
        <div className={isPurchaseOrderForm ? "flex-1 flex flex-col" : "flex flex-1 flex-col gap-4 p-4 pt-0"}>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
