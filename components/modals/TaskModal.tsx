// React & Next
import ReactDom from 'react-dom';
import moment from 'moment';
import { useState, useEffect } from 'react';

// Style
import styled from 'styled-components';
import { UilCommentAltSlash } from '@iconscout/react-unicons';

// Auth
import { useAuth } from '../../utils/auth';

// Firebase
import { firestore } from '../../utils/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import {
 useFirestoreDocument,
 useFirestoreDocumentData,
 useFirestoreDocumentDeletion,
 useFirestoreDocumentMutation,
} from '@react-query-firebase/firestore';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

export default function TaskModal({ closeModal, taskId }: { closeModal: Function; taskId: string }) {
 // Get the current user
 const { currentUser } = useAuth();

 // Get the task
 const taskRef = doc(collection(firestore, 'tasks'), taskId);
 const task = useFirestoreDocumentData(['tasks', taskId], taskRef);
 let priority = task?.data?.priority || '';

 // setting up mutation
 const queryClient = useQueryClient();
 const mutation = useFirestoreDocumentMutation(taskRef, { merge: true });
 const deletion = useFirestoreDocumentDeletion(taskRef);

 // Handle deletion of task
 const deleteTask = async () => {
  closeModal();
  deletion.mutate();
 };

 // Handle archivation of task
 const archiveTask = async () => {
  closeModal();
  mutation.mutate(
   {
    archived: true,
   },
   {
    onSuccess() {
     queryClient.invalidateQueries(['tasks', taskId]);
     queryClient.invalidateQueries(['tasks']);
     toast.success('Document archived!');
    },
    onError() {
     toast.error('Failed to archive document!');
    },
   }
  );
 };

 // Handle unarchivation of task
 const unArchiveTask = async () => {
  closeModal();
  mutation.mutate(
   {
    archived: false,
   },
   {
    onSuccess() {
     queryClient.invalidateQueries(['tasks', taskId]);
     queryClient.invalidateQueries(['tasks']);
     toast.success('Document unarchived!');
    },
    onError() {
     toast.error('Failed to unarchive document!');
    },
   }
  );
 };

 /*
  ----------------------------
  Handling the comment section
  ----------------------------
  */

 // adding new comments
 const [comment, setComment] = useState('');

 const handleInputChange = (e: any) => {
  setComment(e.target.value);
 };

 // handle submitting comment
 const handleChatSubmit = async (e: any) => {
  e.preventDefault();
  mutation.mutate(
   {
    comments: [
     ...task?.data?.comments,
     {
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      text: comment,
      timestamp: Timestamp.now(),
     },
    ],
   },
   {
    onSuccess() {
     queryClient.invalidateQueries(['tasks', taskId]);
     queryClient.invalidateQueries(['tasks']);
     toast.success('Successfully added comment!');
    },
    onError() {
     toast.error('Failed to comment!');
    },
   }
  );
  setComment('');
 };

 /*
  ----------------------------
  Handling editable fields
  ----------------------------
  */

 // closing all editable fields

 // Handle Title Editing
 const [titleEditMode, setTitleEditMode] = useState(false);
 const editTitleModeOnClick = (e: any) => {
  setTitleEditMode(!titleEditMode);
 };
 const [titleInput, setTitleInput] = useState(task?.data?.title || 'No title added yet');
 const onTitleChange = (e: any) => {
  setTitleInput(e.target.value);
 };
 const handleTitleSubmit = (e: any) => {
  e.preventDefault();
  mutation.mutate(
   {
    title: titleInput,
   },
   {
    onSuccess() {
     queryClient.invalidateQueries(['tasks', taskId]);
     queryClient.invalidateQueries(['tasks']);
     toast.success('Updated the title!');
    },
    onError() {
     toast.error('Failed to update task!');
    },
   }
  );
  setTitleEditMode(false);
 };

 // Handle Summary Editing
 const [summaryEditMode, setSummaryEditMode] = useState(false);
 const editSummaryModeOnClick = (e: any) => {
  setSummaryEditMode(!summaryEditMode);
 };
 const [summaryInput, setSummaryInput] = useState(task?.data?.summary || 'No summary added yet');
 const onSummaryChange = (e: any) => {
  setSummaryInput(e.target.value);
 };
 const handleSummarySubmit = (e: any) => {
  e.preventDefault();
  mutation.mutate(
   {
    summary: summaryInput,
   },
   {
    onSuccess() {
     queryClient.invalidateQueries(['tasks', taskId]);
     queryClient.invalidateQueries(['tasks']);
     toast.success('Updated the summary!');
    },
    onError() {
     toast.error('Failed to update task!');
    },
   }
  );
  setSummaryEditMode(false);
 };

 // Handle Description Editing
 const [descriptionEditMode, setDescriptionEditMode] = useState(false);
 const editDescriptionModeOnClick = (e: any) => {
  setDescriptionEditMode(!descriptionEditMode);
 };
 const [descriptionInput, setDescriptionInput] = useState(
  task?.data?.description || 'No description added yet'
 );
 const onDescriptionChange = (e: any) => {
  setDescriptionInput(e.target.value);
 };
 const handleDescriptionSubmit = (e: any) => {
  e.preventDefault();
  mutation.mutate(
   {
    description: descriptionInput,
   },
   {
    onSuccess() {
     queryClient.invalidateQueries(['tasks', taskId]);
     queryClient.invalidateQueries(['tasks']);
     toast.success('Updated the description!');
    },
    onError() {
     toast.error('Failed to update task!');
    },
   }
  );
  setDescriptionEditMode(false);
 };

 if (task.isLoading) {
  return ReactDom.createPortal(<div>Loading...</div>, document.getElementById('portal'));
 }

 return ReactDom.createPortal(
  <>
   <GreyBackground onClick={() => closeModal()}>
    <ModalWrapper
     onClick={(e: any) => {
      /* Closing title edit mode on click outside */
      titleEditMode && e.target.localName !== 'input' && setTitleEditMode(false);

      /* Closing summary edit mode on click outside */
      summaryEditMode && e.target.localName !== 'input' && setSummaryEditMode(false);

      /* Closing description edit mode on click outside */
      descriptionEditMode && e.target.localName !== 'input' && setDescriptionEditMode(false);

      e.stopPropagation();
     }}
    >
     <Header>
      <HeaderPills>
       <IdentifierPill>
        <p>{task?.data?.identifier}</p>
       </IdentifierPill>
       <DeleteButton onClick={deleteTask}>
        <p>delete</p>
       </DeleteButton>
       {task?.data?.archived ? (
        <ArchiveButton onClick={unArchiveTask}>
         <p>unarchive</p>
        </ArchiveButton>
       ) : (
        <ArchiveButton onClick={archiveTask}>
         <p>archive</p>
        </ArchiveButton>
       )}
      </HeaderPills>
      <CloseButton onClick={() => closeModal()} viewBox='0 0 17 19'>
       <path d='M1 1L16 18M16 1L1 18' stroke='black' />
      </CloseButton>
     </Header>

     <TitleRow>
      {/* Handle editing of Project Title */}
      {titleEditMode ? (
       <form onSubmit={handleTitleSubmit} style={{ textAlign: 'center' }}>
        <TitleEdit defaultValue={titleInput} onChange={onTitleChange}></TitleEdit>
        <input
         type='submit'
         style={{
          visibility: 'hidden',
          display: 'none',
          width: '0',
          height: '0',
         }}
        />
       </form>
      ) : (
       <Title editable={true} onClick={editTitleModeOnClick}>
        {task?.data?.title}
       </Title>
      )}

      <p>
       Created{' '}
       {moment(new Date(task?.data?.timestamp.seconds * 1000))
        .fromNow()
        .toString()}
      </p>
     </TitleRow>
     <Content>
      <LeftSection>
       <TextArea>
        <SubSection>
         <h3>Summary</h3>
         {/* Handle editing of summary section */}
         {summaryEditMode ? (
          <form onSubmit={handleSummarySubmit} style={{ textAlign: 'center' }}>
           <SummaryEdit defaultValue={summaryInput} onChange={onSummaryChange}></SummaryEdit>
           <input
            type='submit'
            style={{
             visibility: 'hidden',
             display: 'none',
             width: '0',
             height: '0',
            }}
           />
          </form>
         ) : (
          <Summary editable={true} onClick={editSummaryModeOnClick}>
           {task?.data?.summary}
          </Summary>
         )}
        </SubSection>
        <SubSection>
         <h3>Description</h3>
         {/* Handle editing of Project Description */}
         {descriptionEditMode ? (
          <form onSubmit={handleDescriptionSubmit} style={{ textAlign: 'center' }}>
           <DescriptionEdit defaultValue={descriptionInput} onChange={onDescriptionChange}></DescriptionEdit>
           <input
            type='submit'
            style={{
             visibility: 'hidden',
             display: 'none',
             width: '0',
             height: '0',
            }}
           />
          </form>
         ) : (
          <Description editable={true} onClick={editDescriptionModeOnClick}>
           {task?.data?.description}
          </Description>
         )}
        </SubSection>
       </TextArea>
       <div className='comments-area'>
        <h3>Activity</h3>
        <div>
         <CommentHistory>
          {task?.data?.comments.length > 0 ? (
           task?.data?.comments
            .sort((a: any, b: any) => {
             if (a.timestamp < b.timestamp) {
              return -1;
             } else {
              return 1;
             }
            })
            .map((comment: any, index: number) => {
             if (comment.authorId === currentUser.uid) {
              return (
               <OwnComment>
                <OwnCommentBubble>
                 {comment.text}
                 <ChatTimeStamp>
                  {moment(new Date(comment.timestamp.seconds * 1000))
                   .fromNow()
                   .toString()}
                 </ChatTimeStamp>
                </OwnCommentBubble>
               </OwnComment>
              );
             } else {
              return (
               <ForeignComment>
                <ForeignCommentBubble>
                 <ForeignUserName>{comment.authorName}</ForeignUserName>
                 {comment.text}
                 <ChatTimeStamp>
                  {moment(new Date(comment.timestamp.seconds * 1000))
                   .fromNow()
                   .toString()}
                 </ChatTimeStamp>
                </ForeignCommentBubble>
               </ForeignComment>
              );
             }
            })
          ) : (
           <NoCommentText>
            <UilCommentAltSlash size='50' />
            <p> No comments yet.</p>
            <p>Be the first one to post something!</p>
           </NoCommentText>
          )}
         </CommentHistory>
         <div>
          <form onSubmit={handleChatSubmit}>
           <Input
            type='text'
            placeholder='Add a comment...'
            onChange={handleInputChange}
            value={comment}
           ></Input>
          </form>
         </div>
        </div>
       </div>
      </LeftSection>

      <RightSection>
       <SubSection>
        <h3>Priority</h3>
        <PriorityPill priority={priority}>
         <p>{task?.data?.priority}</p>
        </PriorityPill>
       </SubSection>

       <SubSection>
        <h3>Status</h3>
        <StatusPill>
         <p>{task?.data?.status}</p>
        </StatusPill>
       </SubSection>

       <SubSection>
        <h3>Assigned To</h3>
        {/* {task.taskAssignedToUsers &&
                  task.taskAssignedToUsers.map((user) => {
                    return <UserCard user={user}></UserCard>;
                  })} */}
       </SubSection>

       <SubSection>
        <h3>Author</h3>
        {/* <UserCard user={task.author}></UserCard> */}
       </SubSection>
      </RightSection>
     </Content>
    </ModalWrapper>
   </GreyBackground>
  </>,
  document.getElementById('portal')
 );
}

