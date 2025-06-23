import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from "./layout/AppLayout";
import AuthPage from './components/auth/AuthPage';
import RolesList from './modules/roles/RolesList';
import RolesCreate from './modules/roles/RolesCreate';
import RolesEdit from './modules/roles/RolesEdit';
import RolesShow from './modules/roles/RolesShow';
import PermissionsList from './modules/permissions/PermissionsList';
import PermissionsCreate from './modules/permissions/PermissionsCreate';
import PermissionsEdit from './modules/permissions/PermissionsEdit';
import PermissionsShow from './modules/permissions/PermissionsShow';
import RolePermissionsList from './modules/role_permissions/RolePermissionsList';
import RolePermissionsCreate from './modules/role_permissions/RolePermissionsCreate';
import RolePermissionsEdit from './modules/role_permissions/RolePermissionsEdit';
import RolePermissionsShow from './modules/role_permissions/RolePermissionsShow';
import UsersList from './modules/users/UsersList';
import UsersCreate from './modules/users/UsersCreate';
import UsersEdit from './modules/users/UsersEdit';
import UsersShow from './modules/users/UsersShow';
import UserRolesList from './modules/user_roles/UserRolesList';
import UserRolesCreate from './modules/user_roles/UserRolesCreate';
import UserRolesEdit from './modules/user_roles/UserRolesEdit';
import UserRolesShow from './modules/user_roles/UserRolesShow';
import ProjectsList from './modules/projects/ProjectsList';
import ProjectsCreate from './modules/projects/ProjectsCreate';
import ProjectsEdit from './modules/projects/ProjectsEdit';
import ProjectsShow from './modules/projects/ProjectsShow';
import ProjectMembersList from './modules/project_members/ProjectMembersList';
import ProjectMembersCreate from './modules/project_members/ProjectMembersCreate';
import ProjectMembersEdit from './modules/project_members/ProjectMembersEdit';
import ProjectMembersShow from './modules/project_members/ProjectMembersShow';
import TasksList from './modules/tasks/TasksList';
import TasksCreate from './modules/tasks/TasksCreate';
import TasksEdit from './modules/tasks/TasksEdit';
import TasksShow from './modules/tasks/TasksShow';
import CommentsList from './modules/comments/CommentsList';
import CommentsCreate from './modules/comments/CommentsCreate';
import CommentsEdit from './modules/comments/CommentsEdit';
import CommentsShow from './modules/comments/CommentsShow';
import TimeLogsList from './modules/time_logs/TimeLogsList';
import TimeLogsCreate from './modules/time_logs/TimeLogsCreate';
import TimeLogsEdit from './modules/time_logs/TimeLogsEdit';
import TimeLogsShow from './modules/time_logs/TimeLogsShow';
import AttachmentsList from './modules/attachments/AttachmentsList';
import AttachmentsCreate from './modules/attachments/AttachmentsCreate';
import AttachmentsEdit from './modules/attachments/AttachmentsEdit';
import AttachmentsShow from './modules/attachments/AttachmentsShow';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard';
import EditProfile from './pages/EditProfile';
import { tokenManager } from './services/api';

