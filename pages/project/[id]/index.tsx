// Components
import TaskCard from '../../../components/cards/TaskCard';
import CounterBlob from '../../../components/misc/CounterBlob';
import styled from 'styled-components';
import TaskModal from '../../../components/modals/TaskModal';

// React and Next
import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';

// Drag and Drop
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd';

// Auth
import { useAuth } from '../../../utils/auth';
import withAuth from '../../../utils/withAuth';

// Firestore
import { firestore } from '../../../utils/firebase';
import { collection, doc, DocumentSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useFirestoreQuery } from '@react-query-firebase/firestore';
import { useQueryClient } from 'react-query';

// Interfaces and Types
import { ITask } from '../../../types/tasks';

const FilterSection = styled.div`
 display: flex;
 flex-direction: row;
 justify-content: space-between;
 align-items: center;
 padding: 5px;
 margin-bottom: 20px;
`;

const SearchField = styled.input`
 border-radius: 1000px;
 width: 200px;
 border-style: solid;
 border-color: rgb(221, 221, 221);
 border-width: thin;
 padding: 6px 15px 6px 15px;
 font-size: large;
 color: grey;
`;

const ColumnsWrapper = styled.div`
 display: flex;
 flex-direction: row;
 justify-content: flex-start;
 gap: 15px;
 /* overflow-x: scroll; */
 /* Hide scrollbar for IE, Edge and Firefox */
 -ms-overflow-style: none;
 scrollbar-width: none;
 /* Hide scrollbar for Chrome, Safari and Opera */
 ::-webkit-scrollbar {
  display: none;
 }
`;

const Column = styled.div`
 padding: 20px 10px 30px 10px;
 background-color: white;
 border-style: solid;
 border-color: rgb(221, 221, 221);
 border-width: thin;
 border-radius: 25px;
 min-height: 75vh;
 min-height: 75vh;
 min-width: 280px;
 width: 100%;
 display: flex;
 flex-direction: column;
 gap: 10px;
`;

const ColumnTitleRow = styled.div`
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: 10px;
 gap: 10px;
 min-height: 40px;
 h2 {
  font-size: 20px;
  font-weight: 500;
  color: #35307e;
  transition: 0.15s;
 }
`;

const TaskList = function TaskList({
 tasks,
 setOpenModal,
}: {
 tasks: ITask[];
 setOpenModal: Function;
}): JSX.Element {
 return (
  <>
   {tasks.map((task: ITask, index: number) => (
    <TaskCard
     onClick={() => {
      setOpenModal(task.uid);
     }}
     index={index}
     uid={task.uid}
     identifier={task.identifier}
     user={task.user}
     title={task.title}
     timestamp={task.timestamp}
     summary={task.summary}
     description={task.description}
     priority={task.priority}
     status={task.status}
     key={index}
     assignedTo={task.assignedTo}
    />
   ))}
  </>
 );
};

