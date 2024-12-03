import { Avatar, createTheme, Dialog, DialogContent, Drawer, FormControl, IconButton, Input, Modal, Switch, ThemeProvider, Typography } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { CommentResponse, Game, ProjectionUserInfoResponse } from "../../utils/types";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Send } from "@mui/icons-material";
import ReplyIcon from '@mui/icons-material/Reply';
import styles from './gameInfoPopup.module.css'
import { Comment } from "./comment";
import TuneIcon from '@mui/icons-material/Tune';
import { createComment, deleteComment, getComments, getRegisteredUsers } from "@/app/services/gameServices";

interface gameInfoProps {
  open: boolean,
  handleClose: () => void,
  game: Game
}

const NewDrawer = styled(Drawer)({
  position: "relative",
  width: 400,
  flexGrow: 1,
  "& .MuiDrawer-paper": {
    width: 400,
    position: "absolute",
    transition: "none !important",
    backgroundColor: 'rgb(18,18,18)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
  }
})

export const CommentFormControl = styled(FormControl)`
  width: 100%;
`;

const theme = createTheme({
  components: {
    MuiInput: {
      styleOverrides: {
        root: {
          color: 'white',
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: 400,
        },
        underline: {
          "&:before": {
            borderBottom: "1px solid white",
          },
          "&:after": {
            borderBottom: `2px solid white`,
          },
          "&:hover:before": {
            borderBottom: `1px solid white !important`,
          },
        },
      },
    },
  },
});

