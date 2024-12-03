"use client";

import { useState } from "react";
import { SideBar } from "./components/sideBar";
import { HomePage } from "./panels/homePage";
import { HistoryPage } from "./panels/historyPage";
import { UpcomingPage } from "./panels/upcomingPage";
import { LoggedOutPage } from "./panels/loggedOutPage";
import { AdminPage } from "./panels/adminPage";
import { RightSidebar } from "./components/rightSideBar";
import { UserProvider } from "./GlobalContext";

export enum Page {
  HOME,
  UPCOMING,
  HISTORY,
  ADMIN,
}

function Pages() {
  const [openPanel, setOpenPanel] = useState<Page>(Page.HOME);
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 sticky">
        <SideBar openPanel={openPanel} setOpenPanel={setOpenPanel} />
      </aside>

      {loggedIn && openPanel === Page.HOME && <HomePage></HomePage>}
      {loggedIn && openPanel === Page.UPCOMING && <UpcomingPage></UpcomingPage>}
      {loggedIn && openPanel === Page.HISTORY && <HistoryPage></HistoryPage>}
      {loggedIn && openPanel === Page.ADMIN && <AdminPage></AdminPage>}

      {!loggedIn && (
        <LoggedOutPage loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      )}

      <aside className="w-64 sticky">
        <RightSidebar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      </aside>
    </div>
  );
}

export default function Home() {
  return (
    <UserProvider>
      <Pages />
    </UserProvider>
  );
}