/* Styled Components */

interface EditableStyleProps {
 editable: boolean;
}

interface PriorityStyleProps {
 priority: string;
}

const GreyBackground = styled.div`
 position: fixed;
 width: 100vw;
 height: 100vh;
 top: 0;
 left: 0;
 right: 0;
 bottom: 0;
 background-color: rgba(0, 0, 0, 0.7);
 z-index: 100000;
`;

const ModalWrapper = styled.div`
 width: 70%;
 max-width: 700px;
 position: fixed;
 top: 50%;
 left: 50%;
 transform: translate(-50%, -50%);
 background-color: #fff;
 padding: 30px;
 z-index: 100000;
 border-radius: 25px;
 -webkit-box-shadow: 0px 5px 50px 10px rgba(0, 0, 0, 0.45);
 box-shadow: 0px 5px 50px 10px rgba(0, 0, 0, 0.45);
 display: flex;
 flex-direction: column;
 gap: 20px;
`;

const Header = styled.div`
 display: flex;
 flex-direction: row;
 align-items: center;
 justify-content: space-between;
`;

const HeaderPills = styled.div`
 display: flex;
 flex-direction: row;
 gap: 10px;
`;

const IdentifierPill = styled.div`
 background-color: #35307e;
 color: white;
 border-radius: 6px;
 padding: 5px 10px 5px 10px;
 margin: 0px;
 width: fit-content;
 height: fit-content;
 font-size: medium;
 font-weight: 400;
 transition: 0.15s;
`;