export function GameInfoPopup({open, handleClose, game}: gameInfoProps) {

  const [openRegistered, setOpenRegistered] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<ProjectionUserInfoResponse[]>([]);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyCheck, setReplyCheck] = useState("");
  const [parentIdForReply, setParentIdForReply] = useState(0);
  const [displaySettings, setDisplaySettings] = useState(false);


  const [checked, setChecked] = useState({
    userID: false,
    email: false,
    firstName: true,
    lastName: true,
    profile: true,
    address: false,
    province: false,
    city: false
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked({
      ...checked,
      [event.target.name]: event.target.checked,
    });
  };

  const inputRef = useRef<HTMLInputElement>();

  const getGameInfo = async () => {
    await refreshComments();
    await refreshRegisteredUsers();
  }

  const refreshRegisteredUsers = async () => {
    const users = await getRegisteredUsers(game.inviteID, checked);
    setRegisteredUsers(users);
  }

  const refreshComments = async () => {
    const comments = await getComments(game.inviteID);
    setComments(comments)
  }

  const handleOpenRegistered = () => {
    setOpenRegistered(true);
  }

  const handleCloseRegistered = () => {
    setOpenRegistered(false);
  }

  const resetCommentStates = () => {
    setNewComment("");
    setParentIdForReply(0);
    setReplyCheck("");
  }

  const sendComment = async () => {
    const requestBody = {
      content: newComment,
      userID: 1,
      inviteID: game.inviteID,
      parentID: parentIdForReply,
    }
    const result = await createComment(requestBody);
    if (result) {
      await refreshComments();
      resetCommentStates();
    } else {
      console.log('Failed to create comment');
    }
  }

  const performDeleteComment = async (commentId: number) => {
    const result = await deleteComment(commentId);
    if (result) {
      await refreshComments();
    } else {
      console.log('Failed to delete comment');
    }
  }

  const setupReplyInput = (commentId: number, name: string) => {
    setParentIdForReply(commentId);
    setNewComment(name + " ");
    setReplyCheck(name);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (replyCheck) {
      if (!e.target.value.includes(replyCheck)) {
        setReplyCheck("");
        setParentIdForReply(0);
      }
    }
    setNewComment(e.target.value);
  }

  const closeDialog = () => {
    resetCommentStates();
    handleClose();
  }

  useEffect(() => {
    getGameInfo();
  }, [open])

  useEffect(() => {
    refreshRegisteredUsers();
  }, [checked])
  
  return (
    <Dialog 
      open={open}
      onClose={closeDialog}
      PaperProps={{
        sx: {
          backgroundColor: 'rgb(18,18,18)',
          color: 'white',
          maxWidth: 'min-content',
          flexDirection: 'row'
        },
      }}
    >
      <DialogContent className='flex flex-col gap-3 py-4 px-6'>
        <div className="flex flex-row justify-between items-center w-full">
          <Typography variant='h4' className='p-2 font-bold'>{game.title}</Typography>
          <div className="flex flex-row justify-end gap-1 cursor-pointer hover:bg-hover-color p-1 hover:rounded-lg" onClick={handleOpenRegistered}>
            <p>{game.enrolled}/{game.capacity}</p>
            <PersonIcon sx={{color: 'white'}}/>
          </div>
          <Modal
            open={openRegistered}
            onClose={handleCloseRegistered}
          >
            <div className={`${styles.modal}`}>
              <div className="flex flex-row justify-between items-center border-b-2 border-b-hover-color px-4 py-2">
                <div className="flex items-center flex-row gap-4">
                  <Typography variant='h6' className=''>Registered</Typography>
                  <IconButton onClick={() => {setDisplaySettings(true);}} >
                    <TuneIcon sx={{color: 'white'}}/>
                  </IconButton>
                </div>
                <IconButton onClick={handleCloseRegistered}>
                  <CloseIcon sx={{color: 'white'}}/>
                </IconButton>
              </div>
              <div className={`px-4 py-2 flex flex-col gap-2 max-h-[300px] ${styles.modalScroll} overflow-y-scroll`}>
                {registeredUsers.map((user, index) => (
                  <div className="flex flex-row gap-2 items-center" key={index}>
                    {checked.profile && (user.profile ? <Avatar src={user.profile} /> : <Avatar />)}
                    <div className="flex flex-col text-sm">
                      {checked.userID && <p>{"UserID: " + user.userID}</p>}
                      {(checked.firstName || checked.lastName) &&
                        <p>
                        Name: 
                        {user.firstName ? " " + user.firstName: ''} 
                        {user.lastName ? " " + user.lastName: ''}
                        </p>
                      }
                      {checked.email && <p>{"Email: " + user.email}</p>}
                      {checked.address && <p>{"Address: " + user.address}</p>}
                      {checked.city && <p>{"City: " + user.city}</p>}
                      {checked.province && <p>{"Province: " + user.province}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
          <Modal
            open={displaySettings}
            onClose={() => {setDisplaySettings(false);}}
          >
            <div className={`${styles.userinfomodal}`}>
              <div className="flex flex-row justify-between items-center border-b-2 border-b-hover-color px-4 py-2">
                <div className="flex items-center flex-row gap-4">
                  <Typography variant='h6' className=''>User Info to Display</Typography>
                </div>
                <IconButton onClick={() => {setDisplaySettings(false);}}>
                  <CloseIcon sx={{color: 'white'}}/>
                </IconButton>
              </div>
              <div className={`px-4 py-2 grid grid-cols-3 gap-2`}>
                <div className="flex flex-row items-center justify-between">
                  <p>User ID</p>
                  <Switch checked={checked.userID} onChange={handleChange} name="userID" />
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Email</p>
                  <Switch checked={checked.email} onChange={handleChange} name="email" />
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>First Name</p>
                  <Switch checked={checked.firstName} onChange={handleChange} name="firstName" />
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Last Name</p>
                  <Switch checked={checked.lastName} onChange={handleChange} name="lastName" />
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Profile Pic</p>
                  <Switch checked={checked.profile} onChange={handleChange} name="profile" />
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Address</p>
                  <Switch checked={checked.address} onChange={handleChange} name="address" />
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>Province</p>
                  <Switch checked={checked.province} onChange={handleChange} name="province" />
                </div>
                <div className="flex flex-row items-center justify-between">
                  <p>City</p>
                  <Switch checked={checked.city} onChange={handleChange} name="city" />
                </div>
              </div>
            </div>
          </Modal>
        </div>
        {game.pictureSrc ? (
          <img src={game.pictureSrc} alt={game.altDescription}/>
          ) : (
            <div className="h-[340px]">
              <svg
                className="w-full h-full text-[#a1a1a1]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3v18h18V3H3zm7 13a3 3 0 100-6 3 3 0 000 6zm0 0L5 7"
                />
              </svg>
            </div>
          )}
        <div className="flex flex-row justify-between">
          <div className="grid grid-cols-1 gap-3 w-max">
            <p><span className="font-bold">Booked Time:</span> {game.bookingTime}</p>
            <p><span className="font-bold">Location: </span>{game.address}, {game.city}, {game.province}, {game.postalCode}</p>
            <p><span className="font-bold">Court Number: </span>{game.courtNumber}</p>
          </div>
        </div>
        <div>
          <p className="font-bold">Game Description</p>
          {game.description}
        </div>
      </DialogContent>
      <NewDrawer
        variant="permanent"
        anchor="right"
      >
        <div className={`flex flex-col ${styles.modalScroll} gap-2 flex-grow overflow-y-auto px-2 py-3`}>
          {comments.map((comment) => (
            <Comment 
              comment={comment} 
              delComment={performDeleteComment} 
              replyComment={false}
              setParent={setupReplyInput} 
              key={comment[2]}
            />
          ))}
        </div>
        <div className="flex flex-row gap-2 pt-2 pb-1 px-2 border-t-hover-color border-t">
          <CommentFormControl variant="standard">
            <ThemeProvider theme={theme}>
              <Input
                inputRef={inputRef}
                placeholder="Add a comment..."
                value={newComment}
                onChange={handleInputChange}
              />
            </ThemeProvider>
          </CommentFormControl>
          <IconButton size="small" className="text-white" onClick={sendComment}>
            {parentIdForReply ? <ReplyIcon sx={{transform: 'scaleX(-1)'}}/> : <Send/>}
          </IconButton>
        </div>
      </NewDrawer>
    </Dialog>
  )
}
