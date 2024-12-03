import { useState } from 'react';
import './gameCard.css';
import { GameInfoPopup } from '../components/gameInfoPopup/gameInfoPopup';
import { Button, IconButton, Modal, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUserContext } from '../GlobalContext';

function GameCard({ gameData, handleDelete, joinable, handleJoin }) {
    const { userID } = useUserContext();
    const [open, setOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const handleOpenDelete = (e) => {
        setOpenDelete(true);
        e.stopPropagation();
    }

    const handleCloseDelete = (e) => {
        setOpenDelete(false);
        e.stopPropagation();
    }

    const handleDeleteGame = () => {
        handleDelete(gameData.inviteID);
    }

    const handleJoinGame = async (e) => {
        e.stopPropagation();
        await handleJoin(userID, gameData.inviteID, gameData.title);
    }

    console.log(gameData); // For debugging to see the structure of gameData
    return (
        <>
            <div className="game-card" onClick={handleOpen}>
                <div className="game-card-image">
                    {gameData.pictureSrc ? (
                        <img src={gameData.pictureSrc} alt={gameData.altDescription}/>
                    ) : (
                        <svg
                            className="game-card-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns={gameData.pictureSrc}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 3v18h18V3H3zm7 13a3 3 0 100-6 3 3 0 000 6zm0 0L5 7"
                            ></path>
                        </svg>
                    )}
                </div>
                <div className="game-card-content">
                    <div className='flex flex-row justify-between mb-3 items-center'>
                        <h3 className="game-card-title">
                            {`Game: ${gameData.title || 'Untitled Game'}`}
                        </h3>
                        <div className='flex flex-row gap-2'>
                            {userID === gameData.creator &&
                                <IconButton className='text-[#e0e0e0] cursor-pointer hover:bg-hover-color' onClick={handleOpenDelete}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                            {joinable &&
                                <Button variant='outlined' size='small' className='border-2 border-[#e0e0e0] text-[#e0e0e0] cursor-pointer hover:bg-hover-color' onClick={handleJoinGame}>
                                    Join
                                </Button>
                            }
                        </div>
                    </div>
                    <p className="game-card-details">
                        Court: {gameData.courtNumber} | {gameData.address}, {gameData.city},{' '}
                        {gameData.province} | {gameData.postalCode}
                    </p>
                    <p className="game-card-court-type">Court Type: {gameData.surfaceMaterial}</p>
                    <p className="game-card-booking">
                        Booking Time: {gameData.bookingTime || 'TBD'}
                    </p>
                </div>
            </div>
            <GameInfoPopup open={open} handleClose={handleClose} game={gameData}/>
            <Modal 
                open={openDelete}
                onClose={handleCloseDelete}
            >
                <div className='flex flex-col delete-game-modal items-center gap-3'>
                    <Typography variant='h6' className='flex items-center'>
                        Are you sure you want to delete this Game?
                    </Typography>
                    <div className='flex flex-row justify-between w-fit gap-16'>
                        <Button variant='outlined' size='small' className='text-white border-2 border-white hover:bg-hover-color cursor-pointer' onClick={handleCloseDelete}>
                            Cancel
                        </Button>
                        <Button variant='outlined' size='small' className='text-white border-2 border-white  hover:bg-hover-color cursor-pointer' onClick={handleDeleteGame}>
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export default GameCard;