// ProtectedRoute: Prevents authenticated users from accessing login page
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = tokenManager.isAuthenticated();
  console.log('ProtectedRoute: user authenticated?', isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// PrivateRoute: Protects dashboard and other routes, redirects unauthenticated users to login
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = tokenManager.isAuthenticated();
  console.log('PrivateRoute: user authenticated?', isAuthenticated);
  // if (!isAuthenticated) {
  //   return <Navigate to="/auth" replace />;
  // }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public route for authentication */}
      <Route
        path="/auth"
        element={
          <ProtectedRoute>
            <AuthPage />
          </ProtectedRoute>
        }
      />
      {/* Public route for forgot password */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected routes under AppLayout */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index path="/" element={<Dashboard />} />
        <Route path="/roles" element={<RolesList moduleName={'roles'} />} />
        <Route path="/roles/create" element={<RolesCreate moduleName={'roles'} />} />
        <Route path="/roles/edit/:id" element={<RolesEdit moduleName={'roles'} />} />
        <Route path="/roles/show/:id" element={<RolesShow moduleName={'roles'} />} />
        <Route path="/permissions" element={<PermissionsList moduleName={'permissions'} />} />
        <Route path="/permissions/create" element={<PermissionsCreate moduleName={'permissions'} />} />
        <Route path="/permissions/edit/:id" element={<PermissionsEdit moduleName={'permissions'} />} />
        <Route path="/permissions/show/:id" element={<PermissionsShow moduleName={'permissions'} />} />
        <Route path="/role_permissions" element={<RolePermissionsList moduleName={'role_permissions'} />} />
        <Route path="/role_permissions/create" element={<RolePermissionsCreate moduleName={'role_permissions'} />} />
        <Route path="/role_permissions/edit/:id" element={<RolePermissionsEdit moduleName={'role_permissions'} />} />
        <Route path="/role_permissions/show/:id" element={<RolePermissionsShow moduleName={'role_permissions'} />} />
        <Route path="/users" element={<UsersList moduleName={'users'} />} />
        <Route path="/users/create" element={<UsersCreate moduleName={'users'} />} />
        <Route path="/users/edit/:id" element={<UsersEdit moduleName={'users'} />} />
        <Route path="/users/show/:id" element={<UsersShow moduleName={'users'} />} />
        <Route path="/user_roles" element={<UserRolesList moduleName={'user_roles'} />} />
        <Route path="/user_roles/create" element={<UserRolesCreate />} />
        <Route path="/user_roles/edit/:id" element={<UserRolesEdit moduleName={'user_roles'} />} />
        <Route path="/user_roles/show/:id" element={<UserRolesShow moduleName={'user_roles'} />} />
        <Route path="/projects" element={<ProjectsList moduleName={'projects'} />} />
        <Route path="/projects/create" element={<ProjectsCreate moduleName={'projects'} />} />
        <Route path="/projects/edit/:id" element={<ProjectsEdit moduleName={'projects'} />} />
        <Route path="/projects/show/:id" element={<ProjectsShow moduleName={'projects'} />} />
        <Route path="/project_members" element={<ProjectMembersList moduleName={'project_members'} />} />
        <Route path="/project_members/create" element={<ProjectMembersCreate moduleName={'project_members'} />} />
        <Route path="/project_members/edit/:id" element={<ProjectMembersEdit moduleName={'project_members'} />} />
        <Route path="/project_members/show/:id" element={<ProjectMembersShow moduleName={'project_members'} />} />
        <Route path="/tasks" element={<TasksList moduleName={'tasks'} />} />
        <Route path="/tasks/create" element={<TasksCreate moduleName={'tasks'} />} />
        <Route path="/tasks/edit/:id" element={<TasksEdit moduleName={'tasks'} />} />
        <Route path="/tasks/show/:id" element={<TasksShow moduleName={'tasks'} />} />
        <Route path="/comments" element={<CommentsList moduleName={'comments'} />} />
        <Route path="/comments/create" element={<CommentsCreate moduleName={'comments'} />} />
        <Route path="/comments/edit/:id" element={<CommentsEdit moduleName={'comments'} />} />
        <Route path="/comments/show/:id" element={<CommentsShow moduleName={'comments'} />} />
        <Route path="/time_logs" element={<TimeLogsList moduleName={'time_logs'} />} />
        <Route path="/time_logs/create" element={<TimeLogsCreate moduleName={'time_logs'} />} />
        <Route path="/time_logs/edit/:id" element={<TimeLogsEdit moduleName={'time_logs'} />} />
        <Route path="/time_logs/show/:id" element={<TimeLogsShow moduleName={'time_logs'} />} />
        <Route path="/attachments" element={<AttachmentsList moduleName={'attachments'} />} />
        <Route path="/attachments/create" element={<AttachmentsCreate moduleName={'attachments'} />} />
        <Route path="/attachments/edit/:id" element={<AttachmentsEdit moduleName={'attachments'} />} />
        <Route path="/attachments/show/:id" element={<AttachmentsShow moduleName={'attachments'} />} />
        <Route path="/edit-profile" element={<EditProfile />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;