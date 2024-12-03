"use client";
import GameManager from "../upcomingComponents/gameManager";
import React, { useEffect, useState } from "react";
import { useUserContext } from "../GlobalContext";
import { JoinableGame } from "../utils/types";
import { deleteGame, getJoinableGames, getLocations, joinGame } from "../services/gameServices";
import { Button, Chip, Collapse, FormControl, FormControlLabel, MenuItem, Modal, Popper, Radio, RadioGroup, Select, styled, Switch, TextField, Typography } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import styles from "./homePage.module.css";
import { FilterInput } from "../components/filterInput/filterInput";

const StyledSelect = styled(Select)<{ value: string }>(() => ({
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "white",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "white",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "white",
  },
  "& .MuiSelect-select": {
    color: "white"
  },
  "& .MuiSelect-icon": {
    color: 'white'
  },
}));

export function HomePage() {
  const { userID } = useUserContext();
  const [data, setData] = useState<JoinableGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [noGames, setNoGames] = useState(false);
  const [openJoinResult, setOpenJoinResult] = useState(false);
  const [openDeleteResult, setOpenDeleteResult] = useState(false);
  const [joinMessage, setJoinMessage] = useState<[Boolean, string] | []>([]);
  const [deleteMessage, setDeleteMessage] = useState<[Boolean, string] | []>([]);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [postalCodes, setPostalCodes] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [andOR, setAndOr] = useState("AND");
  const [filterBy, setFilterBy] = useState("address");
  const [filterClauses, setFilterClauses] = useState<string[]>([]);

  useEffect(() => {
    handleGetJoinableGames();
  }, [userID]);

  useEffect(() => {
    handleGetLocationFilters();
  }, [])

  const handleGetLocationFilters = async () => {
    const response = await getLocations();
    if (response.status === 200) {
      setAddresses(response.data.addresses);
      setPostalCodes(response.data.postalCodes);
      setCities(response.data.cities);
      setProvinces(response.data.provinces);
    } else {
      console.log("failed to get location filters");
    }
  }

  const handleGetJoinableGames = async () => {
    const games = await getJoinableGames(userID!, filterClauses);
    console.log(games);
    if (games.length > 0) {
      setNoGames(false);
      setData(games);
    } else {
      setNoGames(true);
      console.log("failed to fetch games");
    }
    setLoading(false);
  }

  const handleDeleteGame = async (inviteID: number) => {
    const result = await deleteGame(inviteID);
    if (result) {
      await handleGetJoinableGames();
      setDeleteMessage([true, "Game was successfully deleted."]);
    } else {
      setDeleteMessage([false, "There was an issue when deleting the game."]);
    }
    setOpenDeleteResult(true);
  }

  const handleJoinGame = async (userID: number, inviteID: number, title: string) => {
    const params = {
      userID,
      inviteID
    }
    const result = await joinGame(params);
    if (result) {
      await handleGetJoinableGames();
      setJoinMessage([true, "You have registered for Game: " + title]);
    } else {
      setJoinMessage([false, "There was an issue with registering you for the Game: " + title]);
    }
    setOpenJoinResult(true);
  }

  const handleCloseJoinGame = () => {
    setOpenJoinResult(false)
  }

  const addClause = (value: string) => {
    let prefix;
    switch (filterBy) {
      case "city":
        prefix = "cl."
        break;
      case "province": 
        prefix = "pl."
        break;
      default:
        prefix = "l."
    }
    setFilterClauses((prev) => [...prev, andOR + " " + prefix + filterBy + " = \'" + value + "\'"]);
  }

  const determineFilterOptions = () => {
    if (filterBy === "address") {
      return addresses;
    } else if (filterBy === "postalCode") {
      return postalCodes;
    } else if (filterBy === "city") {
      return cities;
    } else {
      return provinces;
    }
  }

  const handleDeleteClause = (index: number) => {
    setFilterClauses((prevList) => prevList.filter((_item, i) => i !== index));
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center w-full max-w-[100%]">
        <h1 className="text-4xl font-bold text-center mb-4">JOIN A GAME</h1>
        <div className="flex flex-col mb-8 w-full">
          <Typography variant="h5" className="font-bold text-center">Filter Displayed Games</Typography>
          <div>
            <div className={styles.collapse} onClick={() => setOpenCollapse(!openCollapse)}>
              {openCollapse ? "Close Filter Options" :  "Open Filter Options"} 
              {openCollapse ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/> }
            </div>
            <Collapse in={openCollapse}>
              <div className={styles.filtersContainer}>
                <FormControl>
                  <RadioGroup
                    row
                    className='gap-4'
                    value={andOR}
                    onChange={(_e, newValue) => {setAndOr(newValue)}}
                  >
                    <FormControlLabel value="AND" control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }} />} label="AND" />
                    <FormControlLabel value="OR" control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }} />} label="OR" />
                  </RadioGroup>
                </FormControl>
                <div className='flex flex-row gap-2 items-center w-full'>
                  <StyledSelect
                    fullWidth
                    displayEmpty
                    value={filterBy}
                    onChange={(e) => {setFilterBy(e.target.value as string)}}
                    size='small'
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: '#2C2C2C',
                          color: 'white',
                          maxHeight: '300px',
                          "&::-webkit-scrollbar": {
                            width: '4px',
                          },
                          "&::-webkit-scrollbar-thumb": {
                            width: '2px',
                            backgroundColor: '#5a5a5a',
                            borderRadius: '8px'
                          },
                          "&::-webkit-scrollbar-track": {
                            backgroundColor: '#2C2C2C',
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value={"address"}>Address</MenuItem>
                    <MenuItem value={"postalCode"}>Postal Code</MenuItem>
                    <MenuItem value={"city"}>City</MenuItem>
                    <MenuItem value={"province"}>Province</MenuItem>
                  </StyledSelect>
                </div>
                <FilterInput placeholder={filterBy.charAt(0).toUpperCase() + filterBy.slice(1)} addClause={addClause} calcOptions={determineFilterOptions}/>
                <div className={styles.clauseContainer}>
                  <div className="grid grid-cols-4 gap-2">
                    {filterClauses.map((clause, index) => (
                      <Chip
                        key={clause + index}
                        label={clause}
                        onDelete={() => handleDeleteClause(index)}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255,255,255,0.5)'
                          },
                          '& .MuiChip-deleteIcon:hover': {
                            color: 'rgba(255,255,255,0.9)'
                          },
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-row gap-2">
                    <Button 
                      variant='outlined' 
                      size='small' 
                      className='text-white border-white hover:bg-hover-color' 
                      onClick={() => setFilterClauses([])}
                    >
                      Clear
                    </Button>
                    <Button 
                      variant='outlined' 
                      size='small' 
                      className='text-white border-white hover:bg-hover-color'
                      onClick={handleGetJoinableGames}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </Collapse>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : noGames ? (
          <p className="text-lg">There are no games to join</p>
        ) : (
          <GameManager games={data} handleDelete={handleDeleteGame} joinable={true} handleJoin={handleJoinGame} />
        )}
      </main>
      <Modal 
          open={openJoinResult}
          onClose={handleCloseJoinGame}
      >
        <div className='flex flex-col delete-game-modal items-center gap-3'>
            <Typography variant='h6' className={`flex items-center ${joinMessage[0] ? 'text-green-400' : 'text-red-400'}`}>
                {joinMessage[1]}
            </Typography>
        </div>
      </Modal>
      <Modal 
          open={openDeleteResult}
          onClose={() => setOpenDeleteResult(false)}
      >
        <div className='flex flex-col delete-game-modal items-center gap-3'>
            <Typography variant='h6' className={`flex items-center ${deleteMessage[0] ? 'text-green-400' : 'text-red-400'}`}>
                {deleteMessage[1]}
            </Typography>
        </div>
      </Modal>
    </div>
  );
}