const DeleteButton = styled.div`
 background-color: #e96262;
 color: white;
 border-radius: 6px;
 padding: 5px 10px 5px 10px;
 margin: 0px;
 width: fit-content;
 height: fit-content;
 font-size: medium;
 font-weight: 400;
 transition: 0.15s;
 cursor: pointer;
`;

const ArchiveButton = styled(DeleteButton)`
 background-color: #f8b965;
`;

const CloseButton = styled.svg.attrs({
 width: '24',
 height: '24',
 fill: 'none',
 xmlns: 'http://www.w3.org/2000/svg',
})`
 cursor: pointer;
`;

const TitleRow = styled.div`
 display: flex;
 flex-direction: column;
 gap: 10px;
 margin-bottom: 20px;
`;

const Title = styled.h1<EditableStyleProps>`
 font-size: xx-large;
 font-weight: bold;
 padding: 5px 5px 5px 5px;
 margin: -5px;
 color: #35307e;
 :hover {
  outline: ${(props) => {
   if (props.editable) {
    return 'solid';
   } else {
    return 'none';
   }
  }};
  border-radius: 5px;
  outline-width: 1.5px;
 }
`;

const TitleEdit = styled.input`
 width: 100%;
 font-size: xx-large;
 font-weight: bold;
 padding: 5px 5px 5px 5px;
 margin: -5px;
 color: #35307e;
 border-radius: 5px;
 outline-width: 1.5px;
 outline-color: #35307e;
`;