const TasksPage: NextPage = () => {
 // Auth
 const { currentUser } = useAuth();

 // Opening and closing Task Modals
 const [openModal, setOpenModal] = useState('');

 // Get Project ID
 const router = useRouter();
 const { id: projectId } = router.query;

 // Initialize states for all columns
 const [tasksSelected, setTasksSelected] = useState([]);
 const countSelected = tasksSelected?.length;

 const [tasksInProgress, setTasksInProgress] = useState([]);
 const countInProgress = tasksInProgress?.length;

 const [tasksInReview, setTasksInReview] = useState([]);
 const countInReview = tasksInReview?.length;

 const [tasksCompleted, setTasksCompleted] = useState([]);
 const countCompleted = tasksCompleted?.length;

 // Query tasks
 const tasksRef = query(
  collection(firestore, 'tasks'),
  where('user', '==', currentUser.uid),
  where('projectId', '==', projectId),
  where('archived', '==', false)
 );
 const tasksQuery = useFirestoreQuery(['tasks'], tasksRef);
 const tasksSnapshot = tasksQuery.data;

 const tasks: ITask[] = tasksSnapshot?.docs.map((doc: DocumentSnapshot) => ({
  ...(doc.data() as ITask),
  uid: doc.id,
 }));

 // Population of Selected for development Column
 const selected = tasks?.filter((task: ITask) => task.column === 'selected-for-development-column');
 // Population of In Progress Column
 const inProgress = tasks?.filter((task: ITask) => task.column === 'in-progress-column');
 // Population of In Review Column
 const inReview = tasks?.filter((task: ITask) => task.column === 'in-review-column');
 // Population of Completed Column
 const completed = tasks?.filter((task: ITask) => task.column === 'completed-column');

 useEffect(() => {
  setTasksSelected(selected);
  setTasksInProgress(inProgress);
  setTasksInReview(inReview);
  setTasksCompleted(completed);
 }, [tasksQuery.isSuccess, tasksQuery.isRefetching]);

 // Task filtering
 const onFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
  setTasksSelected(
   selected.filter((task) => task.title.toLowerCase().includes(e.target.value.toLowerCase()))
  );
  setTasksInProgress(
   inProgress.filter((task) => task.title.toLowerCase().includes(e.target.value.toLowerCase()))
  );
  setTasksInReview(
   inReview.filter((task) => task.title.toLowerCase().includes(e.target.value.toLowerCase()))
  );
  setTasksCompleted(
   completed.filter((task) => task.title.toLowerCase().includes(e.target.value.toLowerCase()))
  );
 };

 // Drag and drop functionality (TODO: Move to seperate file, way to big a function)
 const onDragEnd = async (result: {
  draggableId: string;
  type: string;
  reason: string;
  source: {
   droppableId: string;
   index: number;
  };
  destination: {
   droppableId: string;
   index: number;
  };
 }) => {
  const { destination, source } = result;

  // check if item has been dropped
  if (!destination) return;

  // check if item has changed its position
  if (destination.droppableId === source.droppableId && destination.index === source.index) return;

  //handle item drop in the same column (no status change, only index change)
  if (source.droppableId === destination.droppableId) {
   // determine in which column the task order is being changed
   switch (source.droppableId) {
    case 'selected-for-development-column': {
     let newSelectedTasks = [...tasksSelected];
     newSelectedTasks.splice(destination.index, 0, newSelectedTasks.splice(source.index, 1)[0]); // reordering the array
     setTasksSelected(newSelectedTasks);
     break;
    }
    case 'in-progress-column': {
     let newTasksInProgress = [...tasksInProgress];
     // reordering the array
     let [insert] = newTasksInProgress.splice(source.index, 1);
     newTasksInProgress.splice(destination.index, 0, insert);
     setTasksInProgress(newTasksInProgress);
     break;
    }
    case 'in-review-column': {
     let newTasksInReview = [...tasksInReview];
     newTasksInReview.splice(destination.index, 0, newTasksInReview.splice(source.index, 1)[0]); // reordering the array
     setTasksInReview(newTasksInReview);
     break;
    }
    case 'completed-column': {
     let newTasksCompleted = [...tasksCompleted];
     newTasksCompleted.splice(destination.index, 0, newTasksCompleted.splice(source.index, 1)[0]); // reordering the array
     setTasksCompleted(newTasksCompleted);
     break;
    }
    default:
     break;
   }
  }

  // Handle item drop in a different column ( with status and index change )
  if (source.droppableId != destination.droppableId) {
   let startSourceTasks: ITask[] = [];
   let startDestinationTasks: ITask[] = [];

   // populate the startSourceTasks with a copy of current state
   switch (source.droppableId) {
    case 'selected-for-development-column':
     startSourceTasks = [...tasksSelected];
     break;
    case 'in-progress-column':
     startSourceTasks = [...tasksInProgress];
     break;
    case 'in-review-column':
     startSourceTasks = [...tasksInReview];
     break;
    case 'completed-column':
     startSourceTasks = [...tasksCompleted];
     break;
    default:
     break;
   }

   // delete the tasks within the startSourceTasks
   let [temp] = startSourceTasks.splice(source.index, 1);

   // save the deletion in source column to current state
   switch (source.droppableId) {
    case 'selected-for-development-column':
     setTasksSelected(startSourceTasks);
     break;
    case 'in-progress-column':
     setTasksInProgress(startSourceTasks);
     break;
    case 'in-review-column':
     setTasksInReview(startSourceTasks);
     break;
    case 'completed-column':
     setTasksCompleted(startSourceTasks);
     break;
    default:
     break;
   }

   switch (destination.droppableId) {
    case 'selected-for-development-column':
     {
      startDestinationTasks = [...tasksSelected]; // create copy of current state
      startDestinationTasks.splice(destination.index, 0, temp); // add the previously deleted task to that copy
      setTasksSelected(startDestinationTasks); // save the addition to current state of destination column

      // Change column and status on the task in firebase
      temp.column = destination.droppableId;
      temp.status = 'Selected for Development';
      await setDoc(doc(firestore, 'tasks', temp.uid), {
       ...temp,
      });
     }
     break;
    case 'in-progress-column':
     {
      startDestinationTasks = [...tasksInProgress]; // create copy of current state
      startDestinationTasks.splice(destination.index, 0, temp); // add the previously deleted task to that copy
      setTasksInProgress(startDestinationTasks); // save the addition to current state of destination column

      // Change column and status on the task in firebase
      temp.column = destination.droppableId;
      temp.status = 'In Progress';
      await setDoc(doc(firestore, 'tasks', temp.uid), {
       ...temp,
      });
     }
     break;
    case 'in-review-column':
     {
      startDestinationTasks = [...tasksInReview]; // create copy of current state
      startDestinationTasks.splice(destination.index, 0, temp); // add the previously deleted task to that copy
      setTasksInReview(startDestinationTasks); // save the addition to current state of destination column

      // Change column and status on the task in firebase
      temp.column = destination.droppableId;
      temp.status = 'In Review';
      await setDoc(doc(firestore, 'tasks', temp.uid), {
       ...temp,
      });
     }
     break;
    case 'completed-column':
     {
      startDestinationTasks = [...tasksCompleted]; // create copy of current state
      startDestinationTasks.splice(destination.index, 0, temp); // add the previously deleted task to that copy
      setTasksCompleted(startDestinationTasks); // save the addition to current state of destination column

      // Change column and status on the task in firebase
      temp.column = destination.droppableId;
      temp.status = 'Completed';
      await setDoc(doc(firestore, 'tasks', temp.uid), {
       ...temp,
      });
     }
     break;
    default:
     break;
   }
  }
 };

 return (
  <DragDropContext onDragEnd={onDragEnd}>
   <div>
    <FilterSection>
     <p>
      Search Tasks{' '}
      <span>
       <SearchField type='text' onChange={onFilterChange}></SearchField>
      </span>
     </p>
     <div className='filter-checkbox'></div>
    </FilterSection>
    <ColumnsWrapper>
     <Column>
      <ColumnTitleRow>
       <h2>Selected For Development</h2>
       <CounterBlob count={countSelected} />
      </ColumnTitleRow>
      <Droppable droppableId={'selected-for-development-column'}>
       {(provided: DroppableProvided) => (
        <div
         style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
         }}
         ref={provided.innerRef}
         {...provided.droppableProps}
        >
         {tasksSelected && <TaskList tasks={tasksSelected} setOpenModal={setOpenModal} />}
         {provided.placeholder}
        </div>
       )}
      </Droppable>
     </Column>

     <Column>
      <ColumnTitleRow>
       <h2>In Progress</h2>
       <CounterBlob count={countInProgress} />
      </ColumnTitleRow>
      <Droppable droppableId={'in-progress-column'}>
       {(provided: DroppableProvided) => (
        <div
         style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
         }}
         ref={provided.innerRef}
         {...provided.droppableProps}
        >
         {tasksInProgress && <TaskList tasks={tasksInProgress} setOpenModal={setOpenModal} />}
         {provided.placeholder}
        </div>
       )}
      </Droppable>
     </Column>

     <Column>
      <ColumnTitleRow>
       <h2>In Review</h2>
       <CounterBlob count={countInReview} />
      </ColumnTitleRow>
      <Droppable droppableId={'in-review-column'}>
       {(provided: DroppableProvided) => (
        <div
         style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
         }}
         ref={provided.innerRef}
         {...provided.droppableProps}
        >
         {tasksInReview && <TaskList tasks={tasksInReview} setOpenModal={setOpenModal} />}
         {provided.placeholder}
        </div>
       )}
      </Droppable>
     </Column>

     <Column>
      <ColumnTitleRow>
       <h2>Completed</h2>
       <CounterBlob count={countCompleted} />
      </ColumnTitleRow>
      <Droppable droppableId={'completed-column'}>
       {(provided: DroppableProvided) => (
        <div
         style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
         }}
         ref={provided.innerRef}
         {...provided.droppableProps}
        >
         {tasksCompleted && <TaskList tasks={tasksCompleted} setOpenModal={setOpenModal} />}
         {provided.placeholder}
        </div>
       )}
      </Droppable>
      {openModal && <TaskModal closeModal={setOpenModal} taskId={openModal} />}
     </Column>
    </ColumnsWrapper>
   </div>
  </DragDropContext>
 );
};

// Idee: Hinter completed ein "create new column" erstellen und auch alle draggable machen

export default withAuth(TasksPage);
