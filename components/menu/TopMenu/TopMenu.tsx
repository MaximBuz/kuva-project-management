import { useAuth } from '../../../utils/auth';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Modal from '../../modals/NewTaskModal';

import styled from 'styled-components';

const TopMenuWrapper = styled.div`
 position: absolute;
 display: flex;
 align-items: center;
 justify-content: flex-end;
 gap: 30px;
 right: 40px;
 top: 12px;
`;

const TaskButton = styled.div`
 padding: 10px 15px 10px 15px;
 color: white;
 background-color: #35307e;
 border-radius: 100px;
 cursor: pointer;
 transition: 0.3s;
 &:hover {
  transform: scale(1.05);
  box-shadow: 0px 5px 25px 0px rgba(0, 0, 0, 0.15);
 }
`;

const MenuIcon = styled.svg.attrs({
 width: '24',
 height: '24',
 fill: 'none',
 xmlns: 'http://www.w3.org/2000/svg',
})`
 cursor: pointer;
 width: 30px;
 height: 30px;
 transition: 0.3s;
 &:hover {
  transform: scale(1.1);
  path {
   fill: #ff0aba;
  }
 }
 path {
  fill: #929292;
 }
`;

export default function TopMenu() {
 // Get Project Id
 const Router = useRouter();
 const { id: projectId } = Router.query;

 // Handle opening Modal
 const [openModal, setOpenModal] = useState(false);

 // Handle errors
 const [error, setError] = useState('');

 // Handle auth
 const { currentUser, logout } = useAuth();
 async function handleLogout() {
  setError('');
  try {
   await logout();
   Router.replace('/login');
  } catch {
   setError('Failed to logout');
  }
 }

 return (
  <TopMenuWrapper>
   {projectId && (
    <TaskButton
     onClick={() => {
      setOpenModal(!openModal);
     }}
    >
     Add new Task to Backlog
    </TaskButton>
   )}

   {/* <MenuIcon viewBox='0 0 24 24'>
    <path d='M12.3,12.22A4.92,4.92,0,0,0,14,8.5a5,5,0,0,0-10,0,4.92,4.92,0,0,0,1.7,3.72A8,8,0,0,0,1,19.5a1,1,0,0,0,2,0,6,6,0,0,1,12,0,1,1,0,0,0,2,0A8,8,0,0,0,12.3,12.22ZM9,11.5a3,3,0,1,1,3-3A3,3,0,0,1,9,11.5Zm9.74.32A5,5,0,0,0,15,3.5a1,1,0,0,0,0,2,3,3,0,0,1,3,3,3,3,0,0,1-1.5,2.59,1,1,0,0,0-.5.84,1,1,0,0,0,.45.86l.39.26.13.07a7,7,0,0,1,4,6.38,1,1,0,0,0,2,0A9,9,0,0,0,18.74,11.82Z'></path>
   </MenuIcon> */}

   <MenuIcon viewBox='0 0 24 24' onClick={handleLogout}>
    <path d='M4 12C4 12.2652 4.10536 12.5196 4.29289 12.7071C4.48043 12.8946 4.73478 13 5 13H12.59L10.29 15.29C10.1963 15.383 10.1219 15.4936 10.0711 15.6154C10.0203 15.7373 9.9942 15.868 9.9942 16C9.9942 16.132 10.0203 16.2627 10.0711 16.3846C10.1219 16.5064 10.1963 16.617 10.29 16.71C10.383 16.8037 10.4936 16.8781 10.6154 16.9289C10.7373 16.9797 10.868 17.0058 11 17.0058C11.132 17.0058 11.2627 16.9797 11.3846 16.9289C11.5064 16.8781 11.617 16.8037 11.71 16.71L15.71 12.71C15.801 12.6149 15.8724 12.5028 15.92 12.38C16.02 12.1365 16.02 11.8635 15.92 11.62C15.8724 11.4972 15.801 11.3851 15.71 11.29L11.71 7.29C11.6168 7.19676 11.5061 7.1228 11.3842 7.07234C11.2624 7.02188 11.1319 6.99591 11 6.99591C10.8681 6.99591 10.7376 7.02188 10.6158 7.07234C10.4939 7.1228 10.3832 7.19676 10.29 7.29C10.1968 7.38324 10.1228 7.49393 10.0723 7.61575C10.0219 7.73757 9.99591 7.86814 9.99591 8C9.99591 8.13186 10.0219 8.26243 10.0723 8.38425C10.1228 8.50607 10.1968 8.61676 10.29 8.71L12.59 11H5C4.73478 11 4.48043 11.1054 4.29289 11.2929C4.10536 11.4804 4 11.7348 4 12ZM17 2H7C6.20435 2 5.44129 2.31607 4.87868 2.87868C4.31607 3.44129 4 4.20435 4 5V8C4 8.26522 4.10536 8.51957 4.29289 8.70711C4.48043 8.89464 4.73478 9 5 9C5.26522 9 5.51957 8.89464 5.70711 8.70711C5.89464 8.51957 6 8.26522 6 8V5C6 4.73478 6.10536 4.48043 6.29289 4.29289C6.48043 4.10536 6.73478 4 7 4H17C17.2652 4 17.5196 4.10536 17.7071 4.29289C17.8946 4.48043 18 4.73478 18 5V19C18 19.2652 17.8946 19.5196 17.7071 19.7071C17.5196 19.8946 17.2652 20 17 20H7C6.73478 20 6.48043 19.8946 6.29289 19.7071C6.10536 19.5196 6 19.2652 6 19V16C6 15.7348 5.89464 15.4804 5.70711 15.2929C5.51957 15.1054 5.26522 15 5 15C4.73478 15 4.48043 15.1054 4.29289 15.2929C4.10536 15.4804 4 15.7348 4 16V19C4 19.7956 4.31607 20.5587 4.87868 21.1213C5.44129 21.6839 6.20435 22 7 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V5C20 4.20435 19.6839 3.44129 19.1213 2.87868C18.5587 2.31607 17.7956 2 17 2Z' />
   </MenuIcon>

   {openModal && <Modal closeModal={setOpenModal} projectId={Array.isArray(projectId) ? projectId[0] : projectId} currentUser={currentUser}/>}
  </TopMenuWrapper>
 );
}