const Content = styled.div`
 display: flex;
 flex-direction: row;
 justify-content: space-between;
 align-items: flex-start;
 gap: 20px;
 & * > h3 {
  color: #35307e;
  font-weight: bolder;
 }
`;

const Section = styled.div`
 display: flex;
 flex-direction: column;
 gap: 20px;
`;

const LeftSection = styled(Section)`
 width: 60%;
`;
const RightSection = styled(Section)`
 width: 40%;
`;

const SubSection = styled.div`
 display: flex;
 flex-direction: column;
 gap: 5px;
 height: 100%;
`;

const Summary = styled.p<EditableStyleProps>`
 padding: 2px 2px 2px 2px;
 margin: -2px;
 :hover {
  outline: ${(props) => {
   if (props.editable) {
    return 'solid';
   } else {
    return 'none';
   }
  }};
  border-radius: 5px;
  outline-width: 1.5px;
 }
`;

const SummaryEdit = styled.input`
 width: 100%;
 padding: 2px 2px 2px 2px;
 margin: -2px;
 border-radius: 5px;
 outline-width: 1.5px;
`;

const Description = styled(Summary)``;

const DescriptionEdit = styled(SummaryEdit)``;

const TextArea = styled.div`
 display: flex;
 flex-direction: column;
 gap: 20px;
`;

const PriorityPill = styled.div<PriorityStyleProps>`
 color: white;
 border-radius: 6px;
 padding: 5px 10px 5px 10px;
 margin: 0px;
 width: fit-content;
 height: fit-content;
 font-size: medium;
 font-weight: 400;
 background-color: ${(props) => {
  if (props.priority === 'low') return '#45da5e';
  else if (props.priority === 'medium') return '#f8b965';
  else return '#e96262';
 }};
`;

const StatusPill = styled.div`
 border-radius: 6px;
 padding: 5px 10px 5px 10px;
 margin: 0px;
 border-style: solid;
 border-width: 1px;
 border-color: #dadada;
 width: fit-content;
 height: fit-content;
 font-size: medium;
 font-weight: 400;
 transition: 0.15s;
`;

const CommentHistory = styled.div`
 width: 100%;
 height: 260px;
 margin-top: 6px;
 overflow-y: scroll;
 scroll-snap-type: y;
 display: flex;
 flex-direction: column;
`;

// No comments yet, show a message
const NoCommentText = styled.div`
 color: #9593c4;
 font-size: large;
 height: 100%;
 width: 100%;
 display: flex;
 flex-direction: column;
 justify-content: center;
 align-items: center;
`;

const ForeignComment = styled.div`
 display: flex;
 flex-direction: row;
 align-items: flex-start;
 justify-content: left;
 gap: 10px;
 margin-bottom: 12px;
 box-sizing: border-box;
`;

const OwnComment = styled.div`
 display: flex;
 flex-direction: row;
 align-items: flex-start;
 justify-content: right;
 gap: 10px;
 margin-bottom: 12px;
 margin-right: 12px;
 box-sizing: border-box;
`;

const OwnCommentBubble = styled.div`
 background-color: #eeedfa;
 border-radius: 10px;
 box-sizing: border-box;
 padding: 10px;
 width: 57%;
 height: fit-content;
 font-size: 0.8rem;
 display: flex;
 flex-direction: column;
 gap: 5px;
`;

const ForeignUserName = styled.div`
 text-align: left;
 width: 100%;
 height: fit-content;
 color: #35307e;
 font-weight: bold;
`;

const ForeignCommentBubble = styled.div`
 border-style: solid;
 border-radius: 10px;
 border-width: 1px;
 border-color: #d3d3d3;
 box-sizing: border-box;
 padding: 10px;
 width: 57%;
 height: fit-content;
 font-size: 0.8rem;
 display: flex;
 flex-direction: column;
 gap: 5px;
`;
const ChatTimeStamp = styled.div`
 font-size: 0.6rem;
 color: grey;
`;
const Input = styled.input`
 border-radius: 15px;
 width: 100%;
 margin-top: 11px;
 box-sizing: border-box;
 border-style: solid;
 border-color: rgb(221, 221, 221);
 border-width: thin;
 padding: 10px 15px 10px 15px;
 font-size: small;
 color: grey;
 transition: 0.3s;
 &:focus {
  box-shadow: 0px 0px 15px 0px rgba(0, 0, 0, 0.1);
  border-color: #35307e;
 }
`;
