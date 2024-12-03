import { Avatar } from '@mui/material'
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useEffect, useState } from 'react';
import { getReplies } from '@/app/services/gameServices';
import { CommentResponse } from '@/app/utils/types';
import { useUserContext } from '@/app/GlobalContext';

interface CommentProps {
  comment: CommentResponse,
  delComment: (cid: number) => Promise<void>,
  replyComment: boolean,
  setParent: (num: number, name: string) => void,
}

export function Comment({comment, delComment, replyComment, setParent}: CommentProps) {
  const firstName = comment[0]
  const lastName = comment[1]
  const commentId = comment[2]
  const content = comment[3]
  const author = comment[4];

  const { userID } = useUserContext();

  const [replies, setReplies] = useState<CommentResponse[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchReplies();
  }, [comment])
  
  const fetchReplies = async () => {
    const results = await getReplies(commentId);
    setReplies(results);
  }

  const handleDelete = async () => {
    await delComment(commentId);
  }

  const handleReply = () => {
    setParent(commentId, "@" + firstName + " " + lastName);
  }

  const openReplies = async () => {
    setOpen(true);
  }

  const closeReplies = async () => {
    setOpen(false);
  }

  if (!replyComment) {
    return (
      <div className='flex flex-row gap-4'>
        <Avatar/>
        <div className='flex flex-col gap-1 leading-normal text-white'>
          <p className='text-sm'>
            <strong>{firstName} {lastName}</strong> {content}
          </p>
          <div className='flex flex-row gap-2'>
            <div className={`flex items-center justify-center h-4 text-[rgb(255,255,255,0.5)] cursor-pointer`} onClick={handleReply}>
              <ReplyIcon sx={{width: '16px', height: '16px'}}/>
            </div>
            {userID === author && 
              <div className='flex items-center justify-center h-4 text-[rgb(255,255,255,0.5)] cursor-pointer' onClick={handleDelete}>
                <DeleteIcon sx={{width: '16px', height: '16px'}}/>
              </div>
            }
          </div>
          {replies.length != 0 ? (
            open ? (
              <div className='flex flex-col gap-2'>
                <div className='flex items-center h-4 text-xs text-[rgb(255,255,255,0.5)] cursor-pointer' onClick={closeReplies}>
                  <ArrowDropUpIcon sx={{width: '16px', height: '16px'}}/> Replies
                </div>
                {replies.map((reply) => (
                  <Comment 
                    comment={reply} 
                    delComment={delComment} 
                    replyComment={true}
                    setParent={setParent}
                    key={reply[0]} 
                  />
                ))}
              </div>
            ) : (
              <div className='flex items-center h-4 text-xs text-[rgb(255,255,255,0.5)] cursor-pointer' onClick={openReplies}>
                <ArrowDropDownIcon sx={{width: '16px', height: '16px'}}/> Replies
              </div>
            )
          ) : (
            null
          )}
        </div>
      </div>
    )
  } else {
    return (
      <div className='flex flex-row gap-4'>
        <Avatar/>
        <div className='flex flex-col gap-1 leading-normal text-white'>
          <p className='text-sm'>
            <strong>{firstName} {lastName}</strong> {content}
          </p>
          <div className='flex'>
            {userID === author && 
              <div className='flex items-center justify-center h-4 text-[rgb(255,255,255,0.5)] cursor-pointer' onClick={handleDelete}>
                <DeleteIcon sx={{width: '16px', height: '16px'}}/>
              </div>
            }
          </div>
        </div>
      </div>  
    )
  }
  
}
