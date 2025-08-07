import { Link, Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="flex">
      <div className="flex flex-col w-64 h-screen px-4 py-8 bg-white border-r">
        <h2 className="text-3xl font-semibold text-gray-800">My App</h2>
        <div className="flex flex-col justify-between mt-6">
          <aside>
            <ul>
              <li>
                <Link
                  to="/inder/main-menu-1/sub-menu-1"
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md"
                >
                  Sub Menu 1
                </Link>
              </li>
              <li>
                <Link
                  to="/inder/main-menu-1/sub-menu-2"
                  className="flex items-center px-4 py-2 mt-5 text-gray-600 rounded-md hover:bg-gray-200"
                >
                  Sub Menu 2
                </Link>
              </li>
              <li>
                <Link
                  to="/inder/main-menu-2/sub-menu-3"
                  className="flex items-center px-4 py-2 mt-5 text-gray-600 rounded-md hover:bg-gray-200"
                >
                  Sub Menu 3
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </div>
      <div className="w-full p-4">
        <Outlet />
      </div>
    </div>
  );
}
