import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Team } from "./pages/Team/index.jsx";
import { Dashboard } from "./pages/Dashboard/index.jsx";
import { Messages } from "./pages/Messages/index.jsx";
import { Attendance } from "./pages/Attendance/index.jsx";
import "inter-ui/inter.css";
import './App.css'
import favicon from './assets/favicon.png'; // Imported for prod build.
import logo from './assets/logo.png'; // Imported for prod build.

function App() { 

  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "team",
        element: <Team />,
        children: [
          {
            path: ":id",
            element: <Team />,
          },
        ],
      },
      {
        path: "messages/:id",
        element: <Messages />,
      },
      {
        path: "attendance/:eventid",
        element: <Attendance />,
      },
    ],
    {
      basename: '/local/teamup'
    }
  );

  return (
    <div className="page">
      <RouterProvider router={router} />
    </div>
  );
}

export default App
