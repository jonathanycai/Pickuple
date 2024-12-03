"use client";

import { Sidebar } from "flowbite-react";
import { FaTableTennisPaddleBall, FaRegCirclePlay } from "react-icons/fa6";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { FaCalendarCheck } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Button from "@mui/material/Button";
import { Page } from "../page";
import { useState } from "react";
import { CreateGamePopup } from "./createGamePopup/createGamePopup";
import { useUserContext } from "../GlobalContext";

interface SideBarProps {
  openPanel: Page;
  setOpenPanel: (panel: Page) => void;
}

export function SideBar({ openPanel, setOpenPanel }: SideBarProps) {
  const { userID } = useUserContext();
  const [openCreateGame, setOpenCreateGame] = useState(false);

  const handleOpen = () => {
    setOpenCreateGame(true);
  };

  const handleClose = () => {
    setOpenCreateGame(false);
  };

  return (
    <Sidebar className="h-screen px-4 py-6 border-r border-gray-600 sticky top-0">
      <div className="flex flex-col h-full flex-grow justify-between">
        <Sidebar.Items className="flex flex-col">
          <Sidebar.ItemGroup>
            <Sidebar.Item
              className="font-bold text-4xl cursor-pointer p-2"
              icon={FaTableTennisPaddleBall}
              onClick={() => setOpenPanel(Page.HOME)}
            >
              <h1 className="px-2">Pickuple</h1>
            </Sidebar.Item>
          </Sidebar.ItemGroup>
          <Sidebar.ItemGroup className="flex flex-col pt-8 gap-y-4">
            <Sidebar.Item
              className="p-2 font-medium text-2xl hover:bg-hover-color rounded-md cursor-pointer"
              icon={FaRegCirclePlay}
              onClick={() => setOpenPanel(Page.HOME)}
            >
              <h1 className="px-2">Join Game</h1>
            </Sidebar.Item>
            <Sidebar.Item
              className="p-2 font-medium text-2xl hover:bg-hover-color rounded-md cursor-pointer"
              icon={FaCalendarCheck}
              onClick={() => setOpenPanel(Page.UPCOMING)}
            >
              <h1 className="px-2">Upcoming</h1>
            </Sidebar.Item>
            <Sidebar.Item
              className="p-2 font-medium text-2xl hover:bg-hover-color rounded-md cursor-pointer"
              icon={ScheduleIcon}
              onClick={() => setOpenPanel(Page.HISTORY)}
            >
              <h1 className="px-2">History</h1>
            </Sidebar.Item>
            <Sidebar.Item
              className="p-2 font-medium text-2xl hover:bg-hover-color rounded-md cursor-pointer"
              icon={RiAdminFill}
              onClick={() => setOpenPanel(Page.ADMIN)}
            >
              <h1 className="px-2">Admin</h1>
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
        {userID &&
          <Button
            className="px-4 border-white text-white"
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpen}
          >
            Create Game
          </Button>
        }
      </div>
      <CreateGamePopup open={openCreateGame} handleClose={handleClose} />
    </Sidebar>
  );
}
